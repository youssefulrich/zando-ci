'use client'

import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { formatPrice, formatDate } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = { full_name: string; city: string; account_type: string }

export default function DashboardClient({ profile, userId }: { profile: Profile; userId: string }) {
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('bookings').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setBookings(data ?? []))
  }, [userId])

  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  const pending = bookings.filter(b => b.status === 'pending').length

  const card = { background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16 }

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 48px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Mon espace</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>
            Bonjour, {profile.full_name.split(' ')[0]}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{profile.city} · Client</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total réservations', value: bookings.length, color: '#fff' },
            { label: 'Confirmées', value: confirmed, color: '#22d3a5', highlight: true },
            { label: 'En attente', value: pending, color: '#fbbf24' },
          ].map((s, i) => (
            <div key={i} style={{
              ...card, padding: 24,
              background: s.highlight ? 'rgba(34,211,165,0.06)' : '#111827',
              border: s.highlight ? '0.5px solid rgba(34,211,165,0.2)' : '0.5px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{s.label}</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: -1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Explorer */}
        <div style={{ ...card, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Explorer</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { href: '/residences', label: 'Résidences', desc: 'Villas, apparts, studios', color: '#22d3a5', bg: 'rgba(34,211,165,0.08)', border: 'rgba(34,211,165,0.15)' },
              { href: '/vehicles', label: 'Véhicules', desc: 'SUV, berlines, 4x4', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.15)' },
              { href: '/events', label: 'Événements', desc: 'Concerts, festivals', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{
                display: 'block', padding: '20px', borderRadius: 12,
                background: item.bg, border: `0.5px solid ${item.border}`,
                textDecoration: 'none', transition: 'opacity 0.2s',
              }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{item.desc}</p>
                <p style={{ fontSize: 16, color: item.color, marginTop: 12 }}>→</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Réservations */}
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Mes réservations</h2>
            <Link href="/mes-reservations" style={{ fontSize: 12, color: '#22d3a5', textDecoration: 'none' }}>Voir tout</Link>
          </div>
          {bookings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {bookings.map((b, i) => (
                <div key={b.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0', borderBottom: i < bookings.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <div>
                    <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>{b.reference}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2, textTransform: 'capitalize' }}>{b.item_type}</p>
                    {b.start_date && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{formatDate(b.start_date)}</p>}
                    {b.tickets_count && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{b.tickets_count} billet{b.tickets_count > 1 ? 's' : ''}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{formatPrice(b.total_price)}</p>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block',
                      background: b.status === 'confirmed' ? 'rgba(34,211,165,0.1)' : b.status === 'pending' ? 'rgba(251,191,36,0.1)' : b.status === 'cancelled' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)',
                      color: b.status === 'confirmed' ? '#22d3a5' : b.status === 'pending' ? '#fbbf24' : b.status === 'cancelled' ? '#f87171' : 'rgba(255,255,255,0.4)',
                      border: `0.5px solid ${b.status === 'confirmed' ? 'rgba(34,211,165,0.2)' : b.status === 'pending' ? 'rgba(251,191,36,0.2)' : b.status === 'cancelled' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    }}>
                      {b.status === 'confirmed' ? 'Confirmée' : b.status === 'pending' ? 'En attente' : b.status === 'cancelled' ? 'Annulée' : 'Terminée'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>◈</div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Aucune réservation</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginBottom: 20 }}>Explorez nos annonces pour commencer</p>
              <Link href="/residences" style={{ fontSize: 13, color: '#22d3a5', textDecoration: 'none', padding: '9px 18px', borderRadius: 10, border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)' }}>
                Explorer les annonces
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}