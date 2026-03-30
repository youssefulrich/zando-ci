import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { formatPrice } from '@/lib/utils'
import AdminValidation from './AdminValidation'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileResult = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileResult.data as { is_admin: boolean; full_name: string } | null
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: allBookingsRaw } = await supabase
    .from('bookings')
    .select('*, payments(status, payment_method, completed_at)')
    .order('created_at', { ascending: false })
  const allBookings = allBookingsRaw as any[] | null

  const { data: allProfilesRaw } = await supabase
    .from('profiles').select('*').order('created_at', { ascending: false })
  const allProfiles = allProfilesRaw as any[] | null

  const [
    { count: resCount }, { count: vehCount }, { count: evtCount },
    { data: pendingResidencesRaw }, { data: pendingVehiclesRaw }, { data: pendingEventsRaw },
  ] = await Promise.all([
    supabase.from('residences').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('residences').select('*, profiles(full_name, phone)').eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('vehicles').select('*, profiles(full_name, phone)').eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('events').select('*, profiles(full_name, phone)').eq('status', 'pending').order('created_at', { ascending: false }),
  ])

  const confirmed = allBookings?.filter((b: any) => b.status === 'confirmed') ?? []
  const totalBrut = confirmed.reduce((s: number, b: any) => s + b.total_price, 0)
  const totalCommission = confirmed.reduce((s: number, b: any) => s + (b.commission_amount || Math.round(b.total_price * 0.1)), 0)
  const totalOwner = confirmed.reduce((s: number, b: any) => s + (b.owner_amount || Math.round(b.total_price * 0.9)), 0)

  const byStatus = {
    pending_contact: allBookings?.filter((b: any) => b.status === 'pending_contact').length ?? 0,
    pending: allBookings?.filter((b: any) => b.status === 'pending').length ?? 0,
    confirmed: allBookings?.filter((b: any) => b.status === 'confirmed').length ?? 0,
    cancelled: allBookings?.filter((b: any) => b.status === 'cancelled').length ?? 0,
  }
  const byType = {
    residence: allBookings?.filter((b: any) => b.item_type === 'residence').length ?? 0,
    vehicle: allBookings?.filter((b: any) => b.item_type === 'vehicle').length ?? 0,
    event: allBookings?.filter((b: any) => b.item_type === 'event').length ?? 0,
  }
  const usersByType = {
    client: allProfiles?.filter((p: any) => p.account_type === 'client').length ?? 0,
    owner_residence: allProfiles?.filter((p: any) => p.account_type === 'owner_residence').length ?? 0,
    owner_vehicle: allProfiles?.filter((p: any) => p.account_type === 'owner_vehicle').length ?? 0,
    owner_event: allProfiles?.filter((p: any) => p.account_type === 'owner_event').length ?? 0,
  }

  const totalPending = (pendingResidencesRaw?.length ?? 0) + (pendingVehiclesRaw?.length ?? 0) + (pendingEventsRaw?.length ?? 0)
  const totalPendingContact = byStatus.pending_contact

  const typeColors: Record<string, string> = { residence: '#22d3a5', vehicle: '#60a5fa', event: '#a78bfa' }
  const statusColors: Record<string, string> = { confirmed: '#22d3a5', pending: '#fbbf24', pending_contact: '#fb923c', cancelled: '#f87171', completed: 'rgba(255,255,255,0.4)' }
  const statusLabels: Record<string, string> = { confirmed: 'Confirmée', pending: 'Paiement en attente', pending_contact: 'Contact en attente', cancelled: 'Annulée', completed: 'Terminée' }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .adm { background: #080e1a; min-height: 100vh; }
        .adm-wrap { max-width: 1400px; margin: 0 auto; padding: 24px 16px 60px; }
        .adm-card { background: #0f1929; border: 0.5px solid rgba(255,255,255,0.07); border-radius: 16px; }
        .adm-kpi { background: #0f1929; border: 0.5px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px; }
        .adm-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .adm-tr:hover td { background: rgba(255,255,255,0.02); }

        /* Grilles responsive */
        .adm-kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
        .adm-solde { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
        .adm-stats3 { display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 16px; }
        .adm-users { display: grid; grid-template-columns: 1fr; gap: 8px; }

        /* Tablette */
        @media (min-width: 640px) {
          .adm-wrap { padding: 32px 24px 60px; }
          .adm-kpis { grid-template-columns: repeat(3, 1fr); }
          .adm-users { grid-template-columns: repeat(2, 1fr); }
        }

        /* Desktop */
        @media (min-width: 1024px) {
          .adm-wrap { padding: 40px 48px 60px; }
          .adm-kpis { grid-template-columns: repeat(6, 1fr); }
          .adm-solde { grid-template-columns: repeat(4, 1fr); }
          .adm-stats3 { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div className="adm">
        <Navbar />
        <div className="adm-wrap">

          {/* HEADER */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,0.1)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
              ◈ Administration
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: -1, marginBottom: 4 }}>Dashboard Admin</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {totalPendingContact > 0 && (
                <div style={{ background: 'rgba(251,146,60,0.08)', border: '0.5px solid rgba(251,146,60,0.22)', borderRadius: 10, padding: '8px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>📞 {totalPendingContact} contact en attente</p>
                </div>
              )}
              {totalPending > 0 && (
                <div style={{ background: 'rgba(251,191,36,0.08)', border: '0.5px solid rgba(251,191,36,0.22)', borderRadius: 10, padding: '8px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>⚠️ {totalPending} annonces à valider</p>
                </div>
              )}
              <div style={{ background: 'rgba(248,113,113,0.07)', border: '0.5px solid rgba(248,113,113,0.18)', borderRadius: 10, padding: '8px 14px' }}>
                <p style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>🔐 {profile?.full_name}</p>
              </div>
            </div>
          </div>

          {/* VALIDATION */}
          <AdminValidation
            pendingResidences={pendingResidencesRaw ?? []}
            pendingVehicles={pendingVehiclesRaw ?? []}
            pendingEvents={pendingEventsRaw ?? []}
          />

          {/* SOLDE ZANDO */}
          <div style={{ background: 'linear-gradient(135deg, rgba(34,211,165,0.05), rgba(8,145,178,0.03))', border: '0.5px solid rgba(34,211,165,0.18)', borderRadius: 18, padding: '20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d3a5' }} />
              <span style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Solde Zando CI</span>
            </div>
            <div className="adm-solde">
              {[
                { label: 'Revenus bruts', value: formatPrice(totalBrut), color: '#f1f5f9', icon: '💰' },
                { label: 'Votre solde (10%)', value: formatPrice(totalCommission), color: '#22d3a5', icon: '🏦', hl: true },
                { label: 'Versé propriétaires', value: formatPrice(totalOwner), color: 'rgba(255,255,255,0.5)', icon: '📤' },
                { label: 'Confirmées', value: String(confirmed.length), color: '#f1f5f9', icon: '✅' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '16px', background: s.hl ? 'rgba(34,211,165,0.06)' : 'rgba(255,255,255,0.02)', border: s.hl ? '0.5px solid rgba(34,211,165,0.18)' : '0.5px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{s.icon} {s.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div className="adm-kpis">
            {[
              { label: 'Utilisateurs', value: allProfiles?.length ?? 0, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
              { label: 'Réservations', value: allBookings?.length ?? 0, color: '#f1f5f9', bg: 'rgba(255,255,255,0.03)' },
              { label: 'Confirmées', value: byStatus.confirmed, color: '#22d3a5', bg: 'rgba(34,211,165,0.06)' },
              { label: 'Contact attente', value: byStatus.pending_contact, color: '#fb923c', bg: 'rgba(251,146,60,0.06)' },
              { label: 'Paiement attente', value: byStatus.pending, color: '#fbbf24', bg: 'rgba(251,191,36,0.06)' },
              { label: 'Annulées', value: byStatus.cancelled, color: '#f87171', bg: 'rgba(248,113,113,0.06)' },
            ].map((s, i) => (
              <div key={i} className="adm-kpi" style={{ background: s.bg }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: -1 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* STATS 3 COL */}
          <div className="adm-stats3">
            {/* Biens */}
            <div className="adm-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3a5' }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Biens publiés</h2>
              </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 4, borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>{(resCount ?? 0) + (vehCount ?? 0) + (evtCount ?? 0)}</span>
              </div>
            </div>

            {/* Par type */}
            <div className="adm-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa' }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Réservations par type</h2>
              </div>
              {[
                { label: 'Résidences', value: byType.residence, color: '#22d3a5' },
                { label: 'Véhicules', value: byType.vehicle, color: '#60a5fa' },
                { label: 'Événements', value: byType.event, color: '#a78bfa' },
              ].map(item => {
                const pct = allBookings?.length ? Math.round((item.value / allBookings.length) * 100) : 0
                return (
                  <div key={item.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value} <span style={{ fontSize: 10, opacity: 0.5 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: item.color, borderRadius: 2, width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Utilisateurs */}
            <div className="adm-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Utilisateurs</h2>
              </div>
              {[
                { label: 'Clients', value: usersByType.client, color: '#22d3a5' },
                { label: 'Prop. résidence', value: usersByType.owner_residence, color: '#60a5fa' },
                { label: 'Loueurs véhicule', value: usersByType.owner_vehicle, color: '#a78bfa' },
                { label: 'Organisateurs', value: usersByType.owner_event, color: '#fbbf24' },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TABLEAU TRANSACTIONS */}
          <div className="adm-card" style={{ padding: '20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Transactions</h2>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 20 }}>{allBookings?.length ?? 0} entrées</span>
            </div>
            <div className="adm-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    {['Réf.', 'Client', 'Type', 'Total', 'Commission', 'Statut', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, padding: '0 12px 12px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allBookings?.slice(0, 25).map((b: any) => {
                    const commission = b.commission_amount || Math.round(b.total_price * 0.1)
                    const sc = statusColors[b.status] ?? '#fff'
                    const tc = typeColors[b.item_type] ?? '#fff'
                    return (
                      <tr key={b.id} className="adm-tr" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '11px 12px 11px 0', fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{b.reference?.slice(0, 14)}</td>
                        <td style={{ padding: '11px 12px 11px 0' }}>
                          <p style={{ fontSize: 12, color: '#e2e8f0', whiteSpace: 'nowrap' }}>{b.client_name}</p>
                          {b.client_phone && <p style={{ fontSize: 10, color: '#60a5fa' }}>{b.client_phone}</p>}
                        </td>
                        <td style={{ padding: '11px 12px 11px 0' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, color: tc, background: `${tc}15`, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{b.item_type}</span>
                        </td>
                        <td style={{ padding: '11px 12px 11px 0', fontSize: 12, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap' }}>{formatPrice(b.total_price)}</td>
                        <td style={{ padding: '11px 12px 11px 0', fontSize: 12, fontWeight: 700, color: '#22d3a5', whiteSpace: 'nowrap' }}>
                          {b.status === 'pending_contact' ? '—' : `+${formatPrice(commission)}`}
                        </td>
                        <td style={{ padding: '11px 12px 11px 0' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, color: sc, background: `${sc}15`, whiteSpace: 'nowrap' }}>{statusLabels[b.status] ?? b.status}</span>
                        </td>
                        <td style={{ padding: '11px 0', fontSize: 11, color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                          {new Date(b.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DERNIERS INSCRITS */}
          <div className="adm-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Derniers inscrits</h2>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 20 }}>{allProfiles?.length ?? 0} membres</span>
            </div>
            <div className="adm-users">
              {allProfiles?.slice(0, 12).map((p: any) => {
                const utColors: Record<string, string> = { client: '#22d3a5', owner_residence: '#60a5fa', owner_vehicle: '#a78bfa', owner_event: '#fbbf24' }
                const utLabels: Record<string, string> = { client: 'Client', owner_residence: 'Propriétaire', owner_vehicle: 'Loueur', owner_event: 'Organisateur' }
                const col = utColors[p.account_type] ?? '#fff'
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${col}12`, border: `0.5px solid ${col}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: col, flexShrink: 0 }}>
                      {p.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.full_name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{p.city} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: col, background: `${col}12`, flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {utLabels[p.account_type] ?? p.account_type}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}