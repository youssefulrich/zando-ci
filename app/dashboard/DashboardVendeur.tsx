'use client'

import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import NotificationBell from '@/components/ui/NotificationBell'
import { formatPrice } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = { full_name: string; city: string; account_type: string }

export default function DashboardVendeur({ profile, userId }: { profile: Profile; userId: string }) {
  const [shop, setShop] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState({ total_orders: 0, pending: 0, confirmed: 0, total_sales: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { loadData() }, [userId])

  async function loadData() {
    const supabase = createClient()
    const { data: shopData } = await (supabase as any).from('shops').select('*').eq('owner_id', userId).maybeSingle()
    setShop(shopData)
    if (!shopData) return

    const { data: prodsData } = await (supabase as any).from('products').select('*').eq('shop_id', shopData.id).order('created_at', { ascending: false })
    setProducts(prodsData ?? [])

    const { data: ordersData } = await (supabase as any).from('orders').select('*').eq('seller_id', userId).order('created_at', { ascending: false })
    const allOrders = ordersData ?? []
    setOrders(allOrders)

    const pending = allOrders.filter((o: any) => o.status === 'pending').length
    const confirmed = allOrders.filter((o: any) => ['confirmed', 'shipped', 'delivered'].includes(o.status)).length
    const totalSales = allOrders.filter((o: any) => o.status === 'delivered').reduce((s: number, o: any) => s + o.seller_amount, 0)
    setStats({ total_orders: allOrders.length, pending, confirmed, total_sales: totalSales })
  }

  // CORRECTION : mise à jour locale sans reload complet
  async function updateOrderStatus(orderId: string, newStatus: string) {
    setActionLoading(orderId)
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      const wasPending = orders.find((o: any) => o.id === orderId)?.status === 'pending'
      setOrders(prev => prev.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o))
      setStats(prev => ({
        ...prev,
        pending: wasPending ? Math.max(0, prev.pending - 1) : prev.pending,
        confirmed: ['confirmed', 'shipped', 'delivered'].includes(newStatus) && wasPending
          ? prev.confirmed + 1 : prev.confirmed,
      }))
    } else {
      console.error('Erreur update commande:', error)
    }
    setActionLoading(null)
  }

  async function toggleProduct(productId: string, current: boolean) {
    const supabase = createClient()
    await (supabase as any).from('products').update({ available: !current }).eq('id', productId)
    setProducts(prev => prev.map((p: any) => p.id === productId ? { ...p, available: !current } : p))
  }

  async function deleteProduct(productId: string) {
    if (!confirm('Retirer ce produit ?')) return
    const supabase = createClient()
    await (supabase as any).from('products').update({ status: 'rejected' }).eq('id', productId)
    setProducts(prev => prev.filter((p: any) => p.id !== productId))
  }

  function statusLabel(s: string) {
    return ({ pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' } as any)[s] ?? s
  }
  function statusColor(s: string) {
    return (({ pending: { c: '#fbbf24', bg: 'rgba(251,191,36,0.1)' }, confirmed: { c: '#22d3a5', bg: 'rgba(34,211,165,0.1)' }, shipped: { c: '#60a5fa', bg: 'rgba(96,165,250,0.1)' }, delivered: { c: '#22d3a5', bg: 'rgba(34,211,165,0.1)' }, cancelled: { c: '#f87171', bg: 'rgba(248,113,113,0.1)' } } as any)[s]) ?? { c: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' }
  }

  const accent = '#fb923c'
  const pendingOrders = orders.filter((o: any) => o.status === 'pending')

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .dv { background: #0a0f1a; min-height: 100vh; }
        .dv-wrap { max-width: 900px; margin: 0 auto; padding: 24px 16px 60px; }
        .dv-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .dv-head-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .dv-btn-main { padding: 10px 16px; background: #fb923c; color: #fff; border-radius: 10px; font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap; display: inline-block; }
        .dv-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .dv-stat { background: #111827; border: 0.5px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; }
        .dv-card { background: #111827; border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin-bottom: 14px; }
        .dv-pending { border-color: rgba(251,191,36,0.25) !important; background: rgba(251,191,36,0.04) !important; }
        .dv-pending-item { padding-bottom: 14px; margin-bottom: 14px; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        .dv-pending-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .dv-prod { display: flex; gap: 10px; background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 12px; }
        .dv-prod + .dv-prod { margin-top: 10px; }
        .dv-prod-actions { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
        .dv-order-row { padding: 12px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
        .dv-order-row:last-child { border-bottom: none; }
        .dv-act-btn { font-size: 11px; padding: 4px 8px; border-radius: 7px; cursor: pointer; text-align: center; display: block; text-decoration: none; white-space: nowrap; background: none; }
        @media (max-width: 479px) {
          .dv-head { align-items: flex-start; }
          .dv-head-right { width: 100%; justify-content: space-between; margin-top: 4px; }
          .dv-btn-main { flex: 1; text-align: center; }
        }
        @media (min-width: 640px) {
          .dv-wrap { padding: 32px 24px 60px; }
          .dv-stats { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 900px) {
          .dv-wrap { padding: 32px 48px 60px; max-width: 1100px; }
          .dv-two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .dv-two .dv-card { margin-bottom: 0; }
        }
      `}</style>

      <div className="dv">
        <Navbar />
        <div className="dv-wrap">

          <div className="dv-head">
            <div>
              <div style={{ fontSize: 10, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 4 }}>Dashboard Vendeur</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 2 }}>
                {shop?.name ?? `Bonjour, ${profile.full_name.split(' ')[0]}`} 🛍️
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{profile.city} · Vendeur</p>
            </div>
            <div className="dv-head-right">
              <NotificationBell />
              {shop?.status === 'active' ? (
                <Link href="/publier/produit" className="dv-btn-main">+ Ajouter produit</Link>
              ) : shop?.status === 'pending' ? (
                <span style={{ padding: '10px 14px', background: 'rgba(251,191,36,0.1)', border: '0.5px solid rgba(251,191,36,0.3)', color: '#fbbf24', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>⏳ En attente</span>
              ) : (
                <Link href="/publier/boutique" className="dv-btn-main">🏪 Créer boutique</Link>
              )}
            </div>
          </div>

          {!shop && (
            <div style={{ background: 'rgba(251,146,60,0.05)', border: '0.5px solid rgba(251,146,60,0.2)', borderRadius: 16, padding: 28, textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🏪</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Vous n'avez pas encore de boutique</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Créez votre boutique gratuitement pour commencer à vendre</p>
              <Link href="/publier/boutique" style={{ padding: '12px 28px', background: accent, color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
                Créer ma boutique →
              </Link>
            </div>
          )}

          {shop?.status === 'pending' && (
            <div style={{ background: 'rgba(251,191,36,0.05)', border: '0.5px solid rgba(251,191,36,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 2 }}>"{shop.name}" en attente de validation</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>L'équipe ZandoCI validera votre boutique sous 24h.</p>
              </div>
            </div>
          )}

          {shop?.status === 'active' && (
            <>
              <div className="dv-stats">
                {[
                  { label: 'Produits', value: products.filter((p: any) => p.status === 'active').length, color: accent },
                  { label: 'Commandes', value: stats.total_orders, color: '#fff' },
                  { label: 'En attente', value: stats.pending, color: '#fbbf24' },
                  { label: 'Revenus', value: formatPrice(stats.total_sales), color: '#22d3a5', hl: true },
                ].map((s, i) => (
                  <div key={i} className="dv-stat" style={(s as any).hl ? { background: 'rgba(34,211,165,0.06)', borderColor: 'rgba(34,211,165,0.2)' } : {}}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</p>
                    <p style={{ fontSize: i > 2 ? 14 : 22, fontWeight: 800, color: s.color, wordBreak: 'break-all' }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {pendingOrders.length > 0 && (
                <div className="dv-card dv-pending">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span>🔔</span>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>
                      {pendingOrders.length} commande{pendingOrders.length > 1 ? 's' : ''} en attente
                    </h2>
                  </div>
                  {pendingOrders.map((o: any) => (
                    <div key={o.id} className="dv-pending-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>{o.reference}</p>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{o.buyer_name}</p>
                          {o.buyer_phone && <a href={`tel:${o.buyer_phone}`} style={{ fontSize: 12, color: '#60a5fa', textDecoration: 'none', display: 'block', marginBottom: 2 }}>📞 {o.buyer_phone}</a>}
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>x{o.quantity} · {o.delivery_type === 'pickup' ? '🏪 Retrait' : '🚚 Livraison'}</p>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{formatPrice(o.total_price)}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => updateOrderStatus(o.id, 'confirmed')}
                          disabled={actionLoading === o.id}
                          style={{ flex: 1, padding: '9px', background: actionLoading === o.id ? 'rgba(34,211,165,0.3)' : '#22d3a5', color: '#0a1a14', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: actionLoading === o.id ? 'wait' : 'pointer' }}
                        >
                          {actionLoading === o.id ? '...' : '✓ Confirmer'}
                        </button>
                        <button
                          onClick={() => updateOrderStatus(o.id, 'cancelled')}
                          disabled={actionLoading === o.id}
                          style={{ flex: 1, padding: '9px', background: 'rgba(248,113,113,0.1)', color: '#f87171', borderRadius: 10, border: '0.5px solid rgba(248,113,113,0.2)', fontSize: 13, cursor: actionLoading === o.id ? 'wait' : 'pointer' }}
                        >
                          {actionLoading === o.id ? '...' : '✕ Refuser'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="dv-two">
                <div className="dv-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Mes produits</h2>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>{products.filter((p: any) => p.status === 'active').length}</span>
                      <Link href="/publier/produit" style={{ fontSize: 11, color: accent, textDecoration: 'none', padding: '4px 10px', borderRadius: 8, background: 'rgba(251,146,60,0.08)', border: '0.5px solid rgba(251,146,60,0.2)' }}>+ Ajouter</Link>
                    </div>
                  </div>
                  {products.filter((p: any) => p.status === 'active').length > 0 ? (
                    <div>
                      {products.filter((p: any) => p.status === 'active').slice(0, 6).map((p: any) => (
                        <div key={p.id} className="dv-prod">
                          <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#1a2236', flexShrink: 0 }}>
                            {p.photos?.[0] ? <img src={p.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'rgba(255,255,255,0.15)' }}>📦</div>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{p.name}</p>
                            <p style={{ fontSize: 12, color: accent, marginBottom: 4 }}>{formatPrice(p.price)}</p>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: p.available ? 'rgba(34,211,165,0.1)' : 'rgba(248,113,113,0.1)', color: p.available ? '#22d3a5' : '#f87171' }}>{p.available ? 'Disponible' : 'Masqué'}</span>
                              {p.stock > 0 && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>Stock: {p.stock}</span>}
                            </div>
                          </div>
                          <div className="dv-prod-actions">
                            <Link href={`/boutique/produit/${p.id}`} className="dv-act-btn" style={{ color: accent, border: '0.5px solid rgba(251,146,60,0.2)', background: 'rgba(251,146,60,0.08)' }}>Voir</Link>
                            <button onClick={() => toggleProduct(p.id, p.available)} className="dv-act-btn" style={{ color: '#60a5fa', border: '0.5px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)' }}>{p.available ? 'Masquer' : 'Afficher'}</button>
                            <button onClick={() => deleteProduct(p.id)} className="dv-act-btn" style={{ color: '#f87171', border: '0.5px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)' }}>Retirer</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '28px 0' }}>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Aucun produit publié</p>
                      <Link href="/publier/produit" style={{ fontSize: 13, color: accent, textDecoration: 'none', padding: '8px 16px', borderRadius: 10, border: '0.5px solid rgba(251,146,60,0.2)', background: 'rgba(251,146,60,0.08)' }}>+ Ajouter mon premier produit</Link>
                    </div>
                  )}
                </div>

                <div className="dv-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Commandes reçues</h2>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>{orders.length}</span>
                  </div>
                  {orders.filter((o: any) => o.status !== 'pending').length > 0 ? (
                    <div>
                      {orders.filter((o: any) => o.status !== 'pending').slice(0, 8).map((o: any) => {
                        const sc = statusColor(o.status)
                        return (
                          <div key={o.id} className="dv-order-row">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>{o.reference}</p>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{o.buyer_name}</p>
                                {o.buyer_phone && <a href={`tel:${o.buyer_phone}`} style={{ fontSize: 11, color: '#60a5fa', textDecoration: 'none' }}>📞 {o.buyer_phone}</a>}
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{formatPrice(o.total_price)}</p>
                                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: sc.c, background: sc.bg }}>{statusLabel(o.status)}</span>
                              </div>
                            </div>
                            {o.status === 'confirmed' && <button onClick={() => updateOrderStatus(o.id, 'shipped')} style={{ fontSize: 11, padding: '6px 12px', background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '0.5px solid rgba(96,165,250,0.2)', borderRadius: 8, cursor: 'pointer' }}>🚚 Marquer expédiée</button>}
                            {o.status === 'shipped' && <button onClick={() => updateOrderStatus(o.id, 'delivered')} style={{ fontSize: 11, padding: '6px 12px', background: 'rgba(34,211,165,0.1)', color: '#22d3a5', border: '0.5px solid rgba(34,211,165,0.2)', borderRadius: 8, cursor: 'pointer' }}>✅ Marquer livrée</button>}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '28px 0' }}>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Aucune commande reçue</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 16, background: 'rgba(251,146,60,0.05)', border: '0.5px solid rgba(251,146,60,0.15)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Votre boutique publique</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Partagez ce lien à vos clients</p>
                </div>
                <Link href={`/shops/${shop.id}`} target="_blank" style={{ fontSize: 13, color: accent, textDecoration: 'none', padding: '8px 16px', borderRadius: 10, border: '0.5px solid rgba(251,146,60,0.2)', background: 'rgba(251,146,60,0.08)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Voir ma boutique →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}