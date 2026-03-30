'use client'

import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import NotificationBell from '@/components/ui/NotificationBell'
import { formatPrice } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = { full_name: string; city: string; account_type: string }

export default function DashboardVehicule({ profile, userId }: { profile: Profile; userId: string }) {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [stats, setStats] = useState({ confirmed: 0, revenus_nets: 0, commission: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [userId])

  async function loadData() {
    const supabase = createClient()
    supabase.from('vehicles').select('*').eq('owner_id', userId).order('created_at', { ascending: false })
      .then(({ data }) => setVehicles((data ?? []) as any[]))

    supabase.from('bookings').select('*').eq('item_type', 'vehicle').order('created_at', { ascending: false })
      .then(async ({ data: allRaw }) => {
        const all = (allRaw ?? []) as any[]
        if (!all.length) return
        const { data: myVehRaw } = await supabase.from('vehicles').select('id').eq('owner_id', userId)
        const ids = ((myVehRaw ?? []) as any[]).map((v: any) => v.id)
        const mine = all.filter((b: any) => ids.includes(b.item_id))
        setBookings(mine)
        const confirmed = mine.filter((b: any) => b.status === 'confirmed')
        const brut = confirmed.reduce((s: number, b: any) => s + b.total_price, 0)
        const com = confirmed.reduce((s: number, b: any) => s + (b.commission_amount || Math.round(b.total_price * 0.1)), 0)
        setStats({ confirmed: confirmed.length, revenus_nets: brut - com, commission: com })
      })
  }

  async function toggleAvailability(id: string, current: boolean) {
    const supabase = createClient()
    await (supabase.from('vehicles') as any).update({ is_available: !current }).eq('id', id)
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, is_available: !current } : v))
  }

  async function deleteVehicle(id: string) {
    if (!confirm('Désactiver ce véhicule ?')) return
    const supabase = createClient()
    await (supabase.from('vehicles') as any).update({ status: 'inactive' }).eq('id', id)
    setVehicles(prev => prev.filter(v => v.id !== id))
  }

  // ✅ Confirmer une réservation pending_contact
  async function confirmBooking(bookingId: string) {
    if (!confirm('Confirmer cette réservation ?')) return
    setActionLoading(bookingId + '_confirm')
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'confirmed' } : b))
    setActionLoading(null)
  }

  // ✅ Refuser une réservation pending_contact
  async function rejectBooking(bookingId: string) {
    if (!confirm('Refuser cette réservation ?')) return
    setActionLoading(bookingId + '_reject')
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    setActionLoading(null)
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'confirmed': return 'Confirmée'
      case 'pending_contact': return 'En attente'
      case 'pending': return 'En attente'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  function getStatusColors(status: string) {
    switch (status) {
      case 'confirmed': return { bg: 'rgba(34,211,165,0.1)', color: '#22d3a5', border: 'rgba(34,211,165,0.2)' }
      case 'pending_contact':
      case 'pending': return { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: 'rgba(251,191,36,0.2)' }
      default: return { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.2)' }
    }
  }

  const accent = '#60a5fa'
  const card = { background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16 }

  return (
    <>
      <style>{`
        .dv-wrap { max-width: 1200px; margin: 0 auto; padding: 40px 48px; }
        .dv-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 40px; }
        .dv-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .dv-revbar { display: flex; align-items: center; gap: 32px; }
        .dv-revlegend { display: flex; gap: 24px; flex-shrink: 0; }
        .dv-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .dv-booking-row { padding: 14px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
        .dv-booking-row:last-child { border-bottom: none; }
        .dv-booking-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }

        @media (max-width: 767px) {
          .dv-wrap { padding: 24px 16px; }
          .dv-header { flex-direction: column; gap: 16px; align-items: flex-start; }
          .dv-header a { width: 100%; text-align: center; box-sizing: border-box; }
          .dv-stats { grid-template-columns: 1fr 1fr; }
          .dv-revbar { flex-direction: column; gap: 16px; align-items: flex-start; }
          .dv-revlegend { gap: 16px; }
          .dv-two-col { grid-template-columns: 1fr; }
          .dv-item-actions { flex-direction: row !important; flex-wrap: wrap; gap: 6px !important; }
          .dv-title { font-size: 26px !important; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .dv-wrap { padding: 32px 24px; }
          .dv-stats { grid-template-columns: repeat(2, 1fr); }
          .dv-two-col { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
        <Navbar />
        <div className="dv-wrap">

          <div className="dv-header">
            <div>
              <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Dashboard</div>
              <h1 className="dv-title" style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>Bonjour, {profile.full_name.split(' ')[0]}</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{profile.city} · Loueur de véhicules</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <NotificationBell />
              <Link href="/publier/vehicule" style={{ padding: '12px 22px', background: accent, color: '#0a1428', borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>+ Nouveau véhicule</Link>
            </div>
          </div>

          <div className="dv-stats">
            {[
              { label: 'Véhicules', value: vehicles.length, color: accent },
              { label: 'Locations confirmées', value: stats.confirmed, color: '#fff' },
              { label: 'Commission (10%)', value: `− ${formatPrice(stats.commission)}`, color: '#f87171' },
              { label: 'Vous recevez', value: formatPrice(stats.revenus_nets), color: '#22d3a5', highlight: true },
            ].map((s, i) => (
              <div key={i} style={{ ...card, padding: 24, background: s.highlight ? 'rgba(34,211,165,0.06)' : '#111827', border: s.highlight ? '0.5px solid rgba(34,211,165,0.2)' : '0.5px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{s.label}</p>
                <p style={{ fontSize: i > 1 ? 18 : 28, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {stats.revenus_nets > 0 && (
            <div style={{ ...card, padding: '20px 24px', marginBottom: 32 }}>
              <div className="dv-revbar">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Répartition des revenus</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Total : {formatPrice(stats.revenus_nets + stats.commission)}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: '#22d3a5', width: `${Math.round((stats.revenus_nets / (stats.revenus_nets + stats.commission || 1)) * 100)}%` }} />
                  </div>
                </div>
                <div className="dv-revlegend">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#22d3a5' }} /><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Vous (90%)</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} /><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Zando (10%)</span></div>
                </div>
              </div>
            </div>
          )}

          <div className="dv-two-col">
            {/* Mes véhicules */}
            <div style={{ ...card, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Mes véhicules</h2>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{vehicles.length}</span>
              </div>
              {vehicles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {vehicles.map(v => (
                    <div key={v.id} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#1a2236', flexShrink: 0 }}>
                        {v.main_photo ? <img src={v.main_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'rgba(255,255,255,0.15)' }}>◈</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{v.brand} {v.model} ({v.year})</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{v.city} · {formatPrice(v.price_per_day)}/jour</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: v.status === 'active' ? 'rgba(34,211,165,0.1)' : 'rgba(251,191,36,0.1)', color: v.status === 'active' ? '#22d3a5' : '#fbbf24', border: `0.5px solid ${v.status === 'active' ? 'rgba(34,211,165,0.2)' : 'rgba(251,191,36,0.2)'}` }}>{v.status === 'active' ? 'Actif' : 'En attente'}</span>
                          {v.status === 'active' && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: v.is_available ? 'rgba(96,165,250,0.1)' : 'rgba(248,113,113,0.1)', color: v.is_available ? '#60a5fa' : '#f87171', border: `0.5px solid ${v.is_available ? 'rgba(96,165,250,0.2)' : 'rgba(248,113,113,0.2)'}` }}>{v.is_available ? 'Disponible' : 'En location'}</span>}
                        </div>
                      </div>
                      <div className="dv-item-actions" style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                        <Link href={`/vehicles/${v.id}`} style={{ fontSize: 11, color: accent, padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)', textDecoration: 'none', textAlign: 'center' }}>Voir</Link>
                        <Link href={`/modifier/vehicule/${v.id}`} style={{ fontSize: 11, color: '#a78bfa', padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(167,139,250,0.2)', background: 'rgba(167,139,250,0.08)', textDecoration: 'none', textAlign: 'center' }}>Modifier</Link>
                        {v.status === 'active' && <button onClick={() => toggleAvailability(v.id, v.is_available)} style={{ fontSize: 11, color: '#22d3a5', padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)', cursor: 'pointer' }}>{v.is_available ? 'Bloquer' : 'Libérer'}</button>}
                        <button onClick={() => deleteVehicle(v.id)} style={{ fontSize: 11, color: '#f87171', padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)', cursor: 'pointer' }}>Retirer</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>◈</div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Aucun véhicule publié</p>
                  <Link href="/publier/vehicule" style={{ fontSize: 13, color: accent, textDecoration: 'none', padding: '9px 18px', borderRadius: 10, border: '0.5px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)' }}>Publier mon premier véhicule</Link>
                </div>
              )}
            </div>

            {/* Locations reçues */}
            <div style={{ ...card, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Locations reçues</h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {bookings.filter(b => b.status === 'pending_contact').length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '3px 10px', borderRadius: 20, border: '0.5px solid rgba(251,191,36,0.2)' }}>
                      {bookings.filter(b => b.status === 'pending_contact').length} en attente
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{bookings.length}</span>
                </div>
              </div>
              {bookings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {bookings.slice(0, 8).map((b) => {
                    const sc = getStatusColors(b.status)
                    const isPending = b.status === 'pending_contact'
                    return (
                      <div key={b.id} className="dv-booking-row">
                        <div className="dv-booking-top">
                          <div>
                            <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>{b.reference}</p>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{b.client_name}</p>
                            {b.client_phone && (
                              <a href={`tel:${b.client_phone}`} style={{ fontSize: 11, color: '#60a5fa', textDecoration: 'none' }}>
                                📞 {b.client_phone}
                              </a>
                            )}
                            {b.start_date && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{b.start_date} → {b.end_date}</p>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{formatPrice(b.total_price)}</p>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, display: 'inline-block', background: sc.bg, color: sc.color, border: `0.5px solid ${sc.border}` }}>
                              {getStatusLabel(b.status)}
                            </span>
                          </div>
                        </div>

                        {/* ✅ Boutons Confirmer / Refuser pour pending_contact */}
                        {isPending && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button
                              onClick={() => confirmBooking(b.id)}
                              disabled={actionLoading === b.id + '_confirm'}
                              style={{
                                flex: 1, padding: '8px', borderRadius: 8, border: 'none',
                                background: actionLoading === b.id + '_confirm' ? 'rgba(34,211,165,0.3)' : '#22d3a5',
                                color: '#0a1a14', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              }}
                            >
                              {actionLoading === b.id + '_confirm' ? '...' : '✓ Confirmer'}
                            </button>
                            <button
                              onClick={() => rejectBooking(b.id)}
                              disabled={actionLoading === b.id + '_reject'}
                              style={{
                                flex: 1, padding: '8px', borderRadius: 8,
                                border: '0.5px solid rgba(248,113,113,0.3)',
                                background: 'rgba(248,113,113,0.08)',
                                color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              }}
                            >
                              {actionLoading === b.id + '_reject' ? '...' : '✕ Refuser'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>◈</div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Aucune location reçue</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}