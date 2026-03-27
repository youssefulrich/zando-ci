'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice, getNights } from '@/lib/utils'

type Props = {
  residenceId: string
  pricePerNight: number
  pricePerWeek?: number | null
  pricePerMonth?: number | null
  maxGuests: number
}

export default function BookingFormResidence({
  residenceId,
  pricePerNight,
  pricePerWeek,
  pricePerMonth,
  maxGuests,
}: Props) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const safePrice = Number(pricePerNight) || 0
  const safeMax = Number(maxGuests) || 1

  function getNightsCount(): number {
    if (!checkIn || !checkOut) return 0
    const n = getNights(new Date(checkIn), new Date(checkOut))
    return isNaN(n) ? 0 : n
  }

  function getPrice(): number {
    const nights = getNightsCount()
    if (nights <= 0) return 0
    if (pricePerMonth && nights >= 28) return Math.round(Number(pricePerMonth) * (nights / 30))
    if (pricePerWeek && nights >= 7) return Math.round(Number(pricePerWeek) * (nights / 7))
    return safePrice * nights
  }

  function getPriceLabel(): string {
    const nights = getNightsCount()
    if (pricePerMonth && nights >= 28) return `${Math.round(nights / 30 * 10) / 10} mois`
    if (pricePerWeek && nights >= 7) return `${Math.round(nights / 7 * 10) / 10} sem.`
    return `${nights} nuit${nights > 1 ? 's' : ''}`
  }

  const nights = getNightsCount()
  const totalPrice = getPrice()

  async function handleSubmit() {
    setError('')
    if (!checkIn || !checkOut) { setError('Choisissez vos dates'); return }
    if (nights <= 0) { setError('Date de départ invalide'); return }
    if (guests < 1 || guests > safeMax) { setError(`Maximum ${safeMax} personnes`); return }
    if (totalPrice <= 0) { setError('Prix invalide, contactez le propriétaire'); return }

    setLoading(true)

    try {
      const res = await fetch('/api/paiement/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'residence',
          itemId: residenceId,
          startDate: checkIn,
          endDate: checkOut,
          ticketsCount: guests,
          total: totalPrice,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la réservation')
        setLoading(false)
        return
      }

      if (data.payment_url) {
        window.location.href = data.payment_url
        return
      }

      if (data.reference) {
        router.push('/paiement/succes?ref=' + data.reference)
        return
      }

      setError('Réponse inattendue du serveur')
      setLoading(false)

    } catch {
      setError('Erreur réseau, veuillez réessayer')
      setLoading(false)
    }
  }

  const inp = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    colorScheme: 'dark' as const,
  }

  const lbl = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 8,
  }

  return (
    <>
      <style>{`
        .bfr-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        @media (max-width: 400px) { .bfr-dates { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: 20, padding: 24 }}>

        {/* Prix */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#22d3a5' }}>
              {safePrice > 0 ? formatPrice(safePrice) : '—'}
            </span>
            <span style={{ color: '#64748b', fontSize: 14 }}>/nuit</span>
          </div>
          {pricePerWeek && Number(pricePerWeek) > 0 && (
            <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
              {formatPrice(Number(pricePerWeek))}/semaine
              {pricePerMonth ? ` · ${formatPrice(Number(pricePerMonth))}/mois` : ''}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="bfr-dates">
          <div>
            <label style={lbl}>Arrivée</label>
            <input type="date" value={checkIn} min={today}
              onChange={e => { setCheckIn(e.target.value); setError('') }}
              style={inp} />
          </div>
          <div>
            <label style={lbl}>Départ</label>
            <input type="date" value={checkOut} min={checkIn || today}
              onChange={e => { setCheckOut(e.target.value); setError('') }}
              style={inp} />
          </div>
        </div>

        {/* Voyageurs */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Voyageurs</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setGuests(g => Math.max(1, g - 1))} style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>−</button>
            <span style={{ color: '#e2e8f0', fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{guests}</span>
            <button onClick={() => setGuests(g => Math.min(safeMax, g + 1))} style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>+</button>
            <span style={{ color: '#64748b', fontSize: 13 }}>/ {safeMax} max</span>
          </div>
        </div>

        {/* Récapitulatif */}
        {nights > 0 && totalPrice > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{formatPrice(safePrice)} × {getPriceLabel()}</span>
              <span style={{ color: '#e2e8f0', fontSize: 13 }}>{formatPrice(totalPrice)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Frais de service (10%)</span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>inclus</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Total</span>
              <span style={{ color: '#22d3a5', fontWeight: 700, fontSize: 16 }}>{formatPrice(totalPrice)}</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !checkIn || !checkOut || nights <= 0 || safePrice <= 0}
          style={{
            width: '100%', padding: '15px',
            background: (loading || !checkIn || !checkOut || nights <= 0 || safePrice <= 0)
              ? 'rgba(34,211,165,0.3)' : 'linear-gradient(135deg, #22d3a5, #0891b2)',
            border: 'none', borderRadius: 12,
            color: (loading || !checkIn || !checkOut || nights <= 0 || safePrice <= 0) ? '#64748b' : '#0a0f1a',
            fontWeight: 700, fontSize: 15, cursor: loading ? 'wait' : 'pointer',
            minHeight: 52, transition: 'all 0.2s',
          }}
        >
          {loading ? 'Redirection vers le paiement...' : nights > 0 ? `Réserver — ${formatPrice(totalPrice)}` : 'Choisir les dates'}
        </button>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 12 }}>
          🔒 Paiement sécurisé via Genius Pay
        </p>
      </div>
    </>
  )
}