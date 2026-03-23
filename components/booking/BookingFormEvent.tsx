// =============================================
// BookingFormEvent.tsx
// =============================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

type Props = {
  event: { id: string; price_per_ticket: number }
  remaining: number
  isLoggedIn: boolean
  isPast: boolean
}

export default function BookingFormEvent({ event, remaining, isLoggedIn, isPast }: Props) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)

  const max = Math.min(remaining, 10)
  const total = quantity * event.price_per_ticket
  const accent = '#a78bfa'

  function handleBook() {
    if (!isLoggedIn) { router.push('/login'); return }
    const p = new URLSearchParams({
      item_type: 'event',
      item_id: event.id,
      tickets_count: String(quantity),
      total: String(total),
    })
    router.push(`/checkout?${p}`)
  }

  if (isPast) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Cet événement est terminé</p>
      </div>
    )
  }

  if (remaining <= 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '16px',
        background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)',
        borderRadius: 12,
      }}>
        <p style={{ fontSize: 13, color: '#f87171', fontWeight: 600 }}>Complet</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Plus de billets disponibles</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Sélecteur quantité */}
      <div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          Nombre de billets
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            style={{
              width: 42, height: 42, borderRadius: 10,
              border: '0.5px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)', color: '#fff',
              fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>−</button>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', minWidth: 36, textAlign: 'center' }}>{quantity}</span>
          <button
            onClick={() => setQuantity(q => Math.min(max, q + 1))}
            style={{
              width: 42, height: 42, borderRadius: 10,
              border: `0.5px solid rgba(167,139,250,0.3)`,
              background: 'rgba(167,139,250,0.1)', color: accent,
              fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>+</button>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>max {max}</span>
        </div>
      </div>

      {/* Total */}
      {event.price_per_ticket > 0 && (
        <div style={{
          background: 'rgba(167,139,250,0.06)', border: '0.5px solid rgba(167,139,250,0.15)',
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {formatPrice(event.price_per_ticket)} × {quantity} billet{quantity > 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{formatPrice(total)}</span>
          </div>
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: accent }}>{formatPrice(total)}</span>
          </div>
        </div>
      )}

      {/* Bouton */}
      <button
        onClick={handleBook}
        style={{
          width: '100%', padding: '15px',
          background: isLoggedIn ? accent : 'rgba(255,255,255,0.08)',
          color: isLoggedIn ? '#1a0a3d' : 'rgba(255,255,255,0.5)',
          borderRadius: 12, border: isLoggedIn ? 'none' : '0.5px solid rgba(255,255,255,0.1)',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          // Taille tactile confortable sur mobile
          minHeight: 52,
        }}>
        {isLoggedIn
          ? event.price_per_ticket === 0 ? 'Réserver gratuitement' : 'Acheter les billets'
          : 'Connectez-vous pour acheter'
        }
      </button>

      {!isLoggedIn && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          Vous serez redirigé vers la connexion
        </p>
      )}
    </div>
  )
}