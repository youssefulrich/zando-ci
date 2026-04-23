import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import OrderFormProduct from '@/components/shop/OrderFormProduct'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: productRaw } = await supabase
    .from('products')
    .select('*, shops(id, name, logo_url, city, phone, whatsapp, description, total_sales)')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!productRaw) notFound()
  const product = productRaw as any
  const shop = product.shops as any

  // Produits similaires
  const { data: similarRaw } = await supabase
    .from('products')
    .select('id, name, price, photos, city')
    .eq('category', product.category)
    .eq('status', 'active')
    .neq('id', id)
    .limit(4)
  const similar = similarRaw as any[] ?? []

  const photos: string[] = Array.isArray(product.photos) ? product.photos : []

  // Incrémenter les vues
  await supabase.from('products').update({ views: (product.views ?? 0) + 1 }).eq('id', id)

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pd-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
        .pd-grid { display: grid; grid-template-columns: 1fr 400px; gap: 48px; align-items: flex-start; }
        .pd-thumbs { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
        .pd-similar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }

        @media (max-width: 767px) {
          .pd-wrap { padding: 16px 14px 60px; }
          .pd-grid { grid-template-columns: 1fr; gap: 24px; }
          .pd-similar { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .pd-grid { grid-template-columns: 1fr; }
          .pd-wrap { padding: 24px 24px 60px; }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#e2e8f0' }}>
        <Navbar />
        <div className="pd-wrap">

          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            <Link href="/boutique" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Boutique</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
            <Link href={`/boutique?cat=${product.category}`} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', textTransform: 'capitalize' }}>{product.category}</Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
            <span style={{ fontSize: 13, color: '#fb923c' }}>{product.name}</span>
          </div>

          <div className="pd-grid">
            {/* Gauche : photos */}
            <div>
              <div style={{ borderRadius: 16, overflow: 'hidden', background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', aspectRatio: '1', position: 'relative' }}>
                {photos[0]
                  ? <img src={photos[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} id="pd-main-img" />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: 'rgba(255,255,255,0.06)' }}>📦</div>
                }
                {product.type === 'service' && (
                  <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(96,165,250,0.9)', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#fff' }}>SERVICE</div>
                )}
              </div>
              {photos.length > 1 && (
                <div className="pd-thumbs">
                  {photos.map((p, i) => (
                    <div key={i} style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', flexShrink: 0 }}>
                      <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Infos vendeur */}
              {shop && (
                <div style={{ marginTop: 24, background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Vendeur</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(251,146,60,0.15)', border: '0.5px solid rgba(251,146,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fb923c', flexShrink: 0, overflow: 'hidden' }}>
                      {shop.logo_url ? <img src={shop.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : shop.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{shop.name}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>📍 {shop.city} · {shop.total_sales} vente{shop.total_sales > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Link href={`/shops/${shop.id}`} style={{ display: 'block', textAlign: 'center', padding: '9px', background: 'rgba(251,146,60,0.08)', border: '0.5px solid rgba(251,146,60,0.2)', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#fb923c', textDecoration: 'none' }}>
                    Voir la boutique →
                  </Link>
                </div>
              )}
            </div>

            {/* Droite : infos + commande */}
            <div style={{ position: 'sticky', top: 24 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '0.5px solid rgba(251,146,60,0.25)', textTransform: 'capitalize' }}>{product.category}</span>
                {product.delivery_available && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(34,211,165,0.1)', color: '#22d3a5', border: '0.5px solid rgba(34,211,165,0.2)' }}>🚚 Livraison CI</span>}
                {product.stock > 0 && product.type === 'physical' && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '0.5px solid rgba(96,165,250,0.2)' }}>{product.stock} en stock</span>}
              </div>

              <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, color: '#f1f5f9', letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 12 }}>{product.name}</h1>

              {/* Prix */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: '#fb923c', letterSpacing: -1 }}>{formatPrice(product.price)}</span>
                {product.compare_price && product.compare_price > product.price && (
                  <>
                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>{formatPrice(product.compare_price)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
                      -{Math.round((1 - product.price / product.compare_price) * 100)}%
                    </span>
                  </>
                )}
                {product.unit && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>/ {product.unit}</span>}
              </div>

              {/* Description */}
              {product.description && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{product.description}</p>
                </div>
              )}

              {/* Formulaire commande */}
              <OrderFormProduct
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  type: product.type,
                  delivery_available: product.delivery_available,
                  delivery_price: product.delivery_price ?? 0,
                  pickup_available: product.pickup_available,
                  shop_id: product.shop_id,
                  owner_id: product.owner_id,
                  stock: product.stock,
                  city: product.city,
                  shop_phone: shop?.phone,
                  shop_whatsapp: shop?.whatsapp,
                  shop_name: shop?.name,
                }}
                isLoggedIn={!!user}
              />
            </div>
          </div>

          {/* Produits similaires */}
          {similar.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb923c' }} />
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Produits similaires</h2>
              </div>
              <div className="pd-similar">
                {similar.map(p => {
                  const ph = Array.isArray(p.photos) && p.photos[0] ? p.photos[0] : null
                  return (
                    <Link key={p.id} href={`/boutique/${p.id}`} style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', textDecoration: 'none', display: 'block', transition: 'border-color 0.15s' }}>
                      <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#1a2236' }}>
                        {ph ? <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'rgba(255,255,255,0.06)' }}>📦</div>}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#fb923c' }}>{formatPrice(p.price)}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}