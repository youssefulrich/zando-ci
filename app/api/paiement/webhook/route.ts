import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac, timingSafeEqual, randomBytes } from 'crypto'
import { sendEventTicket, sendResidenceConfirmation, sendVehicleConfirmation } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zando-ci.vercel.app'

function generateTicketCode(): string {
  return 'ZANDO-EVT-' + randomBytes(8).toString('hex').toUpperCase()
}

// ─── Génération des tickets numériques ───────────────────────────────────────
async function generateTickets(
  admin: any,
  booking: Record<string, unknown>
): Promise<{ code: string; ticket_number: number; total_in_booking: number }[]> {
  const ticketsCount = booking.tickets_count as number
  if (!ticketsCount || ticketsCount < 1) return []

  const ticketsToInsert = Array.from({ length: ticketsCount }, (_, i) => ({
    booking_id: booking.id,
    event_id: booking.item_id,
    user_id: booking.user_id,
    code: generateTicketCode(),
    ticket_number: i + 1,
    total_in_booking: ticketsCount,
    status: 'valid',
  }))

  const { data: createdTickets, error } = await admin
    .from('tickets')
    .insert(ticketsToInsert)
    .select()

  if (error) {
    console.error('[Tickets] Erreur génération:', error)
    return []
  }

  console.log(`[Tickets] ✅ ${ticketsCount} ticket(s) généré(s) pour la réservation ${booking.reference}`)
  return createdTickets ?? []
}

