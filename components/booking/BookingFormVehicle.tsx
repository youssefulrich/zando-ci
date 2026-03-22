'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice, getNights } from '@/lib/utils'

type BookedDate = { start: string; end: string }

type Props = {
  vehicle: { id: string; price_per_day: number }
  bookedDates: BookedDate[]
  isLoggedIn: boolean
}

export default function BookingFormVehicle({ vehicle, bookedDates, isLoggedIn }: Props) {
  const router = useRouter()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const accent = '#60a5fa'

  function isDateBooked(date: string) {
    return bookedDates.some(b => date >= b.start && date <= b.end)
  }

  const days = startDate && endDate ? getNights(new Date(startDate), new Date(endDate)) : 0
  const total = days * vehicle.price_per_day

  function handleBook() {
    if (!isLoggedIn) { router.push('/login'); return }
    if (!startDate || !endDate) { setError('Choisissez vos dates'); return }
    if (days < 1) { setError('Minimum 1 jour de location'); return }
    if (isDateBooked(startDate) || isDateBooked(endDate)) { setError('Ces dates ne sont pas disponibles'); return }
    const p = new URLSearchParams({ item_type: 'vehicle', item_id: vehicle.id, start_date: startDate, end_date: endDate, total: String(total) })
    router.push(`/checkout?${p}`)
  }

  const inp = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10,
    padding: '11px 14px', fontSize: 13, color: '#fff',
    outline: 'none', colorScheme: 'dark' as const,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Début</label>
          <input type="date" value={startDate} min={today}
            onChange={e => { setStartDate(e.target.value); if (endDate <= e.target.value) setEndDate(''); setError('') }}
            style={inp} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Fin</label>
          <input type="date" value={endDate} min={startDate || today}
            onChange={e => { setEndDate(e.target.value); setError('') }}
            style={inp} />
        </div>
      </div>

      {/* Total */}
      {days > 0 && (
        <div style={{ background: 'rgba(96,165,250,0.06)', border: '0.5px solid rgba(96,165,250,0.15)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{formatPrice(vehicle.price_per_day)} × {days} jour{days > 1 ? 's' : ''}</span>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{formatPrice(total)}</span>
          </div>
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: accent }}>{formatPrice(total)}</span>
          </div>
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: '#f87171' }}>{error}</p>}

      <button onClick={handleBook} style={{
        width: '100%', padding: '13px',
        background: isLoggedIn ? accent : 'rgba(255,255,255,0.08)',
        color: isLoggedIn ? '#0a1428' : 'rgba(255,255,255,0.4)',
        borderRadius: 12, border: isLoggedIn ? 'none' : '0.5px solid rgba(255,255,255,0.1)',
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
      }}>
        {isLoggedIn ? 'Réserver' : 'Connectez-vous pour réserver'}
      </button>
    </div>
  )
}