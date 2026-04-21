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

    // Charger boutique
    const { data: shopData } = await (supabase as any).from('shops').select('*').eq('owner_id', userId).single()
    setShop(shopData)

    if (!shopData) return

    // Produits
    const { data: prodsData } = await (supabase as any).from('products').select('*').eq('shop_id', shopData.id).order('created_at', { ascending: false })
    setProducts(prodsData ?? [])

    // Commandes
    const { data: ordersData } = await (supabase as any).from('orders').select('*').eq('seller_id', userId).order('created_at', { ascending: false })
    const allOrders = ordersData ?? []
    setOrders(allOrders)

    const pending = allOrders.filter((o: any) => o.status === 'pending').length
    const confirmed = allOrders.filter((o: any) => ['confirmed', 'shipped', 'delivered'].includes(o.status)).length
    const totalSales = allOrders.filter((o: any) => o.status === 'delivered').reduce((s: number, o: any) => s + o.seller_amount, 0)
    setStats({ total_orders: allOrders.length, pending, confirmed, total_sales: totalSales })
  }

  async function updateOrderStatus(orderId: string, status: string) {
    setActionLoading(orderId)
    const supabase = createClient()
    await (supabase as any).from('orders').update({ status }).eq('id', orderId)
    await loadData()
    setActionLoading(null)
  }

  async function toggleProduct(productId: string, current: boolean) {
    const supabase = createClient()
    await (supabase as any).from('products').update({ available: !current }).eq('id', productId)
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, available: !current } : p))
  }

  async function deleteProduct(productId: string) {
    if (!confirm('Supprimer ce produit ?')) return
    const supabase = createClient()
    await (supabase as any).from('products').update({ status: 'inactive' }).eq('id', productId)
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  function statusLabel(s: string) {
    const labels: Record<string, string> = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' }
    return labels[s] ?? s
  }
  function statusColor(s: string) {
    const colors: Record<string, { c: string; bg: string }> = {
      pending: { c: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
      confirmed: { c: '#22d3a5', bg: 'rgba(34,211,165,0.1)' },
      shipped: { c: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
      delivered: { c: '#22d3a5', bg: 'rgba(34,211,165,0.1)' },
      cancelled: { c: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    }
    return colors[s] ?? { c: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' }
  }

  const accent = '#22d3a5'
  const pendingOrders = orders.filter(o => o.status === 'pending')

  return (
    <>
      <style>{`
        .dv { background: #0a0f1a; min-height: 100vh; }
        .dv-wrap { max-width: 900px; margin: 0 auto; padding: 24px 16px 60px; }
        .dv-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .dv-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .dv-stat { background: #111827; border: 0.5px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; }
        .dv-card { background: #111827; border: 0.5px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin-bottom: 14px; }
        .dv-pending { border-color: rgba(251,191,36,0.25); background: rgba(251,191,36,0.04); }
        .dv-pending-item { padding-bottom: 14px; margin-bottom: 14px; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        .dv-pending-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .dv-prod { display: flex; gap: 10px; background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 12px; }
        .dv-prod + .dv-prod { margin-top: 10px; }
        .dv-order-row { padding: 12px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
        .dv-order-row:last-child { border-bottom: none; }
        @media (min-width: 640px) {
          .dv-wrap { padding: 32px 24px 60px; }
          .dv-stats { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 900px) {
          .dv-two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .dv-two .dv-card { margin-bottom: 0; }
        }
      `}</style>

      <div className="dv">
        <Navbar />
        <div className="dv-wrap">

          {/* Header */}
          <div className="dv-head">
            <div>
              <div style={{ fontSize: 10, color: accent, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 4 }}>Dashboard Vendeur</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 2 }}>
                {shop?.name ?? `Bonjour, ${profile.full_name.split(' ')[0]}`} 🛍️
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{profile.city} · Vendeur</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <NotificationBell />
              {shop ? (
                <Link href="/publier/produit" style={{ padding: '9px 14px', background: accent, color: '#0a1a14', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>+ Produit</Link>
              ) : (
                <Link href="/creer-boutique" style={{ padding: '9px 14px', background: accent, color: '#0a1a14', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>Créer boutique</Link>
              )}
            </div>
          </div>

          {/* Pas de boutique */}
          {!shop && (
            <div style={{ background: 'rgba(34,211,165,0.05)', border: '0.5px solid rgba(34,211,165,0.2)', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Vous n'avez pas encore de boutique</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Créez votre boutique gratuitement pour commencer à vendre</p>
              <Link href="/creer-boutique" style={{ padding: '12px 24px', background: accent, color: '#0a1a14', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                Créer ma boutique →
              </Link>
            </div>
          )}

          {shop && (
            <>
              {/* Stats */}
              <div className="dv-stats">
                {[
                  { label: 'Produits', value: products.length, color: accent },
                  { label: 'Commandes', value: stats.total_orders, color: '#fff' },
                  { label: 'En attente', value: stats.pending, color: '#fbbf24' },
                  { label: 'Revenus', value: formatPrice(stats.total_sales), color: accent, hl: true },
                ].map((s, i) => (
                  <div key={i} className="dv-stat" style={s.hl ? { background: 'rgba(34,211,165,0.06)', borderColor: 'rgba(34,211,165,0.2)' } : {}}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</p>
                    <p style={{ fontSize: i > 2 ? 14 : 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Commandes en attente */}
              {pendingOrders.length > 0 && (
                <div className="dv-card dv-pending">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span>🔔</span>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>
                      {pendingOrders.length} commande{pendingOrders.length > 1 ? 's' : ''} en attente
                    </h2>
                  </div>
                  {pendingOrders.map(o => (
                    <div key={o.id} className="dv-pending-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>{o.reference}</p>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{o.buyer_name}</p>
                          {o.buyer_phone && (
                            <a href={`tel:${o.buyer_phone}`} style={{ fontSize: 12, color: '#60a5fa', textDecoration: 'none', display: 'block', marginBottom: 2 }}>📞 {o.buyer_phone}</a>
                          )}
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>x{o.quantity} · {o.delivery_type === 'pickup' ? 'Retrait' : 'Livraison'}</p>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{formatPrice(o.total_price)}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => updateOrderStatus(o.id, 'confirmed')} disabled={actionLoading === o.id}
                          style={{ flex: 1, padding: '9px', background: '#22d3a5', color: '#0a1a14', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: actionLoading === o.id ? 0.5 : 1 }}>
                          ✓ Confirmer
                        </button>
                        <button onClick={() => updateOrderStatus(o.id, 'cancelled')} disabled={actionLoading === o.id}
                          style={{ flex: 1, padding: '9px', background: 'rgba(248,113,113,0.1)', color: '#f87171', borderRadius: 10, border: '0.5px solid rgba(248,113,113,0.2)', fontSize: 13, cursor: 'pointer', opacity: actionLoading === o.id ? 0.5 : 1 }}>
                          ✕ Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="dv-two">
                {/* Mes produits */}
                <div className="dv-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Mes produits</h2>
                    <Link href="/publier/produit" style={{ fontSize: 11, color: accent, textDecoration: 'none', padding: '4px 10px', borderRadius: 8, background: 'rgba(34,211,165,0.08)', border: '0.5px solid rgba(34,211,165,0.2)' }}>+ Ajouter</Link>
                  </div>
                  {products.filter(p => p.status === 'active').length > 0 ? (
                    <div>
                      {products.filter(p => p.status === 'active').slice(0, 6).map(p => (
                        <div key={p.id} className="dv-prod">
                          <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: '#1a2236', flexShrink: 0 }}>
                            {p.photos?.[0] ? <img src={p.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'rgba(255,255,255,0.15)' }}>📦</div>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{p.name}</p>
                            <p style={{ fontSize: 12, color: '#22d3a5', marginBottom: 4 }}>{formatPrice(p.price)}</p>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: p.available ? 'rgba(34,211,165,0.1)' : 'rgba(248,113,113,0.1)', color: p.available ? '#22d3a5' : '#f87171' }}>
                                {p.available ? 'Disponible' : 'Indispo'}
                              </span>
                              {p.stock !== null && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>Stock: {p.stock}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                            <Link href={`/boutique/produit/${p.id}`} style={{ fontSize: 11, color: accent, padding: '4px 8px', borderRadius: 7, border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)', textDecoration: 'none', textAlign: 'center' }}>Voir</Link>
                            <button onClick={() => toggleProduct(p.id, p.available)} style={{ fontSize: 11, color: '#60a5fa', padding: '4px 8px', borderRadius: 7, border: '0.5px solid rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.08)', cursor: 'pointer' }}>
                              {p.available ? 'Masquer' : 'Afficher'}
                            </button>
                            <button onClick={() => deleteProduct(p.id)} style={{ fontSize: 11, color: '#f87171', padding: '4px 8px', borderRadius: 7, border: '0.5px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)', cursor: 'pointer' }}>Retirer</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '28px 0' }}>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Aucun produit publié</p>
                      <Link href="/publier/produit" style={{ fontSize: 13, color: accent, textDecoration: 'none', padding: '8px 16px', borderRadius: 10, border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)' }}>Ajouter un produit</Link>
                    </div>
                  )}
                </div>

                {/* Toutes les commandes */}
                <div className="dv-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Commandes</h2>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>{orders.filter(o => o.status !== 'pending').length}</span>
                  </div>
                  {orders.filter(o => o.status !== 'pending').length > 0 ? (
                    <div>
                      {orders.filter(o => o.status !== 'pending').slice(0, 8).map(o => {
                        const sc = statusColor(o.status)
                        return (
                          <div key={o.id} className="dv-order-row">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                              <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
                                <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>{o.reference}</p>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{o.buyer_name}</p>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{formatPrice(o.total_price)}</p>
                                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: sc.c, background: sc.bg }}>{statusLabel(o.status)}</span>
                              </div>
                            </div>
                            {/* Bouton expédier si confirmée */}
                            {o.status === 'confirmed' && (
                              <button onClick={() => updateOrderStatus(o.id, 'shipped')} style={{ fontSize: 11, padding: '6px 12px', background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '0.5px solid rgba(96,165,250,0.2)', borderRadius: 8, cursor: 'pointer', marginTop: 4 }}>
                                🚚 Marquer expédiée
                              </button>
                            )}
                            {o.status === 'shipped' && (
                              <button onClick={() => updateOrderStatus(o.id, 'delivered')} style={{ fontSize: 11, padding: '6px 12px', background: 'rgba(34,211,165,0.1)', color: '#22d3a5', border: '0.5px solid rgba(34,211,165,0.2)', borderRadius: 8, cursor: 'pointer', marginTop: 4 }}>
                                ✅ Marquer livrée
                              </button>
                            )}
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

              {/* Lien boutique */}
              <div style={{ marginTop: 16, background: 'rgba(34,211,165,0.05)', border: '0.5px solid rgba(34,211,165,0.15)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Votre boutique publique</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Partagez ce lien à vos clients</p>
                </div>
                <Link href={`/boutique/${shop.id}`} target="_blank" style={{ fontSize: 13, color: accent, textDecoration: 'none', padding: '8px 16px', borderRadius: 10, border: '0.5px solid rgba(34,211,165,0.2)', background: 'rgba(34,211,165,0.08)', fontWeight: 600, whiteSpace: 'nowrap' }}>
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