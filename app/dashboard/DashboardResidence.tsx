'use client'

import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import NotificationBell from '@/components/ui/NotificationBell'
import { formatPrice } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = { full_name: string; city: string; account_type: string }

export default function DashboardResidence({ profile, userId, showAll = false }: { profile: Profile; userId: string; showAll?: boolean }) {
  const [residences, setResidences] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [stats, setStats] = useState({ confirmed: 0, revenus_nets: 0, commission: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { loadData() }, [userId])

  async function loadData() {
    const supabase = createClient()
    supabase.from('residences').select('*').eq('owner_id', userId).order('created_at', { ascending: false })
      .then(({ data }) => setResidences(data ?? []))
    supabase.from('bookings').select('*').eq('item_type', 'residence').order('created_at', { ascending: false })
      .then(async ({ data: all }) => {
        if (!all) return
        const { data: myRes } = await supabase.from('residences').select('id').eq('owner_id', userId)
        const ids = (myRes ?? []).map((r: any) => r.id)
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
    await supabase.from('residences').update({ is_available: !current } as any).eq('id', id)
    setResidences(prev => prev.map(r => r.id === id ? { ...r, is_available: !current } : r))
  }

  async function deleteResidence(id: string) {
    if (!confirm('Désactiver cette résidence ?')) return
    const supabase = createClient()
    await supabase.from('residences').update({ status: 'inactive' } as any).eq('id', id)
    setResidences(prev => prev.filter(r => r.id !== id))
  }

  async function confirmBooking(id: string) {
    if (!confirm('Confirmer cette réservation ?')) return
    setActionLoading(id + '_c')
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b))
    setActionLoading(null)
  }

  async function rejectBooking(id: string) {
    if (!confirm('Refuser cette réservation ?')) return
    setActionLoading(id + '_r')
    const supabase = createClient()
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
    setActionLoading(null)
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending_contact')
  const accent = '#22d3a5'

  return (
    <>
      <style>{`
        .dr { background: #0a0f1a; min-height: 100vh; }
        .dr-wrap { max-width: 900px; margin: 0 auto; padding: 24px 16px 60px; }
        .dr-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .dr-head-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .dr-new-btn { padding: 9px 14px; background: #22d3a5; color: #0a1a14; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap; }
        .dr-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .dr-stat { background: #111827; border: 0.5px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; }
        .dr-card { background: #111827; border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin-bottom: 14px; }
        .dr-pending { border-color: rgba(251,191,36,0.25); background: rgba(251,191,36,0.04); }
        .dr-pending-item { padding-bottom: 14px; margin-bottom: 14px; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        .dr-pending-item:last-child { padding-bottom: 0; margin-bottom: 0; border-bottom: none; }
        .dr-res { display: flex; gap: 10px; background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 12px; }
        .dr-res + .dr-res { margin-top: 10px; }
        .dr-res-thumb { width: 50px; height: 50px; border-radius: 10px; overflow: hidden; background: #1a2236; flex-shrink: 0; }
        .dr-res-btns { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
        .dr-rbtn { font-size: 11px; padding: 5px 9px; border-radius: 7px; cursor: pointer; text-align: center; text-decoration: none; display: block; white-space: nowrap; border: none; }
        .dr-book-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 11px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
        .dr-book-row:last-child { border-bottom: none; }
        @media (min-width: 640px) {
          .dr-wrap { padding: 32px 24px 60px; }
          .dr-stats { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 900px) {
          .dr-two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .dr-two .dr-card { margin-bottom: 0; }
        }
      `}</style>

      <div className="dr">
        <Navbar />
        <div className="dr-wrap">

          {/* Header */}
          <div className="dr-head">
            <div>
              <div style={{ fontSize: 10, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 4 }}>Dashboard</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 2 }}>
                Bonjour, {profile.full_name.split(' ')[0]} 👋
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{profile.city} · Propriétaire</p>
            </div>
            <div className="dr-head-right">
              <NotificationBell />
              <Link href="/publier/residence" className="dr-new-btn">+ Ajouter</Link>
            </div>
          </div>

          {/* Stats */}
          <div className="dr-stats">
            {[
              { label: 'Résidences', value: residences.length, color: accent },
              { label: 'Confirmées', value: stats.confirmed, color: '#fff' },
              { label: 'Commission', value: `−${formatPrice(stats.commission)}`, color: '#f87171' },
              { label: 'Vous recevez', value: formatPrice(stats.revenus_nets), color: accent, hl: true },
            ].map((s, i) => (
              <div key={i} className="dr-stat" style={s.hl ? { background: 'rgba(34,211,165,0.06)', borderColor: 'rgba(34,211,165,0.2)' } : {}}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: i > 1 ? 14 : 20, fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Demandes en attente */}
          {pendingBookings.length > 0 && (
            <div className="dr-card dr-pending">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span>🔔</span>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>
                  {pendingBookings.length} demande{pendingBookings.length > 1 ? 's' : ''} en attente
                </h2>
              </div>
              {pendingBookings.map(b => (
                <div key={b.id} className="dr-pending-item">
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
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
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

          <div className="dr-two">
            {/* Mes résidences */}
            <div className="dr-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Mes résidences</h2>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>{residences.length}</span>
              </div>
              {residences.length > 0 ? (
                <div>
                  {residences.map(r => (
                    <div key={r.id} className="dr-res">
                      <div className="dr-res-thumb">
                        {(r.main_photo || r.photos?.[0])
                          ? <img src={r.main_photo || r.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'rgba(255,255,255,0.15)' }}>⌂</div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{r.title}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{formatPrice(r.price_per_night)}/nuit</p>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: r.status === 'active' ? 'rgba(34,211,165,0.1)' : 'rgba(251,191,36,0.1)', color: r.status === 'active' ? '#22d3a5' : '#fbbf24' }}>{r.status === 'active' ? 'Active' : 'Attente'}</span>
                          {r.status === 'active' && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: r.is_available ? 'rgba(96,165,250,0.1)' : 'rgba(248,113,113,0.1)', color: r.is_available ? '#60a5fa' : '#f87171' }}>{r.is_available ? 'Dispo' : 'Indispo'}</span>}
                        </div>
                      </div>
                      <div className="dr-res-btns">
                        <Link href={`/residences/${r.id}`} className="dr-rbtn" style={{ color: accent, border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)' }}>Voir</Link>
                        <Link href={`/modifier/residence/${r.id}`} className="dr-rbtn" style={{ color: '#a78bfa', border: '0.5px solid rgba(167,139,250,0.2)', background: 'rgba(167,139,250,0.08)' }}>Modifier</Link>
                        {r.status === 'active' && <button onClick={() => toggleAvailability(r.id, r.is_available)} className="dr-rbtn" style={{ color: '#60a5fa', border: '0.5px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)' }}>{r.is_available ? 'Bloquer' : 'Libérer'}</button>}
                        <button onClick={() => deleteResidence(r.id)} className="dr-rbtn" style={{ color: '#f87171', border: '0.5px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)' }}>Retirer</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Aucune résidence publiée</p>
                  <Link href="/publier/residence" style={{ fontSize: 13, color: accent, textDecoration: 'none', padding: '8px 16px', borderRadius: 10, border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)' }}>Publier</Link>
                </div>
              )}
            </div>

            {/* Réservations reçues */}
            <div className="dr-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Réservations</h2>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>{bookings.filter(b => b.status !== 'pending_contact').length}</span>
              </div>
              {bookings.filter(b => b.status !== 'pending_contact').length > 0 ? (
                <div>
                  {bookings.filter(b => b.status !== 'pending_contact').slice(0, 8).map(b => {
                    const sc = b.status === 'confirmed' ? { c: '#22d3a5', bg: 'rgba(34,211,165,0.1)' } : b.status === 'cancelled' ? { c: '#f87171', bg: 'rgba(248,113,113,0.1)' } : { c: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' }
                    return (
                      <div key={b.id} className="dr-book-row">
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
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Aucune réservation</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}