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
      .then(({ data }) => setEvents(data ?? []))

    supabase.from('bookings').select('*').eq('item_type', 'event').order('created_at', { ascending: false })
      .then(async ({ data: allBookings }) => {
        if (!allBookings) return
        const { data: myEvts } = await supabase.from('events').select('id').eq('owner_id', userId)
        const myIds = (myEvts ?? []).map((e: any) => e.id)
        const myBookings = allBookings.filter(b => myIds.includes(b.item_id))
        setBookings(myBookings)
        const confirmed = myBookings.filter(b => b.status === 'confirmed')
        const billets = confirmed.reduce((sum, b) => sum + (b.tickets_count || 0), 0)
        const revenus_bruts = confirmed.reduce((sum, b) => sum + b.total_price, 0)
        const commission = confirmed.reduce((sum, b) => sum + (b.commission_amount || Math.round(b.total_price * 0.1)), 0)
        setStats({ billets, revenus_nets: revenus_bruts - commission, commission, total_events: myEvts?.length ?? 0 })
      })
  }, [userId])

  async function deleteEvent(id: string) {
    if (!confirm('Désactiver cet événement ?')) return
    const supabase = createClient()
    await supabase.from('events').update({ status: 'inactive' }).eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const today = new Date().toISOString().split('T')[0]

  const d = {
    page: { background: '#0a0f1a', minHeight: '100vh' },
    wrap: { maxWidth: 1200, margin: '0 auto', padding: '40px 48px' },
    accent: '#a78bfa',
    accentBg: 'rgba(167,139,250,0.1)',
    accentBorder: 'rgba(167,139,250,0.2)',
    card: { background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16 },
  }

  return (
    <div style={d.page}>
      <Navbar />
      <div style={d.wrap}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 11, color: d.accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Dashboard</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>Bonjour, {profile.full_name.split(' ')[0]}</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{profile.city} · Organisateur d&apos;événements</p>
          </div>
          <Link href="/publier/evenement" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 22px', background: d.accent, color: '#1a0a3d',
            borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}>
            + Nouvel événement
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Événements', value: events.length, color: d.accent, sub: 'créés' },
            { label: 'Billets vendus', value: stats.billets, color: '#22d3a5', sub: 'confirmés' },
            { label: 'Commission (10%)', value: `− ${formatPrice(stats.commission)}`, color: '#f87171', sub: 'Zando CI' },
            { label: 'Vous recevez', value: formatPrice(stats.revenus_nets), color: '#22d3a5', sub: '90% des ventes', highlight: true },
          ].map((stat, i) => (
            <div key={i} style={{
              ...d.card, padding: 24,
              background: stat.highlight ? 'rgba(34,211,165,0.06)' : '#111827',
              border: stat.highlight ? '0.5px solid rgba(34,211,165,0.2)' : '0.5px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{stat.label}</p>
              <p style={{ fontSize: i > 1 ? 18 : 28, fontWeight: 800, color: stat.color, letterSpacing: -0.5 }}>{stat.value}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Barre commission */}
        {stats.revenus_nets > 0 && (
          <div style={{ ...d.card, padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Répartition des revenus</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Total : {formatPrice(stats.revenus_nets + stats.commission)}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, background: '#22d3a5',
                  width: `${Math.round((stats.revenus_nets / (stats.revenus_nets + stats.commission)) * 100)}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#22d3a5' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Vous (90%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Zando (10%)</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Mes événements */}
          <div style={{ ...d.card, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Mes événements</h2>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{events.length}</span>
            </div>

            {events.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {events.map(e => {
                  const isPast = e.event_date < today
                  const remaining = (e.total_capacity ?? e.total_tickets ?? 0) - (e.tickets_sold ?? 0)
                  const total = e.total_capacity ?? e.total_tickets ?? 1
                  const fillRate = Math.round(((e.tickets_sold ?? 0) / total) * 100)
                  return (
                    <div key={e.id} style={{
                      background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)',
                      borderRadius: 12, padding: 14,
                    }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        {/* Photo */}
                        <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#1a2236', flexShrink: 0 }}>
                          {(e.main_photo || e.cover_image)
                            ? <img src={e.main_photo || e.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'rgba(255,255,255,0.15)' }}>◉</div>
                          }
                        </div>
                        {/* Infos */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{e.title}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{formatDate(e.event_date)} · {e.venue_name}</p>
                          {/* Barre remplissage */}
                          <div style={{ marginTop: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{e.tickets_sold ?? 0} / {total} billets</span>
                              <span style={{ fontSize: 11, color: fillRate >= 90 ? '#f87171' : fillRate >= 60 ? '#fbbf24' : '#22d3a5', fontWeight: 600 }}>{fillRate}%</span>
                            </div>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 2,
                                background: fillRate >= 90 ? '#f87171' : fillRate >= 60 ? '#fbbf24' : '#22d3a5',
                                width: `${fillRate}%`, transition: 'width 0.5s ease',
                              }} />
                            </div>
                          </div>
                        </div>
                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                          <Link href={`/events/${e.id}`} style={{
                            fontSize: 11, color: d.accent, padding: '4px 10px', borderRadius: 8,
                            border: `0.5px solid ${d.accentBorder}`, background: d.accentBg,
                            textDecoration: 'none', textAlign: 'center',
                          }}>Voir</Link>
                          {!isPast && (
                            <Link href={`/modifier/evenement/${e.id}`} style={{
                              fontSize: 11, color: '#22d3a5', padding: '4px 10px', borderRadius: 8,
                              border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)',
                              textDecoration: 'none', textAlign: 'center',
                            }}>Modifier</Link>
                          )}
                          {!isPast && (
                            <button onClick={() => deleteEvent(e.id)} style={{
                              fontSize: 11, color: '#f87171', padding: '4px 10px', borderRadius: 8,
                              border: '0.5px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)',
                              cursor: 'pointer',
                            }}>Retirer</button>
                          )}
                        </div>
                      </div>

                      {/* Badges statut */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                          background: isPast ? 'rgba(255,255,255,0.05)' : remaining === 0 ? 'rgba(248,113,113,0.15)' : 'rgba(34,211,165,0.1)',
                          color: isPast ? 'rgba(255,255,255,0.3)' : remaining === 0 ? '#f87171' : '#22d3a5',
                          border: `0.5px solid ${isPast ? 'rgba(255,255,255,0.08)' : remaining === 0 ? 'rgba(248,113,113,0.2)' : 'rgba(34,211,165,0.2)'}`,
                        }}>
                          {isPast ? 'Terminé' : remaining === 0 ? 'Complet' : `${remaining} restants`}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                          background: e.status === 'active' ? 'rgba(34,211,165,0.1)' : e.status === 'pending' ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.05)',
                          color: e.status === 'active' ? '#22d3a5' : e.status === 'pending' ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                          border: `0.5px solid ${e.status === 'active' ? 'rgba(34,211,165,0.2)' : e.status === 'pending' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.08)'}`,
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
                <Link href="/publier/evenement" style={{
                  fontSize: 13, color: d.accent, textDecoration: 'none',
                  padding: '9px 18px', borderRadius: 10,
                  border: `0.5px solid ${d.accentBorder}`, background: d.accentBg,
                }}>Créer mon premier événement</Link>
              </div>
            )}
          </div>

          {/* Ventes de billets */}
          <div style={{ ...d.card, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Ventes de billets</h2>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{bookings.length} commandes</span>
            </div>

            {bookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {bookings.slice(0, 8).map((b, i) => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < Math.min(bookings.length, 8) - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>{b.reference}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{b.client_name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{b.tickets_count} billet{b.tickets_count > 1 ? 's' : ''}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{formatPrice(b.total_price)}</p>
                      {b.owner_amount > 0 && <p style={{ fontSize: 11, color: '#22d3a5', marginBottom: 4 }}>{formatPrice(b.owner_amount)}</p>}
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, display: 'inline-block',
                        background: b.status === 'confirmed' ? 'rgba(34,211,165,0.1)' : b.status === 'pending' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)',
                        color: b.status === 'confirmed' ? '#22d3a5' : b.status === 'pending' ? '#fbbf24' : '#f87171',
                        border: `0.5px solid ${b.status === 'confirmed' ? 'rgba(34,211,165,0.2)' : b.status === 'pending' ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}`,
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
  )
}