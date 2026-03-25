import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const COMMISSION_RATE = 0.10

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { itemType, itemId, startDate, endDate, ticketsCount, total, paymentMethod, mobilePhone } = body

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()

    const profile = profileRaw as { full_name: string; phone: string } | null

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 400 })
    }

    const admin = createAdminClient() as any

    const commissionAmount = Math.round(total * COMMISSION_RATE)
    const ownerAmount = total - commissionAmount

    // Vérifications (inchangées)
    if (itemType === 'residence' || itemType === 'vehicle') {
      const { data: conflictRaw } = await admin
        .from('bookings')
        .select('id')
        .eq('item_id', itemId)
        .in('status', ['pending', 'confirmed'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)
        .limit(1)

      if (conflictRaw && conflictRaw.length > 0) {
        return NextResponse.json({ error: 'Ces dates ne sont plus disponibles' }, { status: 409 })
      }
    }

    if (itemType === 'event') {
      const { data: eventRaw } = await admin
        .from('events')
        .select('total_capacity, tickets_sold')
        .eq('id', itemId)
        .single()

      const event = eventRaw as { total_capacity: number; tickets_sold: number } | null

      if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

      if (event.total_capacity - event.tickets_sold < ticketsCount) {
        return NextResponse.json({ error: 'Stock insuffisant' }, { status: 409 })
      }
    }

    // Création réservation
    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .insert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        start_date: startDate || null,
        end_date: endDate || null,
        tickets_count: ticketsCount || null,
        total_price: total,
        commission_rate: COMMISSION_RATE,
        commission_amount: commissionAmount,
        owner_amount: ownerAmount,
        status: 'pending',
        client_name: profile.full_name,
        client_phone: profile.phone ?? mobilePhone,
      })
      .select()
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Erreur création réservation' }, { status: 500 })
    }

    await admin.from('payments').insert({
      booking_id: booking.id,
      amount: total,
      commission_amount: commissionAmount,
      owner_amount: ownerAmount,
      currency: 'XOF',
      status: 'pending',
      payment_method: paymentMethod,
      mobile_phone: mobilePhone,
    })

    // ✅ CONFIG GENIUS PAY
    const apiKey = process.env.GENIUS_PAY_API_KEY
    const apiSecret = process.env.GENIUS_PAY_API_SECRET
    const baseUrl = process.env.GENIUS_PAY_BASE_URL || 'https://pay.genius.ci'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!apiKey || !apiSecret) {
      console.error('ENV manquantes')
      return NextResponse.json({ error: 'Config paiement invalide' }, { status: 500 })
    }

    // ✅ APPEL API
    const geniusRes = await fetch(`${baseUrl}/api/v1/merchant/payments`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
        },
        success_url: `${appUrl}/paiement/succes?ref=${booking.reference}`,
        error_url: `${appUrl}/paiement/annulation?ref=${booking.reference}`,
        cancel_url: `${appUrl}/paiement/annulation?ref=${booking.reference}`, // 🔥 OBLIGATOIRE

      }),
    })

    // ✅ FIX ERREUR HTML
    const text = await geniusRes.text()

    let geniusData
    try {
      geniusData = JSON.parse(text)
    } catch {
      console.error('Réponse non JSON:', text)
      return NextResponse.json({ error: 'Mauvaise réponse Genius Pay' }, { status: 500 })
    }

    console.log('Genius Pay response:', geniusData)

    if (!geniusRes.ok || !geniusData.success) {
      return NextResponse.json({ error: geniusData.message || 'Erreur paiement' }, { status: 400 })
    }

    const redirectUrl =
      geniusData.data?.checkout_url ||
      geniusData.data?.payment_url

    await admin.from('payments').update({
      genius_pay_id: geniusData.data?.id,
      payment_url: redirectUrl,
      status: 'processing',
    }).eq('booking_id', booking.id)

    return NextResponse.json({
      payment_url: redirectUrl,
      reference: booking.reference,
    })

  } catch (err) {
    console.error('Erreur initiation paiement:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}