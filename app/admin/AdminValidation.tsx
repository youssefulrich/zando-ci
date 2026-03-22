'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Props = {
  pendingResidences: any[]
  pendingVehicles: any[]
  pendingEvents: any[]
}

type TableName = 'residences' | 'vehicles' | 'events'
type ItemType = 'residence' | 'vehicle' | 'event'

export default function AdminValidation({ pendingResidences, pendingVehicles, pendingEvents }: Props) {
  const [residences, setResidences] = useState(pendingResidences)
  const [vehicles, setVehicles] = useState(pendingVehicles)
  const [events, setEvents] = useState(pendingEvents)
  const [loading, setLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'residences' | 'vehicles' | 'events'>('all')

  const totalPending = residences.length + vehicles.length + events.length

  if (totalPending === 0) return (
    <div style={{
      background: 'rgba(34,211,165,0.04)', border: '0.5px solid rgba(34,211,165,0.15)',
      borderRadius: 16, padding: '20px 24px', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 20 }}>✅</span>
      <p style={{ fontSize: 14, color: '#22d3a5', fontWeight: 500 }}>Toutes les annonces sont validées — aucune en attente</p>
    </div>
  )

  async function approve(table: TableName, id: string, setter: (fn: (prev: any[]) => any[]) => void) {
    setLoading(id)
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from(table) as any).update({ status: 'active' }).eq('id', id)
    setter(prev => prev.filter((i: any) => i.id !== id))
    setLoading(null)
  }

  async function reject(table: TableName, id: string, setter: (fn: (prev: any[]) => any[]) => void) {
    if (!confirm('Rejeter et supprimer cette annonce définitivement ?')) return
    setLoading(id)
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from(table) as any).update({ status: 'rejected' }).eq('id', id)
    setter(prev => prev.filter((i: any) => i.id !== id))
    setLoading(null)
  }

  const TABS = [
    { key: 'all' as const, label: 'Toutes', count: totalPending, color: '#fbbf24' },
    { key: 'residences' as const, label: '🏠 Résidences', count: residences.length, color: '#22d3a5' },
    { key: 'vehicles' as const, label: '🚗 Véhicules', count: vehicles.length, color: '#60a5fa' },
    { key: 'events' as const, label: '🎭 Événements', count: events.length, color: '#a78bfa' },
  ]

  function Card({ item, table, setter, type }: {
    item: any
    table: TableName
    setter: (fn: (prev: any[]) => any[]) => void
    type: ItemType
  }) {
    const accent = type === 'residence' ? '#22d3a5' : type === 'vehicle' ? '#60a5fa' : '#a78bfa'
    const accentRgb = type === 'residence' ? '34,211,165' : type === 'vehicle' ? '96,165,250' : '167,139,250'
    const photo = item.main_photo || item.cover_image || (Array.isArray(item.photos) && item.photos[0]) || null
    const isLoading = loading === item.id
    const detailUrl = type === 'residence' ? `/residences/${item.id}` : type === 'vehicle' ? `/vehicles/${item.id}` : `/events/${item.id}`

    return (
      <div style={{
        background: '#111827', border: '0.5px solid rgba(251,191,36,0.12)',
        borderRadius: 14, padding: 18, display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        {/* Photo */}
        <div style={{ width: 90, height: 68, borderRadius: 10, overflow: 'hidden', background: '#1a2236', flexShrink: 0, position: 'relative' }}>
          {photo
            ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'rgba(255,255,255,0.08)' }}>◈</div>
          }
          <div style={{
            position: 'absolute', top: 6, left: 6,
            background: `rgba(${accentRgb},0.9)`, borderRadius: 4,
            fontSize: 9, fontWeight: 700, color: '#0a0f1a', padding: '2px 6px',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>{type}</div>
        </div>

        {/* Infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
            {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.title || `${item.brand} ${item.model} ${item.year}`}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>📍 {item.city}</span>
            {item.price_per_night && <span style={{ fontSize: 12, color: accent, fontWeight: 600 }}>{formatPrice(item.price_per_night)}/nuit</span>}
            {item.price_per_day && <span style={{ fontSize: 12, color: accent, fontWeight: 600 }}>{formatPrice(item.price_per_day)}/jour</span>}
            {item.ticket_price && <span style={{ fontSize: 12, color: accent, fontWeight: 600 }}>{formatPrice(item.ticket_price)}/billet</span>}
          </div>
          {item.profiles && (
            <p style={{ fontSize: 12, color: '#475569' }}>
              Par <span style={{ color: '#94a3b8', fontWeight: 500 }}>{(item.profiles as any).full_name}</span>
              {(item.profiles as any).phone && <span> · {(item.profiles as any).phone}</span>}
            </p>
          )}
          {item.description && (
            <p style={{ fontSize: 12, color: '#334155', marginTop: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
              {item.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <button onClick={() => approve(table, item.id, setter)} disabled={isLoading} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: isLoading ? 'rgba(34,211,165,0.2)' : '#22d3a5',
            color: isLoading ? '#64748b' : '#0a0f1a',
            fontWeight: 700, fontSize: 12, cursor: isLoading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
          }}>
            {isLoading ? '...' : '✓ Valider'}
          </button>
          <button onClick={() => reject(table, item.id, setter)} disabled={isLoading} style={{
            padding: '8px 18px', borderRadius: 8,
            border: '0.5px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)',
            color: '#f87171', fontWeight: 600, fontSize: 12,
            cursor: isLoading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
          }}>
            ✕ Rejeter
          </button>
          <Link href={detailUrl} target="_blank" style={{
            padding: '7px 18px', borderRadius: 8, textAlign: 'center',
            border: `0.5px solid rgba(${accentRgb},0.2)`, background: `rgba(${accentRgb},0.06)`,
            color: accent, fontSize: 12, textDecoration: 'none', display: 'block',
          }}>
            👁 Voir
          </Link>
        </div>
      </div>
    )
  }

  const visibleResidences = activeTab === 'all' || activeTab === 'residences' ? residences : []
  const visibleVehicles = activeTab === 'all' || activeTab === 'vehicles' ? vehicles : []
  const visibleEvents = activeTab === 'all' || activeTab === 'events' ? events : []

  return (
    <div style={{
      background: 'rgba(251,191,36,0.03)', border: '0.5px solid rgba(251,191,36,0.2)',
      borderRadius: 16, padding: 24, marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Annonces en attente de validation</h2>
          <p style={{ fontSize: 12, color: '#92400e' }}>{totalPending} annonce{totalPending > 1 ? 's' : ''} soumise{totalPending > 1 ? 's' : ''} — vérifiez avant de valider</p>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {TABS.filter(t => t.count > 0 || t.key === 'all').map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            background: activeTab === t.key ? '#1e293b' : 'transparent',
            border: activeTab === t.key ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid transparent',
            color: activeTab === t.key ? '#fff' : '#475569',
            fontWeight: activeTab === t.key ? 600 : 400,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ background: t.key === 'all' ? '#fbbf24' : t.color, color: '#0a0f1a', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleResidences.map(r => <Card key={r.id} item={r} table="residences" setter={setResidences} type="residence" />)}
        {visibleVehicles.map(v => <Card key={v.id} item={v} table="vehicles" setter={setVehicles} type="vehicle" />)}
        {visibleEvents.map(e => <Card key={e.id} item={e} table="events" setter={setEvents} type="event" />)}
      </div>
    </div>
  )
}