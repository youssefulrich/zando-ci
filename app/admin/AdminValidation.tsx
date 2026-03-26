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
      background: 'linear-gradient(135deg, rgba(34,211,165,0.06) 0%, rgba(8,145,178,0.04) 100%)',
      border: '0.5px solid rgba(34,211,165,0.2)',
      borderRadius: 20, padding: '24px 28px', marginBottom: 24,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,211,165,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>✅</div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#22d3a5', marginBottom: 2 }}>Toutes les annonces sont validées</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Aucune annonce en attente de modération</p>
      </div>
    </div>
  )

  async function approve(table: TableName, id: string, setter: (fn: (prev: any[]) => any[]) => void) {
    setLoading(id)
    const supabase = createClient()
    await (supabase.from(table) as any).update({ status: 'active' }).eq('id', id)
    setter(prev => prev.filter((i: any) => i.id !== id))
    setLoading(null)
  }

  async function reject(table: TableName, id: string, setter: (fn: (prev: any[]) => any[]) => void) {
    if (!confirm('Rejeter et supprimer cette annonce définitivement ?')) return
    setLoading(id)
    const supabase = createClient()
    await (supabase.from(table) as any).update({ status: 'rejected' }).eq('id', id)
    setter(prev => prev.filter((i: any) => i.id !== id))
    setLoading(null)
  }

  const TABS = [
    { key: 'all' as const, label: 'Toutes', count: totalPending, color: '#fbbf24', icon: '◈' },
    { key: 'residences' as const, label: 'Résidences', count: residences.length, color: '#22d3a5', icon: '⌂' },
    { key: 'vehicles' as const, label: 'Véhicules', count: vehicles.length, color: '#60a5fa', icon: '◈' },
    { key: 'events' as const, label: 'Événements', count: events.length, color: '#a78bfa', icon: '◉' },
  ]

  function Card({ item, table, setter, type }: {
    item: any; table: TableName
    setter: (fn: (prev: any[]) => any[]) => void; type: ItemType
  }) {
    const configs = {
      residence: { color: '#22d3a5', rgb: '34,211,165', label: 'Résidence', icon: '⌂' },
      vehicle:   { color: '#60a5fa', rgb: '96,165,250', label: 'Véhicule',  icon: '◈' },
      event:     { color: '#a78bfa', rgb: '167,139,250', label: 'Événement', icon: '◉' },
    }
    const { color, rgb, label, icon } = configs[type]
    const photo = item.main_photo || item.cover_image || (Array.isArray(item.photos) && item.photos[0]) || null
    const isLoading = loading === item.id
    const detailUrl = type === 'residence' ? `/residences/${item.id}` : type === 'vehicle' ? `/vehicles/${item.id}` : `/events/${item.id}`
    const price = item.price_per_night || item.price_per_day || item.ticket_price || null
    const priceLabel = item.price_per_night ? '/nuit' : item.price_per_day ? '/jour' : '/billet'

    return (
      <div className="av-card" style={{
        background: '#0f1929',
        border: `0.5px solid rgba(${rgb},0.15)`,
        borderRadius: 16, overflow: 'hidden',
        display: 'grid', gridTemplateColumns: '80px 1fr auto',
        transition: 'border-color 0.2s',
      }}>
        {/* Photo */}
        <div style={{ position: 'relative', background: '#1a2236' }}>
          {photo
            ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: `rgba(${rgb},0.2)` }}>{icon}</div>
          }
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, rgba(${rgb},0.3) 0%, transparent 60%)`,
          }} />
          <div style={{
            position: 'absolute', bottom: 6, left: 6,
            background: `rgba(${rgb},0.9)`, borderRadius: 4,
            fontSize: 8, fontWeight: 800, color: '#0a0f1a',
            padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{label}</div>
        </div>

        {/* Infos */}
        <div style={{ padding: '14px 16px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>
              {item.id?.slice(0, 8)}...
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
              {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.title || `${item.brand} ${item.model} ${item.year}`}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ opacity: 0.6 }}>📍</span> {item.city}
            </span>
            {price && (
              <span style={{ fontSize: 13, fontWeight: 700, color }}>
                {formatPrice(price)}<span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{priceLabel}</span>
              </span>
            )}
          </div>
          {item.profiles && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              Par <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{(item.profiles as any).full_name}</span>
              {(item.profiles as any).phone && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · {(item.profiles as any).phone}</span>}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="av-actions" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 14px 14px 0', justifyContent: 'center' }}>
          <button onClick={() => approve(table, item.id, setter)} disabled={isLoading} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: isLoading ? 'rgba(34,211,165,0.15)' : 'rgba(34,211,165,0.15)',
            color: isLoading ? '#64748b' : '#22d3a5',
            fontWeight: 700, fontSize: 12, cursor: isLoading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap', transition: 'all 0.15s',
            outline: '1px solid rgba(34,211,165,0.3)',
          }}>
            {isLoading ? '···' : '✓ Valider'}
          </button>
          <button onClick={() => reject(table, item.id, setter)} disabled={isLoading} style={{
            padding: '8px 16px', borderRadius: 8,
            border: '0.5px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.06)',
            color: '#f87171', fontWeight: 600, fontSize: 12,
            cursor: isLoading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
          }}>
            ✕ Rejeter
          </button>
          <Link href={detailUrl} target="_blank" style={{
            padding: '7px 16px', borderRadius: 8, textAlign: 'center',
            border: `0.5px solid rgba(${rgb},0.2)`, background: `rgba(${rgb},0.06)`,
            color, fontSize: 12, textDecoration: 'none', display: 'block',
          }}>
            Voir →
          </Link>
        </div>
      </div>
    )
  }

  const visibleResidences = activeTab === 'all' || activeTab === 'residences' ? residences : []
  const visibleVehicles = activeTab === 'all' || activeTab === 'vehicles' ? vehicles : []
  const visibleEvents = activeTab === 'all' || activeTab === 'events' ? events : []

  return (
    <>
      <style>{`
        .av-card { transition: border-color 0.2s, transform 0.15s; }
        .av-card:hover { border-color: rgba(251,191,36,0.3) !important; }
        @media (max-width: 767px) {
          .av-card { grid-template-columns: 72px 1fr !important; }
          .av-actions { flex-direction: row !important; padding: 0 12px 12px !important; grid-column: 1 / -1; flex-wrap: wrap; }
          .av-actions a, .av-actions button { flex: 1; min-width: 80px; }
        }
      `}</style>

      <div style={{
        background: 'linear-gradient(135deg, rgba(251,191,36,0.04) 0%, rgba(10,15,26,0) 60%)',
        border: '0.5px solid rgba(251,191,36,0.18)',
        borderRadius: 20, padding: 24, marginBottom: 24,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(251,191,36,0.1)', border: '0.5px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>⚠️</div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Annonces en attente de validation</h2>
            <p style={{ fontSize: 12, color: 'rgba(251,191,36,0.6)' }}>{totalPending} annonce{totalPending > 1 ? 's' : ''} à modérer — vérifiez avant de publier</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.filter(t => t.count > 0 || t.key === 'all').map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '7px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
              background: activeTab === t.key ? 'rgba(255,255,255,0.07)' : 'transparent',
              border: activeTab === t.key ? '0.5px solid rgba(255,255,255,0.12)' : '0.5px solid rgba(255,255,255,0.04)',
              color: activeTab === t.key ? '#fff' : 'rgba(255,255,255,0.35)',
              fontWeight: activeTab === t.key ? 600 : 400,
              display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s',
            }}>
              {t.label}
              {t.count > 0 && (
                <span style={{
                  background: activeTab === t.key ? t.color : 'rgba(255,255,255,0.1)',
                  color: activeTab === t.key ? '#0a0f1a' : 'rgba(255,255,255,0.5)',
                  borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '1px 7px',
                  transition: 'all 0.15s',
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleResidences.map(r => <Card key={r.id} item={r} table="residences" setter={setResidences} type="residence" />)}
          {visibleVehicles.map(v => <Card key={v.id} item={v} table="vehicles" setter={setVehicles} type="vehicle" />)}
          {visibleEvents.map(e => <Card key={e.id} item={e} table="events" setter={setEvents} type="event" />)}
        </div>
      </div>
    </>
  )
}