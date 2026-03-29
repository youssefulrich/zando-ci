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
    const { itemType, itemId, startDate, endDate, ticketsCount, total } = body

    if (!itemType || !itemId || !total) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    if (itemType !== 'residence' && itemType !== 'vehicle') {
      return NextResponse.json({ error: 'Type invalide pour ce flow' }, { status: 400 })
    }

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

    // Vérifier disponibilité
    const { data: conflictRaw } = await admin
      .from('bookings')
      .select('id')
      .eq('item_id', itemId)
      .in('status', ['pending_contact', 'confirmed'])
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)
      .limit(1)

    if (conflictRaw && conflictRaw.length > 0) {
      return NextResponse.json({ error: 'Ces dates ne sont plus disponibles' }, { status: 409 })
    }

    // Récupérer infos item + proprio
    let ownerPhone = ''
    let ownerName = ''
    let itemName = ''

    if (itemType === 'residence') {
      const { data: res } = await admin
        .from('residences')
        .select('title, profiles:owner_id(full_name, phone, orange_money, wave, mtn_money)')
        .eq('id', itemId)
        .single()

      if (res) {
        itemName = res.title
        const ownerProfile = res.profiles as any
        ownerName = ownerProfile?.full_name ?? ''
        // Prendre le premier numéro Mobile Money disponible
        ownerPhone = ownerProfile?.phone
          ?? ownerProfile?.orange_money
          ?? ownerProfile?.wave
          ?? ownerProfile?.mtn_money
          ?? ''
      }
    } else if (itemType === 'vehicle') {
      const { data: veh } = await admin
        .from('vehicles')
        .select('title, profiles:owner_id(full_name, phone, orange_money, wave, mtn_money)')
        .eq('id', itemId)
        .single()

      if (veh) {
        itemName = veh.title
        const ownerProfile = veh.profiles as any
        ownerName = ownerProfile?.full_name ?? ''
        ownerPhone = ownerProfile?.phone
          ?? ownerProfile?.orange_money
          ?? ownerProfile?.wave
          ?? ownerProfile?.mtn_money
          ?? ''
      }
    }

    // Créer la réservation avec status pending_contact
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
        status: 'pending_contact', // ← nouveau statut : pas encore de paiement
        client_name: profile.full_name,
        client_phone: profile.phone,
      })
      .select()
      .single()

    if (bookingError || !bookingRaw) {
      console.error('Erreur création réservation:', bookingError)
      return NextResponse.json({ error: 'Erreur création réservation' }, { status: 500 })
    }

    const booking = bookingRaw as any

    // Créer notification in-app pour le propriétaire
    try {
      // Récupérer owner_id
      const table = itemType === 'residence' ? 'residences' : 'vehicles'
      const { data: item } = await admin.from(table).select('owner_id').eq('id', itemId).single()

      if (item?.owner_id) {
        const fmt = (d: string) => new Intl.DateTimeFormat('fr-FR', {
          day: 'numeric', month: 'long'
        }).format(new Date(d))

        await admin.from('notifications').insert({
          user_id: item.owner_id,
          title: `${itemType === 'residence' ? '🏠' : '🚗'} Nouvelle demande de réservation`,
          message: `${profile.full_name} souhaite ${itemType === 'residence' ? 'réserver' : 'louer'} "${itemName}"${startDate ? ` du ${fmt(startDate)} au ${fmt(endDate)}` : ''}`,
          type: 'success',
          link: `/dashboard/proprietaire/reservations/${booking.id}`,
        })
      }
    } catch (notifErr) {
      console.error('[Notif] Erreur:', notifErr)
    }

    console.log(`✅ Demande créée: ${booking.reference} | Proprio: ${ownerName} | Tel: ${ownerPhone}`)

    return NextResponse.json({
      reference: booking.reference,
      owner_phone: ownerPhone,
      owner_name: ownerName,
      item_name: itemName,
    })

  } catch (err) {
    console.error('Erreur demande réservation:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}