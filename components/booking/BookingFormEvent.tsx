'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

type Props = {
  event: {
    id: string
    price_per_ticket: number
    profiles?: { full_name?: string; phone?: string } | null
  }
  remaining: number
  isLoggedIn: boolean
  isPast: boolean
  organizerWhatsapp?: string | null
  organizerPhone?: string | null
}

export default function BookingFormEvent({ event, remaining, isLoggedIn, isPast, organizerWhatsapp, organizerPhone }: Props) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const max = Math.min(remaining, 10)
  const total = quantity * event.price_per_ticket
  const accent = '#a78bfa'

  // Numéro WhatsApp/téléphone de l'organisateur
  const contactNumber = organizerWhatsapp || organizerPhone || (event.profiles as any)?.phone

  function buildWhatsAppMessage() {
    const msg = encodeURIComponent(
      `Bonjour, je souhaite réserver ${quantity} billet${quantity > 1 ? 's' : ''} pour votre événement sur Zando CI.\n\n` +
      `Montant total : ${formatPrice(total)} FCFA\n\n` +
      `Merci de confirmer la disponibilité.`
    )
    const phone = contactNumber?.replace(/\D/g, '')
    return `https://wa.me/${phone}?text=${msg}`
  }

  function buildSMSMessage() {
    const msg = encodeURIComponent(
      `Bonjour, je veux réserver ${quantity} billet${quantity > 1 ? 's' : ''} - ${formatPrice(total)} FCFA (Zando CI)`
    )
    return `sms:${contactNumber}?body=${msg}`
  }

  if (isPast) return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Cet événement est terminé</p>
    </div>
  )

  if (remaining <= 0) return (
    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12 }}>
      <p style={{ fontSize: 13, color: '#f87171', fontWeight: 600 }}>Complet</p>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Plus de billets disponibles</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Sélecteur quantité */}
      <div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          Nombre de billets
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 38, height: 38, borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', minWidth: 32, textAlign: 'center' }}>{quantity}</span>
          <button onClick={() => setQuantity(q => Math.min(max, q + 1))} style={{ width: 38, height: 38, borderRadius: 10, border: `0.5px solid rgba(167,139,250,0.3)`, background: 'rgba(167,139,250,0.1)', color: accent, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>max {max}</span>
        </div>
      </div>

      {/* Total */}
      {event.price_per_ticket > 0 && (
        <div style={{ background: 'rgba(167,139,250,0.06)', border: '0.5px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{formatPrice(event.price_per_ticket)} × {quantity} billet{quantity > 1 ? 's' : ''}</span>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{formatPrice(total)}</span>
          </div>
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: accent }}>{formatPrice(total)}</span>
          </div>
        </div>
      )}

      {/* Bouton WhatsApp */}
      {contactNumber ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href={buildWhatsAppMessage()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '14px',
              background: '#25d366', color: '#fff',
              borderRadius: 12, border: 'none',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {event.price_per_ticket === 0 ? 'Réserver via WhatsApp' : `Payer ${formatPrice(total)} via WhatsApp`}
          </a>
          <a
            href={`tel:${contactNumber}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '12px',
              background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
              borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.1)',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            📞 Appeler l&apos;organisateur
          </a>
        </div>
      ) : (
        /* Fallback : pas de numéro → formulaire de contact */
        <button
          onClick={() => {
            if (!isLoggedIn) { router.push('/login'); return }
            const p = new URLSearchParams({ item_type: 'event', item_id: event.id, tickets_count: String(quantity), total: String(total) })
            router.push(`/checkout?${p}`)
          }}
          style={{
            width: '100%', padding: '14px',
            background: accent, color: '#1a0a3d',
            borderRadius: 12, border: 'none',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {isLoggedIn ? 'Réserver les billets' : 'Connectez-vous pour réserver'}
        </button>
      )}

      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}>
        Contactez l&apos;organisateur pour confirmer votre réservation et effectuer le paiement
      </p>
    </div>
  )
}