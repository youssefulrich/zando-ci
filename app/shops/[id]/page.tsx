import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: shopRaw } = await supabase
    .from('shops' as any)
    .select('*')
    .eq('id', id)
    .single()

  if (!shopRaw) notFound()
  const shop = shopRaw as any

  const { data: productsRaw } = await supabase
    .from('products' as any)
    .select('*')
    .eq('shop_id', id)
    .eq('status', 'active')
    .eq('available', true)
    .order('created_at', { ascending: false })
  const products = productsRaw as any[] ?? []

  // Vérifier si c'est le propriétaire connecté
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === shop.owner_id

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
        .sp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .sp-card { background: #111827; border: 0.5px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; text-decoration: none; display: block; transition: all 0.2s; }
        .sp-card:hover { border-color: rgba(251,146,60,0.35); transform: translateY(-2px); }

        @media (max-width: 767px) {
          .sp-wrap { padding: 16px 14px 60px; }
          .sp-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .sp-header-actions { flex-direction: column !important; align-items: flex-start !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .sp-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#e2e8f0' }}>
        <Navbar />
        <div className="sp-wrap">

          {/* Retour */}
          <Link href="/boutique" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            ← Retour à la marketplace
          </Link>

          {/* Header boutique */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', background: 'rgba(251,146,60,0.15)', border: '0.5px solid rgba(251,146,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fb923c', flexShrink: 0 }}>
                {shop.logo_url
                  ? <img src={shop.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : shop.name?.slice(0, 2).toUpperCase()
                }
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 4 }}>{shop.name}</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>📍 {shop.city}{shop.address ? ` · ${shop.address}` : ''}</p>
                {shop.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{shop.description}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{products.length} produit{products.length > 1 ? 's' : ''}</span>
                  {shop.whatsapp && (
                    <a href={`https://wa.me/${shop.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" style={{ padding: '6px 14px', background: 'rgba(37,211,102,0.15)', border: '0.5px solid rgba(37,211,102,0.3)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#25d366', textDecoration: 'none' }}>
                      💬 WhatsApp
                    </a>
                  )}
                  {shop.phone && (
                    <a href={`tel:${shop.phone}`} style={{ padding: '6px 14px', background: 'rgba(96,165,250,0.1)', border: '0.5px solid rgba(96,165,250,0.2)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#60a5fa', textDecoration: 'none' }}>
                      📞 Appeler
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ Boutons propriétaire */}
            {isOwner && (
              <div className="sp-header-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                <Link href="/publier/produit" style={{ padding: '11px 20px', background: '#fb923c', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  + Ajouter un produit
                </Link>
                <Link href="/dashboard" style={{ padding: '11px 16px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: 12, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Bannière propriétaire */}
          {isOwner && (
            <div style={{ background: 'rgba(251,146,60,0.06)', border: '0.5px solid rgba(251,146,60,0.2)', borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                🏪 <strong style={{ color: '#fb923c' }}>Votre boutique</strong> — Vous êtes le propriétaire. Gérez vos produits depuis ici ou depuis votre dashboard.
              </p>
              <Link href="/publier/produit" style={{ fontSize: 13, color: '#fb923c', textDecoration: 'none', padding: '8px 16px', borderRadius: 10, border: '0.5px solid rgba(251,146,60,0.25)', background: 'rgba(251,146,60,0.08)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                + Ajouter un produit →
              </Link>
            </div>
          )}

          {/* Grille produits */}
          {products.length > 0 ? (
            <div className="sp-grid">
              {products.map(p => {
                const photo = Array.isArray(p.photos) && p.photos[0] ? p.photos[0] : null
                return (
                  <Link key={p.id} href={`/boutique/${p.id}`} className="sp-card">
                    <div style={{ position: 'relative' }}>
                      <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#1a2236' }}>
                        {photo
                          ? <img src={photo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'rgba(255,255,255,0.06)' }}>📦</div>
                        }
                      </div>
                      {p.compare_price > p.price && (
                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(248,113,113,0.9)', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                          -{Math.round((1 - p.price / p.compare_price) * 100)}%
                        </div>
                      )}
                      {p.delivery_available && (
                        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(34,211,165,0.85)', borderRadius: 6, padding: '2px 7px', fontSize: 9, fontWeight: 700, color: '#0a0f1a' }}>
                          🚚 Livraison
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '12px 14px 14px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 6, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#fb923c' }}>{formatPrice(p.price)}</span>
                        {p.compare_price > p.price && (
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{formatPrice(p.compare_price)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, color: 'rgba(255,255,255,0.06)', marginBottom: 16 }}>📦</div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Aucun produit pour l'instant</p>
              {isOwner && (
                <Link href="/publier/produit" style={{ display: 'inline-block', marginTop: 12, padding: '12px 24px', background: '#fb923c', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  + Ajouter mon premier produit
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}