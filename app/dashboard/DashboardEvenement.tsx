'use client'

import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { formatPrice, formatDate } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = { full_name: string; city: string; account_type: string }

export default function DashboardEvenement({ profile, userId }: { profile: Profile; userId: string }) {
  const [events, setEvents] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [stats, setStats] = useState({ billets: 0, revenus_nets: 0, commission: 0, total_events: 0 })

  useEffect(() => {
    const supabase = createClient()

    supabase.from('events').select('*').eq('owner_id', userId).order('event_date', { ascending: true })
      .then(({ data }) => setEvents((data ?? []) as any[]))

    supabase.from('bookings').select('*').eq('item_type', 'event').order('created_at', { ascending: false })
      .then(async ({ data: allBookingsRaw }) => {
        const allBookings = (allBookingsRaw ?? []) as any[]
        if (!allBookings.length) return
        const { data: myEvtsRaw } = await supabase.from('events').select('id').eq('owner_id', userId)
        const myEvts = (myEvtsRaw ?? []) as any[]
        const myIds = myEvts.map((e: any) => e.id)
        const myBookings = allBookings.filter((b: any) => myIds.includes(b.item_id))
        setBookings(myBookings)
        const confirmed = myBookings.filter((b: any) => b.status === 'confirmed')
        const billets = confirmed.reduce((sum: number, b: any) => sum + (b.tickets_count || 0), 0)
        const revenus_bruts = confirmed.reduce((sum: number, b: any) => sum + b.total_price, 0)
        const commission = confirmed.reduce((sum: number, b: any) => sum + (b.commission_amount || Math.round(b.total_price * 0.1)), 0)
        setStats({ billets, revenus_nets: revenus_bruts - commission, commission, total_events: myEvts.length })
      })
  }, [userId])

  async function deleteEvent(id: string) {
    if (!confirm('Désactiver cet événement ?')) return
    const supabase = createClient()
    await (supabase.from('events') as any).update({ status: 'inactive' }).eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const today = new Date().toISOString().split('T')[0]
  const accent = '#a78bfa'
  const accentBg = 'rgba(167,139,250,0.1)'
  const accentBorder = 'rgba(167,139,250,0.2)'
  const card = { background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16 }

  return (
    <>
      <style>{`
        .de-wrap { max-width: 1200px; margin: 0 auto; padding: 40px 48px; }
        .de-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 40px; }
        .de-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }

        /* Revenue bar */
        .de-revbar { display: flex; align-items: center; gap: 32px; }
        .de-revbar-labels { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
        .de-revbar-label { font-size: 12px; color: rgba(255,255,255,0.4); }
        .de-revlegend { display: flex; gap: 24px; flex-shrink: 0; }

        /* Two column layout */
        .de-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .de-booking-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; }

        /* Event card */
        .de-event-card-inner { display: flex; gap: 12px; align-items: flex-start; }
        .de-event-info { flex: 1; min-width: 0; }
        .de-event-title {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 3px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-break: break-word;
        }
        .de-item-actions { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }

        /* ── MOBILE ────────────────────────────────── */
        @media (max-width: 767px) {
          .de-wrap { padding: 24px 16px; }

          .de-header { flex-direction: column; gap: 16px; align-items: flex-start; }
          .de-header a { width: 100%; text-align: center; box-sizing: border-box; }

          .de-stats { grid-template-columns: 1fr 1fr; }

          /* Revenue bar: stack vertically */
          .de-revbar { flex-direction: column; gap: 16px; align-items: stretch; }
          .de-revlegend { gap: 16px; }

          .de-two-col { grid-template-columns: 1fr; }

          .de-booking-row { flex-direction: column; align-items: flex-start; gap: 6px; }

          /* Event card: wrap actions below content */
          .de-event-card-inner { flex-wrap: wrap; }
          .de-item-actions {
            flex-direction: row !important;
            flex-wrap: wrap;
            gap: 6px !important;
            width: 100%;
            margin-top: 4px;
          }
          .de-item-actions a,
          .de-item-actions button { flex: 1; text-align: center; min-width: 70px; }

          .de-title { font-size: 26px !important; }
        }

        /* ── TABLET ────────────────────────────────── */
        @media (min-width: 768px) and (max-width: 1023px) {
          .de-wrap { padding: 32px 24px; }
          .de-stats { grid-template-columns: repeat(2, 1fr); }
          .de-two-col { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
        <Navbar />
        <div className="de-wrap">

          {/* ── Header ── */}
          <div className="de-header">
            <div>
              <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Dashboard</div>
              <h1 className="de-title" style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>
                Bonjour, {profile.full_name.split(' ')[0]}
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{profile.city} · Organisateur d&apos;événements</p>
            </div>
            <Link href="/publier/evenement" style={{ padding: '12px 22px', background: accent, color: '#1a0a3d', borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              + Nouvel événement
            </Link>
          </div>

          {/* ── Stats ── */}
          <div className="de-stats">
            {[
              { label: 'Événements', value: events.length, color: accent, sub: 'créés' },
              { label: 'Billets vendus', value: stats.billets, color: '#22d3a5', sub: 'confirmés' },
              { label: 'Commission (10%)', value: `− ${formatPrice(stats.commission)}`, color: '#f87171', sub: 'Zando CI' },
              { label: 'Vous recevez', value: formatPrice(stats.revenus_nets), color: '#22d3a5', sub: '90% des ventes', highlight: true },
            ].map((stat, i) => (
              <div key={i} style={{
                ...card,
                padding: 24,
                background: stat.highlight ? 'rgba(34,211,165,0.06)' : '#111827',
                border: stat.highlight ? '0.5px solid rgba(34,211,165,0.2)' : '0.5px solid rgba(255,255,255,0.08)'
              }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{stat.label}</p>
                <p style={{ fontSize: i > 1 ? 18 : 28, fontWeight: 800, color: stat.color, letterSpacing: -0.5 }}>{stat.value}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Revenue bar ── */}
          {stats.revenus_nets > 0 && (
            <div style={{ ...card, padding: '20px 24px', marginBottom: 32 }}>
              <div className="de-revbar">
                <div style={{ flex: 1 }}>
                  {/* FIX: labels sur deux lignes si besoin, gap entre les deux */}
                  <div className="de-revbar-labels">
                    <span className="de-revbar-label">Répartition des revenus</span>
                    <span className="de-revbar-label">Total : {formatPrice(stats.revenus_nets + stats.commission)}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: 4,
                      background: '#22d3a5',
                      width: `${Math.round((stats.revenus_nets / (stats.revenus_nets + stats.commission)) * 100)}%`,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
                <div className="de-revlegend">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: '#22d3a5', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Vous (90%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Zando (10%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Two columns ── */}
          <div className="de-two-col">

            {/* Mes événements */}
            <div style={{ ...card, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Mes événements</h2>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{events.length}</span>
              </div>

              {events.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {events.map(e => {
                    const isPast = e.event_date < today
                    const totalCap = e.total_capacity ?? e.total_tickets ?? 1
                    const remaining = totalCap - (e.tickets_sold ?? 0)
                    const fillRate = Math.round(((e.tickets_sold ?? 0) / totalCap) * 100)
                    return (
                      <div key={e.id} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14 }}>

                        {/* FIX: classe de-event-card-inner pour le wrapping mobile */}
                        <div className="de-event-card-inner">

                          {/* Thumbnail */}
                          <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#1a2236', flexShrink: 0 }}>
                            {(e.main_photo || e.cover_image)
                              ? <img src={e.main_photo || e.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'rgba(255,255,255,0.15)' }}>◉</div>
                            }
                          </div>

                          {/* FIX: classe de-event-info + de-event-title pour le truncate propre */}
                          <div className="de-event-info">
                            <p className="de-event-title">{e.title}</p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{formatDate(e.event_date)} · {e.venue_name}</p>
                            <div style={{ marginTop: 10 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{e.tickets_sold ?? 0} / {totalCap} billets</span>
                                <span style={{ fontSize: 11, color: fillRate >= 90 ? '#f87171' : fillRate >= 60 ? '#fbbf24' : '#22d3a5', fontWeight: 600 }}>{fillRate}%</span>
                              </div>
                              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 2, background: fillRate >= 90 ? '#f87171' : fillRate >= 60 ? '#fbbf24' : '#22d3a5', width: `${fillRate}%`, transition: 'width 0.5s ease' }} />
                              </div>
                            </div>
                          </div>

                          {/* FIX: actions en colonne sur desktop, en ligne sur mobile via CSS */}
                          <div className="de-item-actions">
                            <Link href={`/events/${e.id}`} style={{ fontSize: 11, color: accent, padding: '4px 10px', borderRadius: 8, border: `0.5px solid ${accentBorder}`, background: accentBg, textDecoration: 'none', textAlign: 'center' }}>
                              Voir
                            </Link>
                            {!isPast && (
                              <Link href={`/modifier/evenement/${e.id}`} style={{ fontSize: 11, color: '#22d3a5', padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)', textDecoration: 'none', textAlign: 'center' }}>
                                Modifier
                              </Link>
                            )}
                            {!isPast && (
                              <button onClick={() => deleteEvent(e.id)} style={{ fontSize: 11, color: '#f87171', padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)', cursor: 'pointer' }}>
                                Retirer
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                            background: isPast ? 'rgba(255,255,255,0.05)' : remaining === 0 ? 'rgba(248,113,113,0.15)' : 'rgba(34,211,165,0.1)',
                            color: isPast ? 'rgba(255,255,255,0.3)' : remaining === 0 ? '#f87171' : '#22d3a5',
                            border: `0.5px solid ${isPast ? 'rgba(255,255,255,0.08)' : remaining === 0 ? 'rgba(248,113,113,0.2)' : 'rgba(34,211,165,0.2)'}`
                          }}>
                            {isPast ? 'Terminé' : remaining === 0 ? 'Complet' : `${remaining} restants`}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                            background: e.status === 'active' ? 'rgba(34,211,165,0.1)' : e.status === 'pending' ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.05)',
                            color: e.status === 'active' ? '#22d3a5' : e.status === 'pending' ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                            border: `0.5px solid ${e.status === 'active' ? 'rgba(34,211,165,0.2)' : e.status === 'pending' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.08)'}`
                          }}>
                            {e.status === 'active' ? 'Publié' : e.status === 'pending' ? 'En validation' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>◉</div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Aucun événement créé</p>
                  <Link href="/publier/evenement" style={{ fontSize: 13, color: accent, textDecoration: 'none', padding: '9px 18px', borderRadius: 10, border: `0.5px solid ${accentBorder}`, background: accentBg }}>
                    Créer mon premier événement
                  </Link>
                </div>
              )}
            </div>

            {/* Ventes de billets */}
            <div style={{ ...card, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Ventes de billets</h2>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{bookings.length} commandes</span>
              </div>

              {bookings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {bookings.slice(0, 8).map((b, i) => (
                    <div key={b.id} className="de-booking-row" style={{ borderBottom: i < Math.min(bookings.length, 8) - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>{b.reference}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.client_name}</p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{b.tickets_count} billet{b.tickets_count > 1 ? 's' : ''}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{formatPrice(b.total_price)}</p>
                        {b.owner_amount > 0 && <p style={{ fontSize: 11, color: '#22d3a5', marginBottom: 4 }}>{formatPrice(b.owner_amount)}</p>}
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, display: 'inline-block',
                          background: b.status === 'confirmed' ? 'rgba(34,211,165,0.1)' : b.status === 'pending' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)',
                          color: b.status === 'confirmed' ? '#22d3a5' : b.status === 'pending' ? '#fbbf24' : '#f87171',
                          border: `0.5px solid ${b.status === 'confirmed' ? 'rgba(34,211,165,0.2)' : b.status === 'pending' ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}`
                        }}>
                          {b.status === 'confirmed' ? 'Payé' : b.status === 'pending' ? 'En attente' : 'Annulé'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>◈</div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Aucune vente de billets</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}