'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

type Props = {
  event: {
    id: string
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
  const [quantity, setQuantity] = useState(1)

  const max = Math.min(remaining, 10)
  const total = quantity * event.price_per_ticket
  const accent = '#a78bfa'

  // ✅ SAFE (plus de any, plus de bug null)
  const contactNumber =
    organizerWhatsapp ||
    organizerPhone ||
    event.profiles?.phone ||
    undefined

  function buildWhatsAppMessage() {
    if (!contactNumber) return '#'

    const msg = encodeURIComponent(
      `Bonjour, je souhaite réserver ${quantity} billet${quantity > 1 ? 's' : ''} pour votre événement sur Zando CI.\n\n` +
      `Montant total : ${formatPrice(total)} FCFA\n\n` +
      `Merci de confirmer la disponibilité.`
    )

    const phone = contactNumber.replace(/\D/g, '')
    return `https://wa.me/${phone}?text=${msg}`
  }

  function buildSMSMessage() {
    if (!contactNumber) return '#'

    const msg = encodeURIComponent(
      `Bonjour, je veux réserver ${quantity} billet${quantity > 1 ? 's' : ''} - ${formatPrice(total)} FCFA (Zando CI)`
    )

    return `sms:${contactNumber}?body=${msg}`
  }

  if (isPast) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          Cet événement est terminé
        </p>
      </div>
    )
  }

  if (remaining <= 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '16px',
          background: 'rgba(248,113,113,0.08)',
          border: '0.5px solid rgba(248,113,113,0.2)',
          borderRadius: 12
        }}
      >
        <p style={{ fontSize: 13, color: '#f87171', fontWeight: 600 }}>
          Complet
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
          Plus de billets disponibles
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Quantité */}
      <div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
          Nombre de billets
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>
            −
          </button>

          <span>{quantity}</span>

          <button onClick={() => setQuantity(q => Math.min(max, q + 1))}>
            +
          </button>

          <span style={{ fontSize: 12, opacity: 0.5 }}>
            max {max}
          </span>
        </div>
      </div>

      {/* Total */}
      {event.price_per_ticket > 0 && (
        <div>
          <p>
            {formatPrice(event.price_per_ticket)} × {quantity}
          </p>
          <strong>Total : {formatPrice(total)}</strong>
        </div>
      )}

      {/* Actions */}
      {contactNumber ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a href={buildWhatsAppMessage()} target="_blank">
            WhatsApp
          </a>

          <a href={`tel:${contactNumber}`}>
            Appeler
          </a>
        </div>
      ) : (
        <button
          onClick={() => {
            if (!isLoggedIn) {
              router.push('/login')
              return
            }

            const params = new URLSearchParams({
              item_type: 'event',
              item_id: event.id,
              tickets_count: String(quantity),
              total: String(total)
            })

            router.push(`/checkout?${params}`)
          }}
        >
          {isLoggedIn ? 'Réserver' : 'Connexion requise'}
        </button>
      )}

    </div>
  )
}