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

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === shop.owner_id

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .sp-wrap { max-width: 1200px; margin: 0 auto; padding: 24px 16px 80px; }
        @media (min-width: 640px) { .sp-wrap { padding: 32px 24px 80px; } }

        .sp-header { display: flex; flex-direction: column; gap: 20px; margin-bottom: 28px; }
        .sp-header-identity { display: flex; align-items: flex-start; gap: 14px; }

        .sp-logo {
          width: 64px; height: 64px;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(251,146,60,0.15);
          border: 0.5px solid rgba(251,146,60,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800; color: #fb923c;
          flex-shrink: 0;
        }

        .sp-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          line-height: 1.65;
          margin-top: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (min-width: 640px) { .sp-desc { -webkit-line-clamp: unset; overflow: visible; } }

        .sp-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 12px;
        }

        .sp-owner-btns { display: flex; flex-wrap: wrap; gap: 10px; }
        .sp-owner-btns a { flex: 1; min-width: 140px; text-align: center; }

        .sp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        @media (min-width: 640px) { .sp-grid { grid-template-columns: repeat(3, 1fr); gap: 14px; } }
        @media (min-width: 1024px) { .sp-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; } }

        .sp-card {
          background: #111827;
          border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
          text-decoration: none;
          display: block;
          transition: all 0.2s;
        }
        .sp-card:hover { border-color: rgba(251,146,60,0.35); transform: translateY(-2px); }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#e2e8f0' }}>
        <Navbar />
        <div className="sp-wrap">

          <Link href="/boutique" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            ← Retour à la marketplace
          </Link>

          <div className="sp-header">
            <div className="sp-header-identity">
              <div className="sp-logo">
                {shop.logo_url
                  ? <img src={shop.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : shop.name?.slice(0, 2).toUpperCase()
                }
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 4 }}>
                  {shop.name}
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                  📍 {shop.city}{shop.address ? ` · ${shop.address}` : ''}
                </p>
              </div>
            </div>

            {shop.description && <p className="sp-desc">{shop.description}</p>}

            <div className="sp-actions">
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                {products.length} produit{products.length > 1 ? 's' : ''}
              </span>

              {shop.whatsapp && (
                <a
                  href={`https://wa.me/${shop.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  style={{ padding: '6px 14px', background: 'rgba(37,211,102,0.15)', border: '0.5px solid rgba(37,211,102,0.3)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#25d366', textDecoration: 'none' }}
                >
                  💬 WhatsApp
                </a>
              )}
              {shop.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  style={{ padding: '6px 14px', background: 'rgba(96,165,250,0.1)', border: '0.5px solid rgba(96,165,250,0.2)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#60a5fa', textDecoration: 'none' }}
                >
                  📞 Appeler
                </a>
              )}
            </div>

            {/* 🔥 BOUTONS PROPRIÉTAIRE AVEC MODIFIER */}
            {isOwner && (
              <div className="sp-owner-btns">
                <Link href="/publier/produit" style={{
                  padding: '11px 20px', background: '#fb923c', color: '#fff',
                  borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap'
                }}>
                  + Ajouter un produit
                </Link>

                <Link href="/modifier-boutique" style={{
                  padding: '11px 20px',
                  background: 'rgba(96,165,250,0.1)',
                  border: '0.5px solid rgba(96,165,250,0.3)',
                  color: '#60a5fa',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}>
                  ✏️ Modifier la boutique
                </Link>

                <Link href="/dashboard" style={{
                  padding: '11px 16px', background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
                  borderRadius: 12, fontSize: 13, fontWeight: 600, textDecoration: 'none'
                }}>
                  Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* 🔥 Bannière propriétaire (avec bouton modifier aussi) */}
          {isOwner && (
            <div style={{
              background: 'rgba(251,146,60,0.06)',
              border: '0.5px solid rgba(251,146,60,0.2)',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', flex: 1 }}>
                🏪 <strong style={{ color: '#fb923c' }}>Votre boutique</strong> — Gérez vos produits et vos informations.
              </p>

              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  href="/publier/produit"
                  style={{
                    fontSize: 13,
                    color: '#fb923c',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: '0.5px solid rgba(251,146,60,0.25)',
                    background: 'rgba(251,146,60,0.08)',
                    fontWeight: 600
                  }}
                >
                  + Produit
                </Link>

                <Link
                  href="/modifier-boutique"
                  style={{
                    fontSize: 13,
                    color: '#60a5fa',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: '0.5px solid rgba(96,165,250,0.25)',
                    background: 'rgba(96,165,250,0.08)',
                    fontWeight: 600
                  }}
                >
                  Modifier
                </Link>
              </div>
            </div>
          )}

          {/* Produits */}
          {products.length > 0 ? (
            <div className="sp-grid">
              {products.map(p => {
                const photo = Array.isArray(p.photos) && p.photos[0] ? p.photos[0] : null
                return (
                  <Link key={p.id} href={`/boutique/${p.id}`} className="sp-card">

                    <div style={{ position: 'relative' }}>
                      <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#1a2236' }}>
                        {photo
                          ? <img src={photo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'rgba(255,255,255,0.06)' }}>📦</div>
                        }
                      </div>

                      {p.compare_price > p.price && (
                        <div style={{
                          position: 'absolute', top: 8, right: 8,
                          background: 'rgba(248,113,113,0.9)',
                          borderRadius: 6, padding: '2px 7px',
                          fontSize: 10, fontWeight: 700, color: '#fff'
                        }}>
                          -{Math.round((1 - p.price / p.compare_price) * 100)}%
                        </div>
                      )}

                      {p.delivery_available && (
                        <div style={{
                          position: 'absolute', bottom: 8, left: 8,
                          background: 'rgba(34,211,165,0.85)',
                          borderRadius: 6, padding: '2px 7px',
                          fontSize: 9, fontWeight: 700, color: '#0a0f1a'
                        }}>
                          🚚 Livraison
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '12px 14px 14px' }}>
                      <p
                        style={{
                          fontSize: 13, fontWeight: 600, color: '#f1f5f9',
                          marginBottom: 6, lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}
                      >
                        {p.name}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#fb923c' }}>
                          {formatPrice(p.price)}
                        </span>

                        {p.compare_price > p.price && (
                          <span style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.3)',
                            textDecoration: 'line-through'
                          }}>
                            {formatPrice(p.compare_price)}
                          </span>
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
                <Link
                  href="/publier/produit"
                  style={{
                    display: 'inline-block', marginTop: 12,
                    padding: '12px 24px', background: '#fb923c',
                    color: '#fff', borderRadius: 12,
                    fontSize: 14, fontWeight: 700, textDecoration: 'none'
                  }}
                >
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