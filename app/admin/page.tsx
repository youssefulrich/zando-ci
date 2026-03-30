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

  // ✅ Inclure pending_contact dans les stats
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
  const statusColors: Record<string, string> = {
    confirmed: '#22d3a5',
    pending: '#fbbf24',
    pending_contact: '#fb923c',
    cancelled: '#f87171',
    completed: 'rgba(255,255,255,0.4)'
  }
  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmée',
    pending: 'Paiement en attente',
    pending_contact: 'Contact en attente',
    cancelled: 'Annulée',
    completed: 'Terminée'
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .adm-wrap { max-width: 1400px; margin: 0 auto; padding: 40px 48px; }
        .adm-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 40px; gap: 16px; }
        .adm-kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 20px; }
        .adm-stats3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
        .adm-solde-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 20px; }
        .adm-users-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .adm-table-wrap { overflow-x: auto; }

        @media (max-width: 767px) {
          .adm-wrap { padding: 20px 16px; }
          .adm-header { flex-direction: column; }
          .adm-header-badges { flex-direction: column; gap: 8px; }
          .adm-kpis { grid-template-columns: repeat(2, 1fr); }
          .adm-stats3 { grid-template-columns: 1fr; }
          .adm-solde-grid { grid-template-columns: repeat(2, 1fr); }
          .adm-users-grid { grid-template-columns: 1fr; }
          .adm-title { font-size: 24px !important; }
          .adm-hide-mobile { display: none !important; }
        }

        @media (min-width: 768px) and (max-width: 1199px) {
          .adm-wrap { padding: 32px 24px; }
          .adm-kpis { grid-template-columns: repeat(3, 1fr); }
          .adm-stats3 { grid-template-columns: 1fr 1fr; }
          .adm-solde-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .adm-card {
          background: #0f1929;
          border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 16px;
        }
        .adm-kpi-card {
          background: #0f1929;
          border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 20px;
          transition: border-color 0.2s;
        }
        .adm-kpi-card:hover { border-color: rgba(255,255,255,0.14); }
        .adm-tr:hover td { background: rgba(255,255,255,0.02); }
      `}</style>

      <div style={{ background: '#080e1a', minHeight: '100vh' }}>
        <Navbar />
        <div className="adm-wrap">

          {/* HEADER */}
          <div className="adm-header">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,0.1)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                ◈ Administration
              </div>
              <h1 className="adm-title" style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', letterSpacing: -1, marginBottom: 4, lineHeight: 1.1 }}>
                Dashboard Admin
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Vue complète · ZandoCI · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <div className="adm-header-badges" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {/* ✅ Badge demandes contact en attente */}
              {totalPendingContact > 0 && (
                <div style={{ background: 'rgba(251,146,60,0.08)', border: '0.5px solid rgba(251,146,60,0.22)', borderRadius: 12, padding: '10px 16px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fb923c', marginBottom: 1 }}>📞 {totalPendingContact} contact en attente</p>
                  <p style={{ fontSize: 11, color: 'rgba(251,146,60,0.5)' }}>Propriétaires à contacter</p>
                </div>
              )}
              {totalPending > 0 && (
                <div style={{ background: 'rgba(251,191,36,0.08)', border: '0.5px solid rgba(251,191,36,0.22)', borderRadius: 12, padding: '10px 16px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 1 }}>⚠️ {totalPending} à valider</p>
                  <p style={{ fontSize: 11, color: 'rgba(251,191,36,0.5)' }}>Annonces en attente</p>
                </div>
              )}
              <div style={{ background: 'rgba(248,113,113,0.07)', border: '0.5px solid rgba(248,113,113,0.18)', borderRadius: 12, padding: '10px 16px' }}>
                <p style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>🔐 Accès admin</p>
                <p style={{ fontSize: 11, color: 'rgba(248,113,113,0.5)' }}>{profile?.full_name}</p>
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
          <div style={{ background: 'linear-gradient(135deg, rgba(34,211,165,0.05) 0%, rgba(8,145,178,0.03) 100%)', border: '0.5px solid rgba(34,211,165,0.18)', borderRadius: 20, padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3a5', boxShadow: '0 0 8px rgba(34,211,165,0.6)' }} />
              <span style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Solde Zando CI — Commissions perçues</span>
            </div>
            <div className="adm-solde-grid">
              {[
                { label: 'Revenus bruts', value: formatPrice(totalBrut), color: '#f1f5f9', sub: 'total transactions', icon: '💰' },
                { label: 'Votre solde (10%)', value: formatPrice(totalCommission), color: '#22d3a5', sub: 'commissions Zando', icon: '🏦', highlight: true },
                { label: 'Versé propriétaires', value: formatPrice(totalOwner), color: 'rgba(255,255,255,0.5)', sub: '90% des transactions', icon: '📤' },
                { label: 'Transactions confirmées', value: String(confirmed.length), color: '#f1f5f9', sub: 'payées avec succès', icon: '✅' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '20px', background: s.highlight ? 'rgba(34,211,165,0.06)' : 'rgba(255,255,255,0.02)', border: s.highlight ? '0.5px solid rgba(34,211,165,0.18)' : '0.5px solid rgba(255,255,255,0.05)', borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</p>
                  </div>
                  <p style={{ fontSize: i < 3 ? 22 : 32, fontWeight: 800, color: s.color, letterSpacing: -0.5, marginBottom: 4 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{s.sub}</p>
                </div>
              ))}
            </div>
            {totalBrut > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Répartition des revenus</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Zando 10% · Propriétaires 90%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #22d3a5, #0891b2)', width: '10%', borderRadius: '3px 0 0 3px' }} />
                  <div style={{ height: '100%', background: 'rgba(255,255,255,0.08)', flex: 1 }} />
                </div>
              </div>
            )}
          </div>

          {/* KPIs — ✅ ajout pending_contact */}
          <div className="adm-kpis">
            {[
              { label: 'Utilisateurs', value: allProfiles?.length ?? 0, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
              { label: 'Réservations', value: allBookings?.length ?? 0, color: '#f1f5f9', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)' },
              { label: 'Confirmées', value: byStatus.confirmed, color: '#22d3a5', bg: 'rgba(34,211,165,0.06)', border: 'rgba(34,211,165,0.15)' },
              { label: 'Contact en attente', value: byStatus.pending_contact, color: '#fb923c', bg: 'rgba(251,146,60,0.06)', border: 'rgba(251,146,60,0.15)' },
              { label: 'Paiement en attente', value: byStatus.pending, color: '#fbbf24', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.15)' },
              { label: 'Annulées', value: byStatus.cancelled, color: '#f87171', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.15)' },
            ].map((s, i) => (
              <div key={i} className="adm-kpi-card" style={{ background: s.bg, border: `0.5px solid ${s.border}` }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{s.label}</p>
                <p style={{ fontSize: 30, fontWeight: 800, color: s.color, letterSpacing: -1 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* STATS 3 COL */}
          <div className="adm-stats3">
            {/* Biens */}
            <div className="adm-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3a5' }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Biens publiés</h2>
              </div>
              {[
                { label: 'Résidences', value: resCount ?? 0, color: '#22d3a5' },
                { label: 'Véhicules', value: vehCount ?? 0, color: '#60a5fa' },
                { label: 'Événements', value: evtCount ?? 0, color: '#a78bfa' },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, opacity: 0.7 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Total</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>{(resCount ?? 0) + (vehCount ?? 0) + (evtCount ?? 0)}</span>
              </div>
            </div>

            {/* Réservations par type */}
            <div className="adm-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
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
                  <div key={item.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value} <span style={{ fontSize: 10, opacity: 0.5 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`, borderRadius: 2, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Utilisateurs */}
            <div className="adm-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Utilisateurs par type</h2>
              </div>
              {[
                { label: 'Clients', value: usersByType.client, color: '#22d3a5' },
                { label: 'Prop. résidence', value: usersByType.owner_residence, color: '#60a5fa' },
                { label: 'Loueurs véhicule', value: usersByType.owner_vehicle, color: '#a78bfa' },
                { label: 'Organisateurs', value: usersByType.owner_event, color: '#fbbf24' },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, opacity: 0.7 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TABLEAU TRANSACTIONS */}
          <div className="adm-card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24' }} />
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Toutes les transactions</h2>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.06)' }}>{allBookings?.length ?? 0} entrées</span>
            </div>
            <div className="adm-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr>
                    {['Référence', 'Client', 'Type', 'Total', 'Zando 10%', 'Propriétaire', 'Paiement', 'Statut', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, padding: '0 16px 14px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allBookings?.slice(0, 25).map((b: any) => {
                    const commission = b.commission_amount || Math.round(b.total_price * 0.1)
                    const ownerAmt = b.owner_amount || Math.round(b.total_price * 0.9)
                    const payMethod = b.status === 'pending_contact'
                      ? 'Contact direct'
                      : (b.payments?.payment_method?.replace(/_/g, ' ') ?? '—')
                    const sc = statusColors[b.status] ?? '#fff'
                    const tc = typeColors[b.item_type] ?? '#fff'
                    return (
                      <tr key={b.id} className="adm-tr" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 16px 12px 0', fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{b.reference}</td>
                        <td style={{ padding: '12px 16px 12px 0' }}>
                          <p style={{ fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap' }}>{b.client_name}</p>
                          {b.client_phone && (
                            <p style={{ fontSize: 11, color: '#60a5fa' }}>{b.client_phone}</p>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px 12px 0' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: tc, background: `${tc}15`, border: `0.5px solid ${tc}30`, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{b.item_type}</span>
                        </td>
                        <td style={{ padding: '12px 16px 12px 0', fontSize: 13, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap' }}>{formatPrice(b.total_price)}</td>
                        <td style={{ padding: '12px 16px 12px 0', fontSize: 13, fontWeight: 700, color: '#22d3a5', whiteSpace: 'nowrap' }}>
                          {b.status === 'pending_contact' ? '—' : `+${formatPrice(commission)}`}
                        </td>
                        <td style={{ padding: '12px 16px 12px 0', fontSize: 13, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                          {b.status === 'pending_contact' ? '—' : formatPrice(ownerAmt)}
                        </td>
                        <td style={{ padding: '12px 16px 12px 0', fontSize: 12, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{payMethod}</td>
                        <td style={{ padding: '12px 16px 12px 0' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, color: sc, background: `${sc}15`, border: `0.5px solid ${sc}30`, whiteSpace: 'nowrap' }}>{statusLabels[b.status] ?? b.status}</span>
                        </td>
                        <td style={{ padding: '12px 0', fontSize: 11, color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
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
          <div className="adm-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} />
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Derniers inscrits</h2>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.06)' }}>{allProfiles?.length ?? 0} membres</span>
            </div>
            <div className="adm-users-grid">
              {allProfiles?.slice(0, 12).map((p: any) => {
                const utColors: Record<string, string> = { client: '#22d3a5', owner_residence: '#60a5fa', owner_vehicle: '#a78bfa', owner_event: '#fbbf24' }
                const utLabels: Record<string, string> = { client: 'Client', owner_residence: 'Propriétaire', owner_vehicle: 'Loueur', owner_event: 'Organisateur' }
                const col = utColors[p.account_type] ?? '#fff'
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${col}12`, border: `0.5px solid ${col}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: col, flexShrink: 0 }}>
                      {p.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.full_name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{p.city} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: col, background: `${col}12`, border: `0.5px solid ${col}22`, flexShrink: 0, whiteSpace: 'nowrap' }}>
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