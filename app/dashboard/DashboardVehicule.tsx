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

  useEffect(() => { loadData() }, [userId])

  async function loadData() {
    const supabase = createClient()
    supabase.from('vehicles').select('*').eq('owner_id', userId).order('created_at', { ascending: false })
      .then(({ data }) => setVehicles(data ?? []))
    supabase.from('bookings').select('*').eq('item_type', 'vehicle').order('created_at', { ascending: false })
      .then(async ({ data: all }) => {
        if (!all) return
        const { data: myVeh } = await supabase.from('vehicles').select('id').eq('owner_id', userId)
        const ids = (myVeh ?? []).map((v: any) => v.id)
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
    await supabase.from('vehicles').update({ is_available: !current }).eq('id', id)
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, is_available: !current } : v))
  }

  async function deleteVehicle(id: string) {
    if (!confirm('Désactiver ce véhicule ?')) return
    const supabase = createClient()
    await supabase.from('vehicles').update({ status: 'inactive' }).eq('id', id)
    setVehicles(prev => prev.filter(v => v.id !== id))
  }

  async function confirmBooking(id: string) {
    if (!confirm('Confirmer cette réservation ?')) return
    setActionLoading(id + '_c')
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b))
    await loadData() // ← AJOUTEZ

    setActionLoading(null)
  }

  async function rejectBooking(id: string) {
    if (!confirm('Refuser cette réservation ?')) return
    setActionLoading(id + '_r')
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
    await loadData() // ← AJOUTEZ

    setActionLoading(null)
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending_contact')
  const accent = '#60a5fa'

  return (
    <>
      <style>{`
        .dv { background: #0a0f1a; min-height: 100vh; }
        .dv-wrap { max-width: 900px; margin: 0 auto; padding: 24px 16px 60px; }
        .dv-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .dv-head-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .dv-new-btn { padding: 9px 14px; background: #60a5fa; color: #0a1428; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap; }
        .dv-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .dv-stat { background: #111827; border: 0.5px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; }
        .dv-card { background: #111827; border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin-bottom: 14px; }
        .dv-pending { border-color: rgba(251,191,36,0.25); background: rgba(251,191,36,0.04); }
        .dv-pending-item { padding-bottom: 14px; margin-bottom: 14px; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        .dv-pending-item:last-child { padding-bottom: 0; margin-bottom: 0; border-bottom: none; }
        .dv-action-row { display: flex; gap: 8px; margin-top: 10px; }
        .dv-veh { display: flex; gap: 10px; background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 12px; }
        .dv-veh + .dv-veh { margin-top: 10px; }
        .dv-veh-thumb { width: 50px; height: 50px; border-radius: 10px; overflow: hidden; background: #1a2236; flex-shrink: 0; }
        .dv-veh-btns { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
        .dv-vbtn { font-size: 11px; padding: 5px 9px; border-radius: 7px; cursor: pointer; text-align: center; text-decoration: none; display: block; white-space: nowrap; border: none; }
        .dv-book-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 11px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
        .dv-book-row:last-child { border-bottom: none; }
        @media (min-width: 640px) {
          .dv-wrap { padding: 32px 24px 60px; }
          .dv-stats { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 900px) {
          .dv-two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .dv-two .dv-card { margin-bottom: 0; }
        }
      `}</style>

      <div className="dv">
        <Navbar />
        <div className="dv-wrap">

          {/* Header */}
          <div className="dv-head">
            <div>
              <div style={{ fontSize: 10, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 4 }}>Dashboard</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 2 }}>
                Bonjour, {profile.full_name.split(' ')[0]} 👋
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{profile.city} · Loueur de véhicules</p>
            </div>
            <div className="dv-head-right">
              <NotificationBell />
              <Link href="/publier/vehicule" className="dv-new-btn">+ Ajouter</Link>
            </div>
          </div>

          {/* Stats */}
          <div className="dv-stats">
            {[
              { label: 'Véhicules', value: vehicles.length, color: accent },
              { label: 'Confirmées', value: stats.confirmed, color: '#fff' },
              { label: 'Commission', value: `−${formatPrice(stats.commission)}`, color: '#f87171' },
              { label: 'Vous recevez', value: formatPrice(stats.revenus_nets), color: '#22d3a5', hl: true },
            ].map((s, i) => (
              <div key={i} className="dv-stat" style={s.hl ? { background: 'rgba(34,211,165,0.06)', borderColor: 'rgba(34,211,165,0.2)' } : {}}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: i > 1 ? 14 : 20, fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Demandes en attente */}
          {pendingBookings.length > 0 && (
            <div className="dv-card dv-pending">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span>🔔</span>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>
                  {pendingBookings.length} demande{pendingBookings.length > 1 ? 's' : ''} en attente
                </h2>
              </div>
              {pendingBookings.map(b => (
                <div key={b.id} className="dv-pending-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>{b.reference}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{b.client_name}</p>
                      {b.client_phone && (
                        <a href={`tel:${b.client_phone}`} style={{ fontSize: 12, color: '#60a5fa', textDecoration: 'none', display: 'block', marginBottom: 2 }}>📞 {b.client_phone}</a>
                      )}
                      {b.start_date && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{b.start_date} → {b.end_date}</p>}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{formatPrice(b.total_price)}</p>
                  </div>
                  <div className="dv-action-row">
                    <button onClick={() => confirmBooking(b.id)} disabled={actionLoading === b.id + '_c'}
                      style={{ flex: 1, padding: '10px', background: '#22d3a5', color: '#0a1a14', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: actionLoading === b.id + '_c' ? 0.5 : 1 }}>
                      {actionLoading === b.id + '_c' ? '...' : '✓ Confirmer'}
                    </button>
                    <button onClick={() => rejectBooking(b.id)} disabled={actionLoading === b.id + '_r'}
                      style={{ flex: 1, padding: '10px', background: 'rgba(248,113,113,0.1)', color: '#f87171', borderRadius: 10, border: '0.5px solid rgba(248,113,113,0.2)', fontSize: 13, cursor: 'pointer', opacity: actionLoading === b.id + '_r' ? 0.5 : 1 }}>
                      {actionLoading === b.id + '_r' ? '...' : '✕ Refuser'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="dv-two">
            {/* Mes véhicules */}
            <div className="dv-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Mes véhicules</h2>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>{vehicles.length}</span>
              </div>
              {vehicles.length > 0 ? (
                <div>
                  {vehicles.map(v => (
                    <div key={v.id} className="dv-veh">
                      <div className="dv-veh-thumb">
                        {v.main_photo
                          ? <img src={v.main_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'rgba(255,255,255,0.15)' }}>◈</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                          {v.brand} {v.model}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{formatPrice(v.price_per_day)}/jour</p>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: v.status === 'active' ? 'rgba(34,211,165,0.1)' : 'rgba(251,191,36,0.1)', color: v.status === 'active' ? '#22d3a5' : '#fbbf24' }}>{v.status === 'active' ? 'Actif' : 'Attente'}</span>
                          {v.status === 'active' && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: v.is_available ? 'rgba(96,165,250,0.1)' : 'rgba(248,113,113,0.1)', color: v.is_available ? '#60a5fa' : '#f87171' }}>{v.is_available ? 'Dispo' : 'Loué'}</span>}
                        </div>
                      </div>
                      <div className="dv-veh-btns">
                        <Link href={`/vehicles/${v.id}`} className="dv-vbtn" style={{ color: accent, border: '0.5px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)' }}>Voir</Link>
                        <Link href={`/modifier/vehicule/${v.id}`} className="dv-vbtn" style={{ color: '#a78bfa', border: '0.5px solid rgba(167,139,250,0.2)', background: 'rgba(167,139,250,0.08)' }}>Modifier</Link>
                        {v.status === 'active' && <button onClick={() => toggleAvailability(v.id, v.is_available)} className="dv-vbtn" style={{ color: '#22d3a5', border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)' }}>{v.is_available ? 'Bloquer' : 'Libérer'}</button>}
                        <button onClick={() => deleteVehicle(v.id)} className="dv-vbtn" style={{ color: '#f87171', border: '0.5px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)' }}>Retirer</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Aucun véhicule publié</p>
                  <Link href="/publier/vehicule" style={{ fontSize: 13, color: accent, textDecoration: 'none', padding: '8px 16px', borderRadius: 10, border: '0.5px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)' }}>Publier</Link>
                </div>
              )}
            </div>

            {/* Locations reçues */}
            <div className="dv-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Locations reçues</h2>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>{bookings.filter(b => b.status !== 'pending_contact').length}</span>
              </div>
              {bookings.filter(b => b.status !== 'pending_contact').length > 0 ? (
                <div>
                  {bookings.filter(b => b.status !== 'pending_contact').slice(0, 8).map(b => {
                    const sc = b.status === 'confirmed' ? { c: '#22d3a5', bg: 'rgba(34,211,165,0.1)' } : b.status === 'cancelled' ? { c: '#f87171', bg: 'rgba(248,113,113,0.1)' } : { c: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' }
                    return (
                      <div key={b.id} className="dv-book-row">
                        <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{b.client_name}</p>
                          {b.start_date && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{b.start_date} → {b.end_date}</p>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{formatPrice(b.total_price)}</p>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: sc.c, background: sc.bg }}>{b.status === 'confirmed' ? 'Confirmée' : b.status === 'cancelled' ? 'Annulée' : 'Terminée'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Aucune location reçue</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}