// ─── Envoi emails selon type de réservation ───────────────────────────────────
async function sendConfirmationEmail(
  admin: ReturnType<typeof createAdminClient>,
  booking: Record<string, unknown>,
  customerName: string,
  customerEmail: string
) {
  if (!customerEmail) return

  const fmt = (d: string) =>
    new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))

  try {
    if (booking.item_type === 'event') {
      const { data: evt } = await (admin as any)
        .from('events')
        .select('title, event_date, event_time, venue_name, venue_address, city, price_per_ticket')
        .eq('id', booking.item_id)
        .single()

      if (evt) {
        const { data: tickets } = await (admin as any)
          .from('tickets')
          .select('code, ticket_number, total_in_booking')
          .eq('booking_id', booking.id)
          .order('ticket_number')

        const ticketLinks = (tickets ?? []).map((t: any) => ({
          code: t.code,
          ticket_number: t.ticket_number,
          total_in_booking: t.total_in_booking,
          verify_url: `${APP_URL}/verify/${t.code}`,
        }))

        await sendEventTicket({
          to: customerEmail,
          customerName,
          eventName: evt.title,
          eventDate: fmt(evt.event_date ?? evt.date),
          eventTime: evt.event_time ?? evt.time ?? '00:00',
          eventLocation: evt.venue_name ?? evt.location,
          ticketsCount: (booking.tickets_count as number) ?? 1,
          totalPrice: booking.total_price as number,
          reference: booking.reference as string,
          unitPrice: evt.price_per_ticket ?? evt.ticket_price,
          ticketLinks,
        })
        console.log(`[Email] 🎟️ Ticket(s) envoyé(s) → ${customerEmail}`)
      }

    } else if (booking.item_type === 'residence') {
      const { data: res } = await (admin as any)
        .from('residences')
        .select('title, city, profiles:owner_id(phone)')
        .eq('id', booking.item_id)
        .single()

      if (res) {
        const nights = booking.start_date && booking.end_date
          ? Math.ceil((new Date(booking.end_date as string).getTime() - new Date(booking.start_date as string).getTime()) / 86400000)
          : 1

        await sendResidenceConfirmation({
          to: customerEmail,
          customerName,
          residenceName: res.title,
          city: res.city,
          startDate: fmt(booking.start_date as string),
          endDate: fmt(booking.end_date as string),
          nights,
          totalPrice: booking.total_price as number,
          reference: booking.reference as string,
          ownerPhone: (res.profiles as { phone?: string })?.phone,
        })
        console.log(`[Email] 🏠 Confirmation résidence → ${customerEmail}`)
      }

    } else if (booking.item_type === 'vehicle') {
      const { data: veh } = await (admin as any)
        .from('vehicles')
        .select('title, city, profiles:owner_id(phone)')
        .eq('id', booking.item_id)
        .single()

      if (veh) {
        const days = booking.start_date && booking.end_date
          ? Math.ceil((new Date(booking.end_date as string).getTime() - new Date(booking.start_date as string).getTime()) / 86400000)
          : 1

        await sendVehicleConfirmation({
          to: customerEmail,
          customerName,
          vehicleName: veh.title,
          city: veh.city,
          startDate: fmt(booking.start_date as string),
          endDate: fmt(booking.end_date as string),
          days,
          totalPrice: booking.total_price as number,
          reference: booking.reference as string,
          ownerPhone: (veh.profiles as { phone?: string })?.phone,
        })
        console.log(`[Email] 🚗 Confirmation véhicule → ${customerEmail}`)
      }
    }
  } catch (emailErr) {
    console.error('[Email] Erreur envoi:', emailErr)
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()

    const signature  = req.headers.get('x-webhook-signature') ?? ''
    const timestamp  = req.headers.get('x-webhook-timestamp') ?? ''
    const eventType  = req.headers.get('x-webhook-event') ?? ''
    const deliveryId = req.headers.get('x-webhook-delivery') ?? ''

    const webhookSecret = process.env.GENIUS_PAY_WEBHOOK_SECRET ?? ''

    if (webhookSecret && signature && timestamp) {
      const data = `${timestamp}.${body}`
      const expected = createHmac('sha256', webhookSecret).update(data).digest('hex')
      try {
        const sigBuffer = Buffer.from(signature, 'hex')
        const expBuffer = Buffer.from(expected, 'hex')
        if (sigBuffer.length !== expBuffer.length || !timingSafeEqual(sigBuffer, expBuffer)) {
          console.error('Webhook: signature invalide')
          return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
        }
      } catch {
        console.error('Webhook: erreur vérification signature')
        return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
      }
      const tsAge = Math.abs(Date.now() / 1000 - parseInt(timestamp))
      if (tsAge > 300) {
        console.error('Webhook: timestamp trop ancien', tsAge)
        return NextResponse.json({ error: 'Timestamp expiré' }, { status: 400 })
      }
    }

    const payload = JSON.parse(body)
    const event = eventType || payload.event || ''
    const txData = payload.data?.object === 'transaction' ? payload.data : payload.data
    const geniusPayId = String(txData?.id ?? payload.data?.id ?? '')
    const bookingReference = txData?.metadata?.booking_reference ?? payload.data?.metadata?.booking_reference ?? ''

    console.log('Webhook reçu:', event, deliveryId, { geniusPayId, bookingReference })

    const admin = createAdminClient() as any

    // Idempotence
    if (geniusPayId) {
      const { data: existing } = await admin
        .from('payment_webhooks').select('id, processed').eq('genius_pay_id', geniusPayId).maybeSingle()
      if (existing?.processed) {
        console.log('Webhook déjà traité:', geniusPayId)
        return NextResponse.json({ ok: true, message: 'Déjà traité' })
      }
      if (!existing) {
        await admin.from('payment_webhooks').insert({ event_type: event, genius_pay_id: geniusPayId, payload, processed: false })
      }
    }

    // Trouver le paiement
    let payment: any = null
    if (geniusPayId) {
      const { data } = await admin.from('payments').select('*, bookings(*)').eq('genius_pay_id', geniusPayId).maybeSingle()
      payment = data
    }
    if (!payment && bookingReference) {
      const { data: bookingByRef } = await admin.from('bookings').select('*, payments(*)').eq('reference', bookingReference).maybeSingle()
      if (bookingByRef) {
        if (geniusPayId) await admin.from('payments').update({ genius_pay_id: geniusPayId }).eq('booking_id', bookingByRef.id)
        const { data: p } = await admin.from('payments').select('*, bookings(*)').eq('booking_id', bookingByRef.id).maybeSingle()
        payment = p
      }
    }

    if (!payment) {
      console.warn('Webhook: paiement introuvable pour', { geniusPayId, bookingReference })
      return NextResponse.json({ ok: true })
    }

    const booking = payment.bookings as Record<string, unknown>

    // ── Paiement réussi ────────────────────────────────────────────────────────
    if (event === 'payment.success' || txData?.status === 'completed') {

      await Promise.all([
        admin.from('payments').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', payment.id),
        admin.from('bookings').update({ status: 'confirmed' }).eq('id', booking.id),
      ])

      // Générer les tickets si c'est un événement
      if (booking.item_type === 'event' && booking.tickets_count) {
        const { data: evt } = await admin.from('events').select('tickets_sold').eq('id', booking.item_id).single()
        if (evt) {
          await admin.from('events').update({
            tickets_sold: evt.tickets_sold + (booking.tickets_count as number),
          }).eq('id', booking.item_id)
        }
        await generateTickets(admin, booking)
      }

      // ✅ Récupérer email depuis auth.users (fiable) + nom depuis profiles
      const { data: authUser } = await admin.auth.admin.getUserById(booking.user_id as string)
      const { data: customerProfile } = await admin
        .from('profiles').select('full_name').eq('id', booking.user_id).single()

      const customerEmail = authUser?.user?.email ?? ''
      const customerName = customerProfile?.full_name ?? 'Client'

      console.log('[Email] Client:', customerName, '→', customerEmail || 'PAS D\'EMAIL')

      if (customerEmail) {
        await sendConfirmationEmail(admin, booking, customerName, customerEmail)
      } else {
        console.warn('[Email] Pas d\'email trouvé pour user_id:', booking.user_id)
      }

      if (geniusPayId) await admin.from('payment_webhooks').update({ processed: true }).eq('genius_pay_id', geniusPayId)
      console.log('✅ Paiement confirmé:', booking.reference)

    // ── Paiement échoué / annulé ───────────────────────────────────────────────
    } else if (
      event === 'payment.failed' || event === 'payment.cancelled' || event === 'payment.expired' ||
      txData?.status === 'failed' || txData?.status === 'cancelled'
    ) {
      await Promise.all([
        admin.from('payments').update({ status: 'failed' }).eq('id', payment.id),
        admin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id),
      ])
      if (geniusPayId) await admin.from('payment_webhooks').update({ processed: true }).eq('genius_pay_id', geniusPayId)
      console.log('❌ Paiement échoué/annulé:', booking.reference, event)

    } else {
      console.log('ℹ️ Événement ignoré:', event)
      if (geniusPayId) await admin.from('payment_webhooks').update({ processed: true }).eq('genius_pay_id', geniusPayId)
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Erreur webhook:', err)
    return NextResponse.json({ ok: true })
  }
}