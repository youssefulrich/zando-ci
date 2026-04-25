'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'

type Props = {
  event: {
    id: string
    owner_id: string
    price_per_ticket: number
    profiles?: {
      full_name?: string | null
      phone?: string | null
    } | null
  }
  remaining: number
  isLoggedIn: boolean
  isPast: boolean
  organizerWhatsapp?: string | null
  organizerPhone?: string | null
}

export default function BookingFormEvent({
  event,
  remaining,
  isLoggedIn,
  isPast,
  organizerWhatsapp,
  organizerPhone
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const max = Math.min(remaining, 10)
  const total = quantity * event.price_per_ticket

  function normalizePhone(phone: string) {
    if (!phone) return ''
    let p = phone.replace(/\D/g, '')
    if (p.startsWith('225')) return p
    return '225' + p
  }

  async function handleReservation() {
    if (!isLoggedIn) { router.push('/login'); return }

    setLoading(true)
    setErrorMsg('')

    const ref = 'ZEV-' + Math.random().toString(36).slice(2, 10).toUpperCase()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) { router.push('/login'); return }
    const user = userData.user

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle()
    const profile = profileRaw as any

    const { error } = await (supabase as any)
      .from('bookings')
      .insert({
        reference: ref,
        item_type: 'event',
        item_id: event.id,
        tickets_count: quantity,
        total_price: total,
        user_id: user.id,
        client_name: profile?.full_name ?? user.email ?? '',
        client_phone: profile?.phone ?? '',
        status: 'pending'
      })

    if (error) {
      console.error('Booking error:', error)
      setErrorMsg(`Erreur : ${error.message}`)
      setLoading(false)
      return
    }

    // Notification organisateur
    await (supabase as any).from('notifications').insert({
      user_id: event.owner_id,
      title: '🎟️ Nouvelle réservation',
      message: `${quantity} billet(s) demandés — Réf: ${ref}`,
      type: 'success'
    })

    // WhatsApp
    const phone =
      normalizePhone(organizerWhatsapp ?? '') ||
      normalizePhone(organizerPhone ?? '') ||
      ''

    const msg = encodeURIComponent(
      `Bonjour, je viens de réserver ${quantity} billet(s).\nRéférence : ${ref}\nTotal : ${formatPrice(total)} FCFA`
    )
    const wa = phone ? `https://wa.me/${phone}?text=${msg}` : ''

    router.push(
      `/event/confirmation?ref=${ref}&wa=${encodeURIComponent(wa)}&total=${total}&qty=${quantity}`
    )
  }

  if (isPast) return (
    <p style={{ color: 'gray', textAlign: 'center' }}>Cet événement est terminé</p>
  )

  if (remaining <= 0) return (
    <p style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', padding: 12, borderRadius: 10, textAlign: 'center' }}>Complet</p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Quantité */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>Nombre de billets</p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 18, cursor: 'pointer' }}
          >−</button>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', minWidth: 20, textAlign: 'center' }}>{quantity}</span>
          <button
            onClick={() => setQuantity(q => Math.min(max, q + 1))}
            style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 18, cursor: 'pointer' }}
          >+</button>
          <span style={{ opacity: 0.4, fontSize: 12 }}>max {max}</span>
        </div>
      </div>

      {/* Total */}
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
        Total : <strong style={{ color: '#a78bfa', fontSize: 16 }}>{formatPrice(total)} FCFA</strong>
      </p>

      {/* Erreur */}
      {errorMsg && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ fontSize: 13, color: '#f87171' }}>⚠️ {errorMsg}</p>
        </div>
      )}

      {/* Bouton */}
      <button
        onClick={handleReservation}
        disabled={loading}
        style={{ padding: 14, background: loading ? 'rgba(167,139,250,0.4)' : '#a78bfa', borderRadius: 10, border: 'none', color: 'white', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Traitement...' : `Réserver — ${formatPrice(total)} FCFA`}
      </button>
    </div>
  )
}