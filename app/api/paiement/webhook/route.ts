import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac, timingSafeEqual } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()

    const signature  = req.headers.get('x-webhook-signature') ?? ''
    const timestamp  = req.headers.get('x-webhook-timestamp') ?? ''
    const eventType  = req.headers.get('x-webhook-event') ?? ''
    const deliveryId = req.headers.get('x-webhook-delivery') ?? ''

    const webhookSecret = process.env.GENIUS_PAY_WEBHOOK_SECRET ?? ''

    // Vérification signature HMAC-SHA256(timestamp + "." + payload, secret)
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

      // Protection replay attack
      const tsAge = Math.abs(Date.now() / 1000 - parseInt(timestamp))
      if (tsAge > 300) {
        console.error('Webhook: timestamp trop ancien', tsAge)
        return NextResponse.json({ error: 'Timestamp expiré' }, { status: 400 })
      }
    }

    const payload = JSON.parse(body)
    const event = eventType || payload.event || ''

    // Selon la doc, les données sont dans payload.data (et parfois payload.data.object)
    const txData = payload.data?.object === 'transaction' ? payload.data : payload.data
    const geniusPayId = String(txData?.id ?? payload.data?.id ?? '')
    const bookingReference = txData?.metadata?.booking_reference
                          ?? payload.data?.metadata?.booking_reference
                          ?? ''

    console.log('Webhook reçu:', event, deliveryId, { geniusPayId, bookingReference })

    const admin = createAdminClient() as any

    // Idempotence
    if (geniusPayId) {
      const { data: existing } = await admin
        .from('payment_webhooks')
        .select('id, processed')
        .eq('genius_pay_id', geniusPayId)
        .maybeSingle()

      if (existing?.processed) {
        console.log('Webhook déjà traité:', geniusPayId)
        return NextResponse.json({ ok: true, message: 'Déjà traité' })
      }

      if (!existing) {
        await admin.from('payment_webhooks').insert({
          event_type: event,
          genius_pay_id: geniusPayId,
          payload,
          processed: false,
        })
      }
    }

    // Trouver le paiement via genius_pay_id
    let payment: any = null

    if (geniusPayId) {
      const { data } = await admin
        .from('payments')
        .select('*, bookings(*)')
        .eq('genius_pay_id', geniusPayId)
        .maybeSingle()
      payment = data
    }

    // Fallback via référence dans les metadata
    if (!payment && bookingReference) {
      const { data: bookingByRef } = await admin
        .from('bookings')
        .select('*, payments(*)')
        .eq('reference', bookingReference)
        .maybeSingle()

      if (bookingByRef) {
        if (geniusPayId) {
          await admin.from('payments')
            .update({ genius_pay_id: geniusPayId })
            .eq('booking_id', bookingByRef.id)
        }
        const { data: p } = await admin
          .from('payments')
          .select('*, bookings(*)')
          .eq('booking_id', bookingByRef.id)
          .maybeSingle()
        payment = p
      }
    }

    if (!payment) {
      console.warn('Webhook: paiement introuvable pour', { geniusPayId, bookingReference })
      return NextResponse.json({ ok: true })
    }

    const booking = payment.bookings as Record<string, unknown>

    // Traitement selon l'événement
    if (event === 'payment.success' || txData?.status === 'completed') {

      await Promise.all([
        admin.from('payments').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        }).eq('id', payment.id),

        admin.from('bookings').update({
          status: 'confirmed',
        }).eq('id', booking.id),
      ])

      // Décrémenter les billets pour les événements
      if (booking.item_type === 'event' && booking.tickets_count) {
        const { data: evt } = await admin
          .from('events')
          .select('tickets_sold')
          .eq('id', booking.item_id)
          .single()

        if (evt) {
          await admin.from('events').update({
            tickets_sold: evt.tickets_sold + (booking.tickets_count as number),
          }).eq('id', booking.item_id)
        }
      }

      if (geniusPayId) {
        await admin.from('payment_webhooks')
          .update({ processed: true })
          .eq('genius_pay_id', geniusPayId)
      }

      console.log('✅ Paiement confirmé:', booking.reference)

    } else if (
      event === 'payment.failed' ||
      event === 'payment.cancelled' ||
      event === 'payment.expired' ||
      txData?.status === 'failed' ||
      txData?.status === 'cancelled'
    ) {

      await Promise.all([
        admin.from('payments').update({ status: 'failed' }).eq('id', payment.id),
        admin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id),
      ])

      if (geniusPayId) {
        await admin.from('payment_webhooks')
          .update({ processed: true })
          .eq('genius_pay_id', geniusPayId)
      }

      console.log('❌ Paiement échoué/annulé:', booking.reference, event)

    } else {
      console.log('ℹ️ Événement ignoré:', event)
      if (geniusPayId) {
        await admin.from('payment_webhooks')
          .update({ processed: true })
          .eq('genius_pay_id', geniusPayId)
      }
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Erreur webhook:', err)
    return NextResponse.json({ ok: true })
  }
}