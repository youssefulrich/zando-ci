import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac, timingSafeEqual, randomBytes } from 'crypto'
import { sendEventTicket, sendResidenceConfirmation, sendVehicleConfirmation } from '@/lib/email'
import {
  sendWhatsAppEventTicket,
  sendWhatsAppResidenceConfirmation,
  sendWhatsAppVehicleConfirmation,
  sendWhatsAppOwnerNewBooking,
} from '@/lib/whatsapp'

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

// ─── Créer une notification in-app ───────────────────────────────────────────
async function createNotification(
  admin: any,
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  link?: string
) {
  try {
    await admin.from('notifications').insert({ user_id: userId, title, message, type, link })
    console.log(`[Notif] ✅ Notification créée pour ${userId}: ${title}`)
  } catch (err) {
    console.error('[Notif] Erreur création notification:', err)
  }
}

// ─── Envoi emails + WhatsApp selon type de réservation ───────────────────────
async function sendConfirmations(
  admin: any,
  booking: Record<string, unknown>,
  customerName: string,
  customerEmail: string,
  customerPhone: string
) {
  const fmt = (d: string) =>
    new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))

  try {
    if (booking.item_type === 'event') {
      const { data: evt } = await admin
        .from('events')
        .select('title, event_date, event_time, venue_name, price_per_ticket')
        .eq('id', booking.item_id)
        .single()

      if (evt) {
        const { data: tickets } = await admin
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

        const ticketCodes = (tickets ?? []).map((t: any) => t.code)

        // Email
        if (customerEmail) {
          await sendEventTicket({
            to: customerEmail,
            customerName,
            eventName: evt.title,
            eventDate: fmt(evt.event_date),
            eventTime: evt.event_time ?? '00:00',
            eventLocation: evt.venue_name,
            ticketsCount: (booking.tickets_count as number) ?? 1,
            totalPrice: booking.total_price as number,
            reference: booking.reference as string,
            unitPrice: evt.price_per_ticket,
            ticketLinks,
          })
          console.log(`[Email] 🎟️ Ticket(s) envoyé(s) → ${customerEmail}`)
        }

        // WhatsApp
        if (customerPhone) {
          await sendWhatsAppEventTicket({
            phone: customerPhone,
            customerName,
            eventName: evt.title,
            eventDate: fmt(evt.event_date),
            eventTime: evt.event_time ?? '00:00',
            eventLocation: evt.venue_name,
            ticketsCount: (booking.tickets_count as number) ?? 1,
            totalPrice: booking.total_price as number,
            reference: booking.reference as string,
            ticketCodes,
          })
        }
      }

    } else if (booking.item_type === 'residence') {
      const { data: res } = await admin
        .from('residences')
        .select('title, city, owner_id, profiles:owner_id(phone, full_name)')
        .eq('id', booking.item_id)
        .single()

      if (res) {
        const nights = booking.start_date && booking.end_date
          ? Math.ceil((new Date(booking.end_date as string).getTime() - new Date(booking.start_date as string).getTime()) / 86400000)
          : 1
        const ownerPhone = (res.profiles as any)?.phone
        const ownerName = (res.profiles as any)?.full_name ?? 'Propriétaire'

        // Email client
        if (customerEmail) {
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
            ownerPhone,
          })
          console.log(`[Email] 🏠 Confirmation résidence → ${customerEmail}`)
        }

        // WhatsApp client
        if (customerPhone) {
          await sendWhatsAppResidenceConfirmation({
            phone: customerPhone,
            customerName,
            residenceName: res.title,
            city: res.city,
            startDate: fmt(booking.start_date as string),
            endDate: fmt(booking.end_date as string),
            nights,
            totalPrice: booking.total_price as number,
            reference: booking.reference as string,
            ownerPhone,
          })
        }

        // WhatsApp propriétaire — nouvelle réservation
        if (ownerPhone) {
          await sendWhatsAppOwnerNewBooking({
            phone: ownerPhone,
            ownerName,
            itemName: res.title,
            itemType: 'residence',
            customerName,
            startDate: fmt(booking.start_date as string),
            endDate: fmt(booking.end_date as string),
            totalPrice: booking.total_price as number,
            reference: booking.reference as string,
            bookingId: booking.id as string,
          })
        }

        // Notification in-app propriétaire
        await createNotification(
          admin,
          res.owner_id,
          '🏠 Nouvelle réservation',
          `${customerName} a réservé "${res.title}" du ${fmt(booking.start_date as string)} au ${fmt(booking.end_date as string)}`,
          'success',
          `/dashboard/proprietaire/reservations/${booking.id}`
        )
      }

    } else if (booking.item_type === 'vehicle') {
      const { data: veh } = await admin
        .from('vehicles')
        .select('title, city, owner_id, profiles:owner_id(phone, full_name)')
        .eq('id', booking.item_id)
        .single()

      if (veh) {
        const days = booking.start_date && booking.end_date
          ? Math.ceil((new Date(booking.end_date as string).getTime() - new Date(booking.start_date as string).getTime()) / 86400000)
          : 1
        const ownerPhone = (veh.profiles as any)?.phone
        const ownerName = (veh.profiles as any)?.full_name ?? 'Loueur'

        // Email client
        if (customerEmail) {
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
            ownerPhone,
          })
          console.log(`[Email] 🚗 Confirmation véhicule → ${customerEmail}`)
        }

        // WhatsApp client
        if (customerPhone) {
          await sendWhatsAppVehicleConfirmation({
            phone: customerPhone,
            customerName,
            vehicleName: veh.title,
            city: veh.city,
            startDate: fmt(booking.start_date as string),
            endDate: fmt(booking.end_date as string),
            days,
            totalPrice: booking.total_price as number,
            reference: booking.reference as string,
            ownerPhone,
          })
        }

        // WhatsApp propriétaire — nouvelle réservation
        if (ownerPhone) {
          await sendWhatsAppOwnerNewBooking({
            phone: ownerPhone,
            ownerName,
            itemName: veh.title,
            itemType: 'vehicle',
            customerName,
            startDate: fmt(booking.start_date as string),
            endDate: fmt(booking.end_date as string),
            totalPrice: booking.total_price as number,
            reference: booking.reference as string,
            bookingId: booking.id as string,
          })
        }

        // Notification in-app propriétaire
        await createNotification(
          admin,
          veh.owner_id,
          '🚗 Nouvelle réservation',
          `${customerName} a réservé "${veh.title}" du ${fmt(booking.start_date as string)} au ${fmt(booking.end_date as string)}`,
          'success',
          `/dashboard/proprietaire/reservations/${booking.id}`
        )
      }
    }

    // Notification in-app client — confirmation paiement
    await createNotification(
      admin,
      booking.user_id as string,
      '✅ Paiement confirmé',
      `Votre réservation ${booking.reference} a été confirmée avec succès`,
      'success',
      `/dashboard/reservations`
    )

  } catch (err) {
    console.error('[Confirmations] Erreur:', err)
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

      // Récupérer email depuis auth.users + profil
      const { data: authUser } = await admin.auth.admin.getUserById(booking.user_id as string)
      const { data: customerProfile } = await admin
        .from('profiles').select('full_name, phone').eq('id', booking.user_id).single()

      const customerEmail = authUser?.user?.email ?? ''
      const customerName = customerProfile?.full_name ?? 'Client'
      const customerPhone = customerProfile?.phone ?? booking.client_phone as string ?? ''

      console.log('[Confirmations] Client:', customerName, '| Email:', customerEmail || 'AUCUN', '| Phone:', customerPhone || 'AUCUN')

      await sendConfirmations(admin, booking, customerName, customerEmail, customerPhone)

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

      // Notification in-app client — paiement échoué
      await createNotification(
        admin,
        booking.user_id as string,
        '❌ Paiement échoué',
        `Votre paiement pour la réservation ${booking.reference} a échoué`,
        'error',
        `/dashboard/reservations`
      )

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