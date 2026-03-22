'use client'

import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { formatPrice } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = { full_name: string; city: string; account_type: string }

export default function DashboardResidence({ profile, userId, showAll = false }: { profile: Profile; userId: string; showAll?: boolean }) {
  const [residences, setResidences] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [stats, setStats] = useState({ confirmed: 0, revenus_nets: 0, commission: 0 })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('residences').select('*').eq('owner_id', userId).order('created_at', { ascending: false })
      .then(({ data }) => setResidences((data ?? []) as any[]))

    supabase.from('bookings').select('*').eq('item_type', 'residence').order('created_at', { ascending: false })
      .then(async ({ data: allRaw }) => {
        const all = (allRaw ?? []) as any[]
        if (!all.length) return
        const { data: myResRaw } = await supabase.from('residences').select('id').eq('owner_id', userId)
        const ids = ((myResRaw ?? []) as any[]).map((r: any) => r.id)
        const mine = all.filter((b: any) => ids.includes(b.item_id))
        setBookings(mine)
        const confirmed = mine.filter((b: any) => b.status === 'confirmed')
        const brut = confirmed.reduce((s: number, b: any) => s + b.total_price, 0)
        const com = confirmed.reduce((s: number, b: any) => s + (b.commission_amount || Math.round(b.total_price * 0.1)), 0)
        setStats({ confirmed: confirmed.length, revenus_nets: brut - com, commission: com })
      })
  }, [userId])

  async function toggleAvailability(id: string, current: boolean) {
    const supabase = createClient()
    await (supabase.from('residences') as any).update({ is_available: !current }).eq('id', id)
    setResidences(prev => prev.map(r => r.id === id ? { ...r, is_available: !current } : r))
  }

  async function deleteResidence(id: string) {
    if (!confirm('Désactiver cette résidence ?')) return
    const supabase = createClient()
    await (supabase.from('residences') as any).update({ status: 'inactive' }).eq('id', id)
    setResidences(prev => prev.filter(r => r.id !== id))
  }

  const accent = '#22d3a5'
  const card = { background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16 }

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 11, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Dashboard</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>Bonjour, {profile.full_name.split(' ')[0]}</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{profile.city} · Propriétaire résidences</p>
          </div>
          <Link href="/publier/residence" style={{ padding: '12px 22px', background: accent, color: '#0a1a14', borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>+ Nouvelle résidence</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Résidences', value: residences.length, color: accent },
            { label: 'Confirmées', value: stats.confirmed, color: '#fff' },
            { label: 'Commission (10%)', value: `− ${formatPrice(stats.commission)}`, color: '#f87171' },
            { label: 'Vous recevez', value: formatPrice(stats.revenus_nets), color: accent, highlight: true },
          ].map((s, i) => (
            <div key={i} style={{ ...card, padding: 24, background: s.highlight ? 'rgba(34,211,165,0.06)' : '#111827', border: s.highlight ? '0.5px solid rgba(34,211,165,0.2)' : '0.5px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{s.label}</p>
              <p style={{ fontSize: i > 1 ? 18 : 28, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {stats.revenus_nets > 0 && (
          <div style={{ ...card, padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Répartition des revenus</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Total : {formatPrice(stats.revenus_nets + stats.commission)}</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: accent, width: `${Math.round((stats.revenus_nets / (stats.revenus_nets + stats.commission || 1)) * 100)}%` }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: accent }} /><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Vous (90%)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} /><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Zando (10%)</span></div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ ...card, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Mes résidences</h2>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{residences.length}</span>
            </div>
            {residences.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {residences.map(r => (
                  <div key={r.id} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#1a2236', flexShrink: 0 }}>
                      {(r.main_photo || (Array.isArray(r.photos) && r.photos[0])) ? <img src={r.main_photo || r.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'rgba(255,255,255,0.15)' }}>⌂</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>{r.title}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{r.city} · {formatPrice(r.price_per_night)}/nuit</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: r.status === 'active' ? 'rgba(34,211,165,0.1)' : 'rgba(251,191,36,0.1)', color: r.status === 'active' ? '#22d3a5' : '#fbbf24', border: `0.5px solid ${r.status === 'active' ? 'rgba(34,211,165,0.2)' : 'rgba(251,191,36,0.2)'}` }}>{r.status === 'active' ? 'Active' : 'En attente'}</span>
                        {r.status === 'active' && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: r.is_available ? 'rgba(96,165,250,0.1)' : 'rgba(248,113,113,0.1)', color: r.is_available ? '#60a5fa' : '#f87171', border: `0.5px solid ${r.is_available ? 'rgba(96,165,250,0.2)' : 'rgba(248,113,113,0.2)'}` }}>{r.is_available ? 'Disponible' : 'Indisponible'}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                      <Link href={`/residences/${r.id}`} style={{ fontSize: 11, color: accent, padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)', textDecoration: 'none', textAlign: 'center' }}>Voir</Link>
                      <Link href={`/modifier/residence/${r.id}`} style={{ fontSize: 11, color: '#a78bfa', padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(167,139,250,0.2)', background: 'rgba(167,139,250,0.08)', textDecoration: 'none', textAlign: 'center' }}>Modifier</Link>
                      {r.status === 'active' && <button onClick={() => toggleAvailability(r.id, r.is_available)} style={{ fontSize: 11, color: '#60a5fa', padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)', cursor: 'pointer' }}>{r.is_available ? 'Bloquer' : 'Libérer'}</button>}
                      <button onClick={() => deleteResidence(r.id)} style={{ fontSize: 11, color: '#f87171', padding: '4px 10px', borderRadius: 8, border: '0.5px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)', cursor: 'pointer' }}>Retirer</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>⌂</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Aucune résidence publiée</p>
                <Link href="/publier/residence" style={{ fontSize: 13, color: accent, textDecoration: 'none', padding: '9px 18px', borderRadius: 10, border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)' }}>Publier ma première résidence</Link>
              </div>
            )}
          </div>

          <div style={{ ...card, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Réservations reçues</h2>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{bookings.length}</span>
            </div>
            {bookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {bookings.slice(0, 8).map((b, i) => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 7 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div>
                      <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>{b.reference}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{b.client_name}</p>
                      {b.start_date && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{b.start_date} → {b.end_date}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{formatPrice(b.total_price)}</p>
                      {b.owner_amount > 0 && <p style={{ fontSize: 11, color: accent, marginBottom: 4 }}>{formatPrice(b.owner_amount)}</p>}
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, display: 'inline-block', background: b.status === 'confirmed' ? 'rgba(34,211,165,0.1)' : b.status === 'pending' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)', color: b.status === 'confirmed' ? '#22d3a5' : b.status === 'pending' ? '#fbbf24' : '#f87171', border: `0.5px solid ${b.status === 'confirmed' ? 'rgba(34,211,165,0.2)' : b.status === 'pending' ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                        {b.status === 'confirmed' ? 'Confirmée' : b.status === 'pending' ? 'En attente' : 'Annulée'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>◈</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Aucune réservation reçue</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}