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

  // ── Fetch all data ────────────────────────────────────────────────────────
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
    { count: shopCount }, { count: productCount },
    { data: pendingResidencesRaw }, { data: pendingVehiclesRaw }, { data: pendingEventsRaw },
    { data: allShopsRaw }, { data: allOrdersRaw }, { data: recentShopsRaw },
  ] = await Promise.all([
    supabase.from('residences').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('residences').select('*, profiles(full_name, phone)').eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('vehicles').select('*, profiles(full_name, phone)').eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('events').select('*, profiles(full_name, phone)').eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('shops').select('*, profiles(full_name)').eq('status', 'active').order('created_at', { ascending: false }).limit(50),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('shops').select('*, profiles(full_name)').eq('status', 'active').order('created_at', { ascending: false }).limit(12),
  ])

  const allShops   = allShopsRaw   as any[] | null
  const allOrders  = allOrdersRaw  as any[] | null
  const recentShops = recentShopsRaw as any[] | null

  // ── Bookings stats ────────────────────────────────────────────────────────
  const confirmed = allBookings?.filter((b: any) => b.status === 'confirmed') ?? []
  const totalBrut = confirmed.reduce((s: number, b: any) => s + b.total_price, 0)
  const totalCommission = confirmed.reduce((s: number, b: any) => s + (b.commission_amount || Math.round(b.total_price * 0.1)), 0)
  const totalOwner = confirmed.reduce((s: number, b: any) => s + (b.owner_amount || Math.round(b.total_price * 0.9)), 0)

  const byStatus = {
    pending_contact: allBookings?.filter((b: any) => b.status === 'pending_contact').length ?? 0,
    pending:   allBookings?.filter((b: any) => b.status === 'pending').length   ?? 0,
    confirmed: allBookings?.filter((b: any) => b.status === 'confirmed').length ?? 0,
    cancelled: allBookings?.filter((b: any) => b.status === 'cancelled').length ?? 0,
  }
  const byType = {
    residence: allBookings?.filter((b: any) => b.item_type === 'residence').length ?? 0,
    vehicle:   allBookings?.filter((b: any) => b.item_type === 'vehicle').length   ?? 0,
    event:     allBookings?.filter((b: any) => b.item_type === 'event').length     ?? 0,
  }
  const usersByType = {
    client:           allProfiles?.filter((p: any) => p.account_type === 'client').length           ?? 0,
    owner_residence:  allProfiles?.filter((p: any) => p.account_type === 'owner_residence').length  ?? 0,
    owner_vehicle:    allProfiles?.filter((p: any) => p.account_type === 'owner_vehicle').length    ?? 0,
    owner_event:      allProfiles?.filter((p: any) => p.account_type === 'owner_event').length      ?? 0,
  }

  // ── Boutique / orders stats ───────────────────────────────────────────────
  const ordersConfirmed   = allOrders?.filter((o: any) => o.status === 'confirmed'  || o.status === 'delivered') ?? []
  const ordersPending     = allOrders?.filter((o: any) => o.status === 'pending')   ?? []
  const ordersCancelled   = allOrders?.filter((o: any) => o.status === 'cancelled') ?? []
  const ordersTotalBrut   = ordersConfirmed.reduce((s: number, o: any) => s + (o.total_price ?? 0), 0)
  const ordersCommission  = ordersConfirmed.reduce((s: number, o: any) => s + (o.commission_amount ?? Math.round((o.total_price ?? 0) * 0.1)), 0)

  // Top shops by sales
  const shopSalesMap: Record<string, number> = {}
  allOrders?.forEach((o: any) => {
    if (o.shop_id) shopSalesMap[o.shop_id] = (shopSalesMap[o.shop_id] ?? 0) + (o.total_price ?? 0)
  })
  const topShops = allShops
    ? [...allShops]
        .map(s => ({ ...s, sales: shopSalesMap[s.id] ?? 0 }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
    : []

  const totalPending = (pendingResidencesRaw?.length ?? 0) + (pendingVehiclesRaw?.length ?? 0) + (pendingEventsRaw?.length ?? 0)
  const totalPendingContact = byStatus.pending_contact

  const typeColors: Record<string, string> = { residence: '#22d3a5', vehicle: '#60a5fa', event: '#a78bfa' }
  const statusColors: Record<string, string> = { confirmed: '#22d3a5', pending: '#fbbf24', pending_contact: '#fb923c', cancelled: '#f87171', completed: 'rgba(255,255,255,0.4)', delivered: '#22d3a5' }
  const statusLabels: Record<string, string> = { confirmed: 'Confirmée', pending: 'En attente', pending_contact: 'Contact att.', cancelled: 'Annulée', completed: 'Terminée', delivered: 'Livrée' }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        :root {
          --bg:     #080E1A;
          --bg2:    #0F1929;
          --border: rgba(255,255,255,0.07);
          --text:   #F1F5F9;
          --muted:  rgba(255,255,255,0.35);
          --orange: #FF6B00;
          --teal:   #22D3A5;
          --blue:   #60A5FA;
          --purple: #A78BFA;
          --yellow: #FBBF24;
          --red:    #F87171;
        }
        .adm { background: var(--bg); min-height: 100vh; }
        .adm-wrap { max-width: 1400px; margin: 0 auto; padding: 24px 16px 80px; }
        .adm-card { background: var(--bg2); border: 0.5px solid var(--border); border-radius: 16px; }
        .adm-card-title { font-size: 13px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; }
        .adm-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .adm-kpi { background: var(--bg2); border: 0.5px solid var(--border); border-radius: 12px; padding: 16px; }
        .adm-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .adm-tr:hover td { background: rgba(255,255,255,0.02); }
        .adm-section-label {
          font-size: 10px; font-weight: 700; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.14em;
          display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
        }
        .adm-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        /* Grilles */
        .adm-kpis  { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 16px; }
        .adm-kpis6 { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 16px; }
        .adm-solde { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; margin-bottom: 16px; }
        .adm-stats3 { display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 16px; }
        .adm-boutique-grid { display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 16px; }
        .adm-users { display: grid; grid-template-columns: 1fr; gap: 8px; }

        @media (min-width: 640px) {
          .adm-wrap  { padding: 32px 24px 60px; }
          .adm-kpis  { grid-template-columns: repeat(3,1fr); }
          .adm-kpis6 { grid-template-columns: repeat(3,1fr); }
          .adm-users { grid-template-columns: repeat(2,1fr); }
        }
        @media (min-width: 1024px) {
          .adm-wrap           { padding: 40px 48px 60px; }
          .adm-kpis           { grid-template-columns: repeat(6,1fr); }
          .adm-kpis6          { grid-template-columns: repeat(6,1fr); }
          .adm-solde          { grid-template-columns: repeat(4,1fr); }
          .adm-stats3         { grid-template-columns: repeat(3,1fr); }
          .adm-boutique-grid  { grid-template-columns: repeat(3,1fr); }
        }
      `}</style>

      <div className="adm">
        <Navbar />
        <div className="adm-wrap">

          {/* ── HEADER ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,0.1)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
              ◈ Administration
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: -1, marginBottom: 4 }}>Dashboard Admin</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {totalPendingContact > 0 && (
                <div style={{ background: 'rgba(251,146,60,0.08)', border: '0.5px solid rgba(251,146,60,0.22)', borderRadius: 10, padding: '8px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>📞 {totalPendingContact} contact en attente</p>
                </div>
              )}
              {totalPending > 0 && (
                <div style={{ background: 'rgba(251,191,36,0.08)', border: '0.5px solid rgba(251,191,36,0.22)', borderRadius: 10, padding: '8px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--yellow)' }}>⚠️ {totalPending} annonces à valider</p>
                </div>
              )}
              {ordersPending.length > 0 && (
                <div style={{ background: 'rgba(255,107,0,0.08)', border: '0.5px solid rgba(255,107,0,0.22)', borderRadius: 10, padding: '8px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)' }}>🛍️ {ordersPending.length} commandes en attente</p>
                </div>
              )}
              <div style={{ background: 'rgba(248,113,113,0.07)', border: '0.5px solid rgba(248,113,113,0.18)', borderRadius: 10, padding: '8px 14px' }}>
                <p style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>🔐 {profile?.full_name}</p>
              </div>
            </div>
          </div>

          {/* ── VALIDATION ── */}
          <AdminValidation
            pendingResidences={pendingResidencesRaw ?? []}
            pendingVehicles={pendingVehiclesRaw ?? []}
            pendingEvents={pendingEventsRaw ?? []}
          />

          {/* ══════════════════════════════════════════════════════════════════
              SECTION LOCATION / EVENTS
          ══════════════════════════════════════════════════════════════════ */}
          <div className="adm-section-label">📍 Location & Événements</div>

          {/* Solde location */}
          <div style={{ background: 'linear-gradient(135deg, rgba(34,211,165,0.05), rgba(8,145,178,0.03))', border: '0.5px solid rgba(34,211,165,0.18)', borderRadius: 18, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)' }} />
              <span style={{ fontSize: 11, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Solde Location / Événements</span>
            </div>
            <div className="adm-solde">
              {[
                { label: 'Revenus bruts', value: formatPrice(totalBrut), color: 'var(--text)', icon: '💰' },
                { label: 'Votre solde (10%)', value: formatPrice(totalCommission), color: 'var(--teal)', icon: '🏦', hl: true },
                { label: 'Versé propriétaires', value: formatPrice(totalOwner), color: 'var(--muted)', icon: '📤' },
                { label: 'Confirmées', value: String(confirmed.length), color: 'var(--text)', icon: '✅' },
              ].map((s, i) => (
                <div key={i} style={{ padding: 16, background: s.hl ? 'rgba(34,211,165,0.06)' : 'rgba(255,255,255,0.02)', border: s.hl ? '0.5px solid rgba(34,211,165,0.18)' : '0.5px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                  <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{s.icon} {s.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs location */}
          <div className="adm-kpis">
            {[
              { label: 'Utilisateurs', value: allProfiles?.length ?? 0, color: 'var(--purple)', bg: 'rgba(167,139,250,0.08)' },
              { label: 'Réservations', value: allBookings?.length ?? 0, color: 'var(--text)', bg: 'rgba(255,255,255,0.03)' },
              { label: 'Confirmées', value: byStatus.confirmed, color: 'var(--teal)', bg: 'rgba(34,211,165,0.06)' },
              { label: 'Contact attente', value: byStatus.pending_contact, color: '#fb923c', bg: 'rgba(251,146,60,0.06)' },
              { label: 'Paiement attente', value: byStatus.pending, color: 'var(--yellow)', bg: 'rgba(251,191,36,0.06)' },
              { label: 'Annulées', value: byStatus.cancelled, color: 'var(--red)', bg: 'rgba(248,113,113,0.06)' },
            ].map((s, i) => (
              <div key={i} className="adm-kpi" style={{ background: s.bg }}>
                <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: -1 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Stats 3 col location */}
          <div className="adm-stats3" style={{ marginBottom: 32 }}>
            {/* Biens publiés */}
            <div className="adm-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div className="adm-dot" style={{ background: 'var(--teal)' }} />
                <h2 className="adm-card-title">Biens publiés</h2>
              </div>
              {[
                { label: 'Résidences', value: resCount ?? 0, color: 'var(--teal)' },
                { label: 'Véhicules',  value: vehCount ?? 0, color: 'var(--blue)' },
                { label: 'Événements', value: evtCount ?? 0, color: 'var(--purple)' },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{item.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 4, borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{(resCount ?? 0) + (vehCount ?? 0) + (evtCount ?? 0)}</span>
              </div>
            </div>

            {/* Par type */}
            <div className="adm-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div className="adm-dot" style={{ background: 'var(--blue)' }} />
                <h2 className="adm-card-title">Réservations par type</h2>
              </div>
              {[
                { label: 'Résidences', value: byType.residence, color: 'var(--teal)' },
                { label: 'Véhicules',  value: byType.vehicle,   color: 'var(--blue)' },
                { label: 'Événements', value: byType.event,      color: 'var(--purple)' },
              ].map(item => {
                const pct = allBookings?.length ? Math.round((item.value / allBookings.length) * 100) : 0
                return (
                  <div key={item.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{item.label}</span>
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
                <div className="adm-dot" style={{ background: 'var(--purple)' }} />
                <h2 className="adm-card-title">Utilisateurs par type</h2>
              </div>
              {[
                { label: 'Clients',          value: usersByType.client,          color: 'var(--teal)' },
                { label: 'Prop. résidence',  value: usersByType.owner_residence, color: 'var(--blue)' },
                { label: 'Loueurs véhicule', value: usersByType.owner_vehicle,   color: 'var(--purple)' },
                { label: 'Organisateurs',    value: usersByType.owner_event,     color: 'var(--yellow)' },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{item.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION BOUTIQUE / MARKETPLACE
          ══════════════════════════════════════════════════════════════════ */}
          <div className="adm-section-label">🛍️ Marketplace — Boutiques</div>

          {/* Solde boutique */}
          <div style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.05), rgba(255,146,64,0.03))', border: '0.5px solid rgba(255,107,0,0.2)', borderRadius: 18, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)' }} />
              <span style={{ fontSize: 11, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Solde Marketplace</span>
            </div>
            <div className="adm-solde">
              {[
                { label: 'CA total commandes', value: formatPrice(ordersTotalBrut), color: 'var(--text)', icon: '💰' },
                { label: 'Commission (10%)', value: formatPrice(ordersCommission), color: 'var(--orange)', icon: '🏦', hl: true },
                { label: 'Commandes livrées', value: String(ordersConfirmed.length), color: 'var(--text)', icon: '✅' },
                { label: 'En attente', value: String(ordersPending.length), color: 'var(--yellow)', icon: '⏳' },
              ].map((s, i) => (
                <div key={i} style={{ padding: 16, background: s.hl ? 'rgba(255,107,0,0.06)' : 'rgba(255,255,255,0.02)', border: s.hl ? '0.5px solid rgba(255,107,0,0.2)' : '0.5px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                  <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{s.icon} {s.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs boutique */}
          <div className="adm-kpis6">
            {[
              { label: 'Boutiques actives', value: shopCount ?? 0,    color: 'var(--orange)', bg: 'rgba(255,107,0,0.08)' },
              { label: 'Produits actifs',   value: productCount ?? 0, color: 'var(--text)',   bg: 'rgba(255,255,255,0.03)' },
              { label: 'Commandes total',   value: allOrders?.length ?? 0, color: 'var(--text)', bg: 'rgba(255,255,255,0.03)' },
              { label: 'Livrées / Conf.',   value: ordersConfirmed.length,  color: 'var(--teal)',   bg: 'rgba(34,211,165,0.06)' },
              { label: 'En attente',        value: ordersPending.length,    color: 'var(--yellow)', bg: 'rgba(251,191,36,0.06)' },
              { label: 'Annulées',          value: ordersCancelled.length,  color: 'var(--red)',    bg: 'rgba(248,113,113,0.06)' },
            ].map((s, i) => (
              <div key={i} className="adm-kpi" style={{ background: s.bg }}>
                <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: -1 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Boutique stats 3 col */}
          <div className="adm-boutique-grid" style={{ marginBottom: 16 }}>

            {/* Top boutiques */}
            <div className="adm-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div className="adm-dot" style={{ background: 'var(--orange)' }} />
                <h2 className="adm-card-title">Top boutiques (CA)</h2>
              </div>
              {topShops.length > 0 ? topShops.map((s: any, i: number) => {
                const pct = topShops[0]?.sales > 0 ? Math.round((s.sales / topShops[0].sales) * 100) : 0
                return (
                  <div key={s.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: i === 0 ? 'var(--yellow)' : 'var(--muted)', width: 16, flexShrink: 0 }}>#{i + 1}</span>
                        <span style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--orange)', flexShrink: 0, marginLeft: 8 }}>{formatPrice(s.sales)}</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: i === 0 ? 'var(--orange)' : 'rgba(255,107,0,0.4)', borderRadius: 2, width: `${pct}%` }} />
                    </div>
                  </div>
                )
              }) : (
                <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>Aucune commande encore</p>
              )}
            </div>

            {/* Statut commandes */}
            <div className="adm-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div className="adm-dot" style={{ background: 'var(--yellow)' }} />
                <h2 className="adm-card-title">Commandes par statut</h2>
              </div>
              {[
                { label: 'Livrées / Confirmées', value: ordersConfirmed.length, color: 'var(--teal)' },
                { label: 'En attente',            value: ordersPending.length,   color: 'var(--yellow)' },
                { label: 'Annulées',              value: ordersCancelled.length, color: 'var(--red)' },
              ].map(item => {
                const total = allOrders?.length || 1
                const pct   = Math.round((item.value / total) * 100)
                return (
                  <div key={item.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value} <span style={{ fontSize: 10, opacity: 0.5 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: item.color, borderRadius: 2, width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Total commandes</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{allOrders?.length ?? 0}</span>
              </div>
            </div>

            {/* Dernières boutiques */}
            <div className="adm-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div className="adm-dot" style={{ background: 'var(--teal)' }} />
                <h2 className="adm-card-title">Boutiques récentes</h2>
              </div>
              {recentShops?.slice(0, 6).map((s: any) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,107,0,0.12)', border: '0.5px solid rgba(255,107,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {s.logo_url
                      ? <img src={s.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--orange)' }}>{s.name?.slice(0, 2).toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)' }}>{s.city} · {(s.profiles as any)?.full_name}</p>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--orange)', flexShrink: 0 }}>{new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── TABLEAU COMMANDES BOUTIQUE ── */}
          <div className="adm-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="adm-dot" style={{ background: 'var(--orange)' }} />
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Dernières commandes boutique</h2>
              </div>
              <span style={{ fontSize: 11, color: 'var(--muted)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 20 }}>{allOrders?.length ?? 0} entrées</span>
            </div>
            <div className="adm-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                <thead>
                  <tr>
                    {['Réf.', 'Acheteur', 'Boutique', 'Produit', 'Total', 'Statut', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, padding: '0 12px 12px 0', borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allOrders?.slice(0, 20).map((o: any) => {
                    const sc = statusColors[o.status] ?? 'var(--muted)'
                    return (
                      <tr key={o.id} className="adm-tr" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 12px 10px 0', fontSize: 11, fontFamily: 'monospace', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{o.reference?.slice(0, 12) ?? '—'}</td>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <p style={{ fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap' }}>{o.buyer_name || '—'}</p>
                          {o.buyer_phone && <p style={{ fontSize: 10, color: 'var(--blue)' }}>{o.buyer_phone}</p>}
                        </td>
                        <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.shop_name || '—'}</td>
                        <td style={{ padding: '10px 12px 10px 0', fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.product_name || '—'}</td>
                        <td style={{ padding: '10px 12px 10px 0', fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{formatPrice(o.total_price ?? 0)}</td>
                        <td style={{ padding: '10px 12px 10px 0' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, color: sc, background: `${sc}18`, whiteSpace: 'nowrap' }}>
                            {statusLabels[o.status] ?? o.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 0', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {new Date(o.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              TABLEAU TRANSACTIONS LOCATION
          ══════════════════════════════════════════════════════════════════ */}
          <div className="adm-section-label">📋 Transactions Location</div>
          <div className="adm-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="adm-dot" style={{ background: 'var(--teal)' }} />
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Transactions Location & Événements</h2>
              </div>
              <span style={{ fontSize: 11, color: 'var(--muted)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 20 }}>{allBookings?.length ?? 0} entrées</span>
            </div>
            <div className="adm-table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    {['Réf.', 'Client', 'Type', 'Total', 'Commission', 'Statut', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, padding: '0 12px 12px 0', borderBottom: '0.5px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allBookings?.slice(0, 25).map((b: any) => {
                    const commission = b.commission_amount || Math.round(b.total_price * 0.1)
                    const sc = statusColors[b.status] ?? '#fff'
                    const tc = typeColors[b.item_type]  ?? '#fff'
                    return (
                      <tr key={b.id} className="adm-tr" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '11px 12px 11px 0', fontSize: 11, fontFamily: 'monospace', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{b.reference?.slice(0, 14)}</td>
                        <td style={{ padding: '11px 12px 11px 0' }}>
                          <p style={{ fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap' }}>{b.client_name}</p>
                          {b.client_phone && <p style={{ fontSize: 10, color: 'var(--blue)' }}>{b.client_phone}</p>}
                        </td>
                        <td style={{ padding: '11px 12px 11px 0' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, color: tc, background: `${tc}15`, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{b.item_type}</span>
                        </td>
                        <td style={{ padding: '11px 12px 11px 0', fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{formatPrice(b.total_price)}</td>
                        <td style={{ padding: '11px 12px 11px 0', fontSize: 12, fontWeight: 700, color: 'var(--teal)', whiteSpace: 'nowrap' }}>
                          {b.status === 'pending_contact' ? '—' : `+${formatPrice(commission)}`}
                        </td>
                        <td style={{ padding: '11px 12px 11px 0' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, color: sc, background: `${sc}18`, whiteSpace: 'nowrap' }}>{statusLabels[b.status] ?? b.status}</span>
                        </td>
                        <td style={{ padding: '11px 0', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {new Date(b.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── DERNIERS INSCRITS ── */}
          <div className="adm-section-label">👤 Membres</div>
          <div className="adm-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="adm-dot" style={{ background: 'var(--purple)' }} />
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Derniers inscrits</h2>
              </div>
              <span style={{ fontSize: 11, color: 'var(--muted)', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 20 }}>{allProfiles?.length ?? 0} membres</span>
            </div>
            <div className="adm-users">
              {allProfiles?.slice(0, 12).map((p: any) => {
                const utColors: Record<string, string> = { client: 'var(--teal)', owner_residence: 'var(--blue)', owner_vehicle: 'var(--purple)', owner_event: 'var(--yellow)' }
                const utLabels: Record<string, string> = { client: 'Client', owner_residence: 'Propriétaire', owner_vehicle: 'Loueur', owner_event: 'Organisateur' }
                const col = utColors[p.account_type] ?? 'var(--muted)'
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${col}12`, border: `0.5px solid ${col}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: col, flexShrink: 0 }}>
                      {p.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.full_name}</p>
                      <p style={{ fontSize: 11, color: 'var(--muted)' }}>{p.city} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
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