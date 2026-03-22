import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { formatPrice, formatDate } from '@/lib/utils'

const TYPE_ICONS: Record<string, string> = { residence: '⌂', vehicle: '◈', event: '◉' }
const TYPE_LABELS: Record<string, string> = { residence: 'Résidence', vehicle: 'Véhicule', event: 'Événement' }
const TYPE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  residence: { color: '#22d3a5', bg: 'rgba(34,211,165,0.1)', border: 'rgba(34,211,165,0.2)' },
  vehicle:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
  event:     { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
}

function statusStyle(status: string) {
  switch (status) {
    case 'confirmed': return { color: '#22d3a5', bg: 'rgba(34,211,165,0.1)', border: 'rgba(34,211,165,0.2)', label: 'Confirmée' }
    case 'pending':   return { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', label: 'En attente' }
    case 'cancelled': return { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', label: 'Annulée' }
    case 'completed': return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', label: 'Terminée' }
    default:          return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', label: status }
  }
}

export default async function MesReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, payments(status, payment_method)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const now = new Date()

  const enCours   = bookings?.filter(b => b.status === 'confirmed' && (!b.end_date || new Date(b.end_date) >= now)) ?? []
  const enAttente = bookings?.filter(b => b.status === 'pending') ?? []
  const passees   = bookings?.filter(b => b.status === 'completed' || (b.status === 'confirmed' && b.end_date && new Date(b.end_date) < now)) ?? []
  const annulees  = bookings?.filter(b => b.status === 'cancelled') ?? []

  const card = {
    background: '#111827',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  }

  function BookingCard({ b }: { b: NonNullable<typeof bookings>[0] }) {
    const tc = TYPE_COLORS[b.item_type] ?? TYPE_COLORS.residence
    const ss = statusStyle(b.status)
    const payMethod = (b.payments as { payment_method?: string } | null)?.payment_method?.replace(/_/g, ' ') ?? null

    return (
      <div style={card}>
        {/* Icône type */}
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: tc.bg, border: `0.5px solid ${tc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: tc.color,
        }}>
          {TYPE_ICONS[b.item_type] ?? '◈'}
        </div>

        {/* Infos principales */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)' }}>{b.reference}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: ss.bg, color: ss.color, border: `0.5px solid ${ss.border}`,
            }}>{ss.label}</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
            {TYPE_LABELS[b.item_type] ?? b.item_type}
          </p>
          {b.start_date && b.end_date && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {formatDate(b.start_date)} → {formatDate(b.end_date)}
            </p>
          )}
          {b.tickets_count && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {b.tickets_count} billet{b.tickets_count > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Prix + moyen de paiement */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>{formatPrice(b.total_price)}</p>
          {payMethod && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, textTransform: 'capitalize' }}>{payMethod}</p>
          )}
        </div>
      </div>
    )
  }

  function Section({ title, items, empty, accent = '#22d3a5' }: {
    title: string
    items: NonNullable<typeof bookings>
    empty: string
    accent?: string
  }) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{title}</h2>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
            background: items.length > 0 ? `rgba(${accent === '#22d3a5' ? '34,211,165' : accent === '#fbbf24' ? '251,191,36' : '255,255,255'},0.1)` : 'rgba(255,255,255,0.05)',
            color: items.length > 0 ? accent : 'rgba(255,255,255,0.25)',
          }}>{items.length}</span>
        </div>

        {items.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(b => <BookingCard key={b.id} b={b} />)}
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.05)',
            borderRadius: 14, padding: '24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>{empty}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>
            Mon espace
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 4 }}>
            Mes réservations
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
            {bookings?.length ?? 0} réservation{(bookings?.length ?? 0) > 1 ? 's' : ''} au total
          </p>
        </div>

        {/* Résumé rapide */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 40 }}>
          {[
            { label: 'En cours', count: enCours.length, color: '#22d3a5', bg: 'rgba(34,211,165,0.08)', border: 'rgba(34,211,165,0.15)' },
            { label: 'En attente', count: enAttente.length, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.15)' },
            { label: 'Passées', count: passees.length, color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
            { label: 'Annulées', count: annulees.length, color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.15)' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, border: `0.5px solid ${s.border}`,
              borderRadius: 12, padding: '16px',
            }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>{s.count}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <Section title="En cours" items={enCours} empty="Aucune réservation en cours" accent="#22d3a5" />
          <Section title="En attente de paiement" items={enAttente} empty="Aucune réservation en attente" accent="#fbbf24" />
          <Section title="Passées" items={passees} empty="Aucune réservation passée" accent="rgba(255,255,255,0.4)" />
          <Section title="Annulées" items={annulees} empty="Aucune réservation annulée" accent="#f87171" />
        </div>
      </div>
    </div>
  )
}