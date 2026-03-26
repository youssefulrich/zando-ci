import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const COMMISSION_RATE = 0.10
// ✅ URL correcte — labpay.genius.ci est le vrai endpoint API
const GENIUS_PAY_BASE_URL = 'https://labpay.genius.ci/api/v1/merchant'

export async function POST(req: NextRequest) {
  const admin = createAdminClient() as any
  let booking: any = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const { itemType, itemId, startDate, endDate, ticketsCount, total, mobilePhone } = body

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()
    const profile = profileRaw as { full_name: string; phone: string } | null

    if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 400 })

    const commissionAmount = Math.round(total * COMMISSION_RATE)
    const ownerAmount = total - commissionAmount

    // Vérifier disponibilité résidences/véhicules
    if (itemType === 'residence' || itemType === 'vehicle') {
      const { data: conflictRaw } = await admin
        .from('bookings')
        .select('id')
        .eq('item_id', itemId)
        .in('status', ['pending', 'confirmed'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)
        .limit(1)
      const conflict = conflictRaw as any[] | null

      if (conflict && conflict.length > 0) {
        return NextResponse.json({ error: 'Ces dates ne sont plus disponibles' }, { status: 409 })
      }
    }

    // Vérifier stock événements
    if (itemType === 'event') {
      const { data: eventRaw } = await admin
        .from('events')
        .select('total_capacity, tickets_sold')
        .eq('id', itemId)
        .single()
      const event = eventRaw as { total_capacity: number; tickets_sold: number } | null

      if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
      if (event.total_capacity - event.tickets_sold < ticketsCount) {
        return NextResponse.json({ error: 'Stock de billets insuffisant' }, { status: 409 })
      }
    }

    // ✅ Vérifier les clés AVANT de créer la réservation
    const apiKey = process.env.GENIUS_PAY_API_KEY
    const apiSecret = process.env.GENIUS_PAY_API_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    console.log('=== DEBUG CLÉS ===')
    console.log('API Key:', apiKey ? apiKey.slice(0, 20) + '...' : 'UNDEFINED')
    console.log('API Secret:', apiSecret ? apiSecret.slice(0, 20) + '...' : 'UNDEFINED')
    console.log('App URL:', appUrl)
    console.log('Base URL:', GENIUS_PAY_BASE_URL)

    if (!apiKey || !apiSecret) {
      console.warn('Genius Pay non configuré')
      return NextResponse.json({ error: 'Paiement non configuré — contactez le support' }, { status: 500 })
    }

    // Créer la réservation
    const { data: bookingRaw, error: bookingError } = await admin
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
    booking = bookingRaw as any

    if (bookingError || !booking) {
      console.error('Erreur création réservation:', bookingError)
      return NextResponse.json({ error: 'Erreur création réservation' }, { status: 500 })
    }

    // Créer l'entrée paiement
    await admin.from('payments').insert({
      booking_id: booking.id,
      amount: total,
      commission_amount: commissionAmount,
      owner_amount: ownerAmount,
      currency: 'XOF',
      status: 'pending',
      mobile_phone: mobilePhone || profile.phone || null,
    })

    // ✅ Appel Genius Pay avec redirect: 'follow' pour suivre les redirects normalement
    const requestBody = {
      amount: total,
      currency: 'XOF',
      description: `Réservation ZandoCI — ${booking.reference}`,
      customer: {
        name: profile.full_name,
        phone: mobilePhone || profile.phone,
        country: 'CI',
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

    console.log('=== APPEL GENIUS PAY ===')
    console.log('URL:', `${GENIUS_PAY_BASE_URL}/payments`)
    console.log('Body:', JSON.stringify(requestBody, null, 2))

    const geniusRes = await fetch(`${GENIUS_PAY_BASE_URL}/payments`, {
      method: 'POST',
      redirect: 'follow', // ✅ follow au lieu de manual
      headers: {
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('=== RÉPONSE GENIUS PAY ===')
    console.log('Status HTTP:', geniusRes.status)
    console.log('Status Text:', geniusRes.statusText)
    console.log('Content-Type:', geniusRes.headers.get('content-type'))

    const responseText = await geniusRes.text()
    console.log('Réponse brute (500 chars):', responseText.slice(0, 500))

    // ✅ Vérifier que c'est du JSON avant de parser
    const contentType = geniusRes.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      console.error('Genius Pay a retourné du non-JSON — statut:', geniusRes.status)
      await admin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      await admin.from('payments').update({ status: 'failed' }).eq('booking_id', booking.id)
      return NextResponse.json({
        error: `Erreur Genius Pay (HTTP ${geniusRes.status}) — réponse non-JSON`
      }, { status: 500 })
    }

    let geniusData: any
    try {
      geniusData = JSON.parse(responseText)
    } catch {
      console.error('Impossible de parser la réponse JSON:', responseText.slice(0, 300))
      await admin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      await admin.from('payments').update({ status: 'failed' }).eq('booking_id', booking.id)
      return NextResponse.json({ error: 'Erreur Genius Pay — réponse invalide' }, { status: 500 })
    }

    console.log('Genius Pay JSON:', JSON.stringify(geniusData, null, 2))

    if (!geniusRes.ok || !geniusData.success) {
      console.error('Genius Pay error:', geniusData)
      await admin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      await admin.from('payments').update({ status: 'failed' }).eq('booking_id', booking.id)
      return NextResponse.json({
        error: geniusData.message || geniusData.error?.message || 'Erreur Genius Pay'
      }, { status: 400 })
    }

    const redirectUrl = geniusData.data?.checkout_url || geniusData.data?.payment_url
    const geniusPayId = String(geniusData.data?.id ?? '')

    if (!redirectUrl) {
      console.error('Pas d\'URL de redirection dans la réponse:', geniusData)
      await admin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      await admin.from('payments').update({ status: 'failed' }).eq('booking_id', booking.id)
      return NextResponse.json({ error: 'URL de paiement manquante' }, { status: 500 })
    }

    await admin.from('payments').update({
      genius_pay_id: geniusPayId,
      payment_url: redirectUrl,
      status: 'processing',
    }).eq('booking_id', booking.id)

    console.log('✅ Paiement initié:', booking.reference, '→', redirectUrl)

    return NextResponse.json({
      payment_url: redirectUrl,
      reference: booking.reference,
      breakdown: { total, commission: commissionAmount, owner_receives: ownerAmount }
    })

  } catch (err) {
    console.error('Erreur initiation paiement:', err)
    // ✅ Annuler la réservation si elle a été créée
    if (booking?.id) {
      await admin.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
      await admin.from('payments').update({ status: 'failed' }).eq('booking_id', booking.id)
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}