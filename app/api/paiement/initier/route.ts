import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const COMMISSION_RATE = 0.10

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const { itemType, itemId, startDate, endDate, ticketsCount, total, paymentMethod, mobilePhone } = body

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()
    const profile = profileRaw as { full_name: string; phone: string } | null

    if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 400 })

    const admin = createAdminClient() as any
    const commissionAmount = Math.round(total * COMMISSION_RATE)
    const ownerAmount = total - commissionAmount

    // Vérifier disponibilité résidences/véhicules
    if (itemType === 'residence' || itemType === 'vehicle') {
      const { data: conflictRaw } = await admin
        .from('bookings').select('id').eq('item_id', itemId)
        .in('status', ['pending', 'confirmed'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`).limit(1)
      const conflict = conflictRaw as any[] | null
      if (conflict && conflict.length > 0)
        return NextResponse.json({ error: 'Ces dates ne sont plus disponibles' }, { status: 409 })
    }

    // Vérifier stock événements
    if (itemType === 'event') {
      const { data: eventRaw } = await admin.from('events').select('total_capacity, tickets_sold').eq('id', itemId).single()
      const event = eventRaw as { total_capacity: number; tickets_sold: number } | null
      if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
      if (event.total_capacity - event.tickets_sold < ticketsCount)
        return NextResponse.json({ error: 'Stock de billets insuffisant' }, { status: 409 })
    }

    // Créer la réservation
    const { data: bookingRaw, error: bookingError } = await admin.from('bookings').insert({
      user_id: user.id, item_type: itemType, item_id: itemId,
      start_date: startDate || null, end_date: endDate || null,
      tickets_count: ticketsCount || null, total_price: total,
      commission_rate: COMMISSION_RATE, commission_amount: commissionAmount,
      owner_amount: ownerAmount, status: 'pending',
      client_name: profile.full_name, client_phone: profile.phone ?? mobilePhone,
    }).select().single()
    const booking = bookingRaw as any

    if (bookingError || !booking) {
      console.error('Erreur création réservation:', bookingError)
      return NextResponse.json({ error: 'Erreur création réservation' }, { status: 500 })
    }

    // Créer l'entrée paiement
    await admin.from('payments').insert({
      booking_id: booking.id, amount: total,
      commission_amount: commissionAmount, owner_amount: ownerAmount,
      currency: 'XOF', status: 'pending',
      payment_method: paymentMethod || null, mobile_phone: mobilePhone || null,
    })

    const apiKey = process.env.GENIUS_PAY_API_KEY
    const apiSecret = process.env.GENIUS_PAY_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // ── VÉRIFICATION VARIABLES D'ENVIRONNEMENT ──
    console.log('=== GENIUS PAY DEBUG ===')
    console.log('API Key présente:', !!apiKey, apiKey?.slice(0, 20))
    console.log('API Secret présente:', !!apiSecret, apiSecret?.slice(0, 20))
    console.log('App URL:', appUrl)
    console.log('Montant:', total, 'XOF')

    if (!apiKey || !apiSecret) {
      console.warn('⚠️ Genius Pay non configuré — variables manquantes')
      // En mode dev sans clés → on simule le succès
      return NextResponse.json({ reference: booking.reference, debug: 'no_api_keys' })
    }

    if (!appUrl || appUrl.includes('localhost')) {
      console.warn('⚠️ NEXT_PUBLIC_APP_URL non configuré pour production:', appUrl)
    }

    // Appel Genius Pay
    const geniusPayload = {
      amount: total,
      currency: 'XOF',
      description: `Réservation Zando CI — ${booking.reference}`,
      customer: {
        name: profile.full_name,
        phone: mobilePhone || profile.phone,
      },
      metadata: {
        booking_id: booking.id,
        booking_reference: booking.reference,
        commission_amount: commissionAmount,
        owner_amount: ownerAmount,
      },
      success_url: `${appUrl}/paiement/succes?ref=${booking.reference}`,
      error_url: `${appUrl}/paiement/annulation?ref=${booking.reference}`,
    }

    console.log('Payload envoyé à Genius Pay:', JSON.stringify(geniusPayload, null, 2))

    const geniusRes = await fetch('https://pay.genius.ci/api/v1/merchant/payments', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geniusPayload),
    })

    const geniusData = await geniusRes.json()
    console.log('=== GENIUS PAY RESPONSE ===')
    console.log('Status HTTP:', geniusRes.status)
    console.log('Response:', JSON.stringify(geniusData, null, 2))
    console.log('checkout_url:', geniusData.data?.checkout_url)
    console.log('payment_url:', geniusData.data?.payment_url)

    if (!geniusRes.ok || !geniusData.success) {
      console.error('❌ Genius Pay ERREUR:', geniusData)
      await admin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      await admin.from('payments').update({ status: 'failed' }).eq('booking_id', booking.id)
      return NextResponse.json({
        error: geniusData.message || geniusData.error || `Genius Pay erreur ${geniusRes.status}`,
        genius_response: geniusData,
      }, { status: 400 })
    }

    const redirectUrl = geniusData.data?.checkout_url || geniusData.data?.payment_url

    if (!redirectUrl) {
      console.error('❌ Pas de checkout_url dans la réponse Genius Pay:', geniusData)
      await admin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      await admin.from('payments').update({ status: 'failed' }).eq('booking_id', booking.id)
      return NextResponse.json({
        error: 'Genius Pay n\'a pas retourné d\'URL de paiement',
        genius_response: geniusData,
      }, { status: 400 })
    }

    const geniusPayId = String(geniusData.data?.id ?? '')
    await admin.from('payments').update({
      genius_pay_id: geniusPayId,
      payment_url: redirectUrl,
      status: 'processing',
    }).eq('booking_id', booking.id)

    console.log('✅ Genius Pay OK — redirect vers:', redirectUrl)

    return NextResponse.json({
      payment_url: redirectUrl,
      reference: booking.reference,
      breakdown: { total, commission: commissionAmount, owner_receives: ownerAmount }
    })

  } catch (err) {
    console.error('Erreur initiation paiement:', err)
    return NextResponse.json({ error: 'Erreur serveur: ' + String(err) }, { status: 500 })
  }
}