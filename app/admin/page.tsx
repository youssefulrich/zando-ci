import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { formatPrice } from '@/lib/utils'
import AdminValidation from './AdminValidation'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single() as { data: { is_admin: boolean; full_name: string } | null })

  if (!profile?.is_admin) redirect('/dashboard')

  const { data: allBookings } = await supabase
    .from('bookings')
    .select('*, payments(status, payment_method, completed_at)')
    .order('created_at', { ascending: false })

  const { data: allProfiles } = await supabase
    .from('profiles').select('*').order('created_at', { ascending: false })

  const [
    { count: resCount },
    { count: vehCount },
    { count: evtCount },
    { data: pendingResidences },
    { data: pendingVehicles },
    { data: pendingEvents },
  ] = await Promise.all([
    supabase.from('residences').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('residences').select('*, profiles(full_name, phone)').eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('vehicles').select('*, profiles(full_name, phone)').eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('events').select('*, profiles(full_name, phone)').eq('status', 'pending').order('created_at', { ascending: false }),
  ])

  const confirmed = allBookings?.filter(b => b.status === 'confirmed') ?? []
  const totalBrut = confirmed.reduce((s, b) => s + b.total_price, 0)
  const totalCommission = confirmed.reduce((s, b) => s + (b.commission_amount || Math.round(b.total_price * 0.1)), 0)
  const totalOwner = confirmed.reduce((s, b) => s + (b.owner_amount || Math.round(b.total_price * 0.9)), 0)

  const byStatus = {
    pending: allBookings?.filter(b => b.status === 'pending').length ?? 0,
    confirmed: allBookings?.filter(b => b.status === 'confirmed').length ?? 0,
    cancelled: allBookings?.filter(b => b.status === 'cancelled').length ?? 0,
  }

  const byType = {
    residence: allBookings?.filter(b => b.item_type === 'residence').length ?? 0,
    vehicle: allBookings?.filter(b => b.item_type === 'vehicle').length ?? 0,
    event: allBookings?.filter(b => b.item_type === 'event').length ?? 0,
  }

  const usersByType = {
    client: allProfiles?.filter(p => p.account_type === 'client').length ?? 0,
    owner_residence: allProfiles?.filter(p => p.account_type === 'owner_residence').length ?? 0,
    owner_vehicle: allProfiles?.filter(p => p.account_type === 'owner_vehicle').length ?? 0,
    owner_event: allProfiles?.filter(p => p.account_type === 'owner_event').length ?? 0,
  }

  const totalPending = (pendingResidences?.length ?? 0) + (pendingVehicles?.length ?? 0) + (pendingEvents?.length ?? 0)

  const card = { background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16 }
  const typeColors: Record<string, string> = { residence: '#22d3a5', vehicle: '#60a5fa', event: '#a78bfa' }
  const statusColors: Record<string, string> = { confirmed: '#22d3a5', pending: '#fbbf24', cancelled: '#f87171', completed: 'rgba(255,255,255,0.4)' }
  const statusLabels: Record<string, string> = { confirmed: 'Confirmée', pending: 'En attente', cancelled: 'Annulée', completed: 'Terminée' }

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 11, color: '#f87171', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Administration</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>Dashboard Admin</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Vue complète — Zando CI</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {totalPending > 0 && (
              <div style={{ background: 'rgba(251,191,36,0.08)', border: '0.5px solid rgba(251,191,36,0.25)', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>{totalPending} annonce{totalPending > 1 ? 's' : ''} à valider</p>
                  <p style={{ fontSize: 10, color: '#92400e' }}>Voir section ci-dessous</p>
                </div>
              </div>
            )}
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '8px 16px' }}>
              <p style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>Accès administrateur</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION VALIDATION — NOUVEAU */}
        {/* ═══════════════════════════════════════════ */}
        <AdminValidation
          pendingResidences={pendingResidences ?? []}
          pendingVehicles={pendingVehicles ?? []}
          pendingEvents={pendingEvents ?? []}
        />

        {/* SOLDE ZANDO */}
        <div style={{ ...card, padding: 28, marginBottom: 20, border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.03)' }}>
          <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 20 }}>
            Solde Zando CI — Commissions perçues
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 20 }}>
            {[
              { label: 'Revenus bruts', value: formatPrice(totalBrut), color: '#fff', sub: 'total transactions' },
              { label: 'Votre solde (10%)', value: formatPrice(totalCommission), color: '#22d3a5', sub: 'commissions Zando' },
              { label: 'Versé propriétaires', value: formatPrice(totalOwner), color: 'rgba(255,255,255,0.45)', sub: '90% des transactions' },
              { label: 'Transactions confirmées', value: String(confirmed.length), color: '#fff', sub: 'payées avec succès' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '20px 0', borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none', paddingRight: i < 3 ? 24 : 0 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: -0.5, marginBottom: 4 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{s.sub}</p>
              </div>
            ))}
          </div>
          {totalBrut > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Répartition des revenus</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Zando 10% · Propriétaires 90%</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                <div style={{ height: '100%', background: '#22d3a5', width: '10%' }} />
                <div style={{ height: '100%', background: 'rgba(255,255,255,0.1)', flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#22d3a5' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Zando CI : {formatPrice(totalCommission)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Propriétaires : {formatPrice(totalOwner)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Utilisateurs', value: allProfiles?.length ?? 0, color: '#a78bfa' },
            { label: 'Réservations', value: allBookings?.length ?? 0, color: '#fff' },
            { label: 'Confirmées', value: byStatus.confirmed, color: '#22d3a5' },
            { label: 'En attente', value: byStatus.pending, color: '#fbbf24' },
            { label: 'Annulées', value: byStatus.cancelled, color: '#f87171' },
          ].map((s, i) => (
            <div key={i} style={{ ...card, padding: '18px' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: -1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Stats biens + types */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ ...card, padding: 22 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Biens publiés</h2>
            {[
              { label: 'Résidences', value: resCount ?? 0, color: '#22d3a5' },
              { label: 'Véhicules', value: vehCount ?? 0, color: '#60a5fa' },
              { label: 'Événements', value: evtCount ?? 0, color: '#a78bfa' },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{(resCount ?? 0) + (vehCount ?? 0) + (evtCount ?? 0)}</span>
            </div>
          </div>

          <div style={{ ...card, padding: 22 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Réservations par type</h2>
            {[
              { label: 'Résidences', value: byType.residence, color: '#22d3a5' },
              { label: 'Véhicules', value: byType.vehicle, color: '#60a5fa' },
              { label: 'Événements', value: byType.event, color: '#a78bfa' },
            ].map(item => {
              const pct = allBookings?.length ? Math.round((item.value / allBookings.length) * 100) : 0
              return (
                <div key={item.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value} <span style={{ fontSize: 10, opacity: 0.6 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <div style={{ height: '100%', background: item.color, borderRadius: 2, width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ ...card, padding: 22 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Utilisateurs par type</h2>
            {[
              { label: 'Clients', value: usersByType.client, color: '#22d3a5' },
              { label: 'Prop. résidence', value: usersByType.owner_residence, color: '#60a5fa' },
              { label: 'Loueurs véhicule', value: usersByType.owner_vehicle, color: '#a78bfa' },
              { label: 'Organisateurs', value: usersByType.owner_event, color: '#fbbf24' },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tableau transactions */}
        <div style={{ ...card, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Toutes les transactions</h2>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{allBookings?.length ?? 0}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Référence', 'Client', 'Type', 'Total payé', 'Zando (10%)', 'Propriétaire (90%)', 'Paiement', 'Statut', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, padding: '0 16px 14px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allBookings?.slice(0, 25).map((b, i) => {
                  const commission = b.commission_amount || Math.round(b.total_price * 0.1)
                  const ownerAmt = b.owner_amount || Math.round(b.total_price * 0.9)
                  const payMethod = (b.payments as { payment_method?: string } | null)?.payment_method?.replace(/_/g, ' ') ?? '—'
                  return (
                    <tr key={b.id} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px 12px 0', fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{b.reference}</td>
                      <td style={{ padding: '12px 16px 12px 0', fontSize: 13, color: '#fff', whiteSpace: 'nowrap' }}>{b.client_name}</td>
                      <td style={{ padding: '12px 16px 12px 0' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: typeColors[b.item_type] ?? '#fff', background: `${typeColors[b.item_type] ?? '#fff'}15`, border: `0.5px solid ${typeColors[b.item_type] ?? '#fff'}30`, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                          {b.item_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px 12px 0', fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{formatPrice(b.total_price)}</td>
                      <td style={{ padding: '12px 16px 12px 0', fontSize: 13, fontWeight: 700, color: '#22d3a5', whiteSpace: 'nowrap' }}>+{formatPrice(commission)}</td>
                      <td style={{ padding: '12px 16px 12px 0', fontSize: 13, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{formatPrice(ownerAmt)}</td>
                      <td style={{ padding: '12px 16px 12px 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{payMethod}</td>
                      <td style={{ padding: '12px 16px 12px 0' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, color: statusColors[b.status] ?? '#fff', background: `${statusColors[b.status] ?? '#fff'}15`, border: `0.5px solid ${statusColors[b.status] ?? '#fff'}30`, whiteSpace: 'nowrap' }}>
                          {statusLabels[b.status] ?? b.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 0 12px 0', fontSize: 11, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                        {new Date(b.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Derniers utilisateurs */}
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Derniers inscrits</h2>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{allProfiles?.length ?? 0}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {allProfiles?.slice(0, 12).map(p => {
              const utColors: Record<string, string> = { client: '#22d3a5', owner_residence: '#60a5fa', owner_vehicle: '#a78bfa', owner_event: '#fbbf24' }
              const utLabels: Record<string, string> = { client: 'Client', owner_residence: 'Propriétaire', owner_vehicle: 'Loueur', owner_event: 'Organisateur' }
              const col = utColors[p.account_type] ?? '#fff'
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${col}12`, border: `0.5px solid ${col}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: col, flexShrink: 0 }}>
                    {p.full_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.full_name}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{p.city} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: col, background: `${col}12`, border: `0.5px solid ${col}25`, flexShrink: 0 }}>
                    {utLabels[p.account_type] ?? p.account_type}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}