import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: s } = await (supabase as any).from('shops').select('name, description, logo_url, city').eq('id', id).single()
  if (!s) return {}
  return {
    title: `${s.name} | Zando CI`,
    description: s.description ?? `Boutique ${s.name} à ${s.city} sur Zando CI`,
    openGraph: {
      title: `${s.name} — Boutique sur Zando CI`,
      description: s.description ?? `Découvrez les produits de ${s.name} à ${s.city}`,
      images: s.logo_url ? [{ url: s.logo_url, width: 1200, height: 630 }] : [],
      type: 'website',
    },
  }
}

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: shopRaw } = await supabase.from('shops' as any).select('*').eq('id', id).single()
  if (!shopRaw) notFound()
  const shop = shopRaw as any

  const { data: productsRaw } = await supabase
    .from('products' as any)
    .select('*')
    .eq('shop_id', id)
    .eq('status', 'active')
    .eq('available', true)
    .order('created_at', { ascending: false })
  const products = (productsRaw as any[]) ?? []

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === shop.owner_id

  const totalSales = products.reduce((s: number, p: any) => s + (p.sales_count ?? 0), 0)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:     #0E0E12;
          --bg2:    #16161C;
          --bg3:    #1E1E26;
          --card:   #1A1A22;
          --border: rgba(255,255,255,0.07);
          --orange: #FF6B00;
          --text:   #F0F0F0;
          --muted:  #888;
          --muted2: #444;
        }

        .sp { background: var(--bg); min-height: 100vh; color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; }

        /* ── TOP BAR ── */
        .sp-topbar {
          background: var(--bg2); border-bottom: 1px solid var(--border);
          padding: 0 16px; display: flex; align-items: center; gap: 10px;
          height: 54px; position: sticky; top: 0; z-index: 100;
        }
        .sp-logo-text { font-size: 22px; font-weight: 900; color: var(--orange); letter-spacing: -1px; flex-shrink: 0; text-decoration: none; }
        .sp-logo-text span { color: rgba(255,255,255,0.35); }
        .sp-back { font-size: 13px; color: var(--muted); text-decoration: none; display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; }
        .sp-back:hover { color: var(--text); }
        .sp-topbar-right { margin-left: auto; flex-shrink: 0; display: flex; gap: 8px; }
        .sp-sell-btn { padding: 8px 18px; background: var(--orange); color: #fff; border-radius: 8px; font-size: 13px; font-weight: 700; text-decoration: none; }

        /* ── SHOP COVER BANNER ── */
        .sp-cover {
          background: var(--bg2);
          border-bottom: 1px solid var(--border);
          padding: 28px 16px 0;
        }
        .sp-cover-inner { max-width: 1100px; margin: 0 auto; }

        /* Logo + identité */
        .sp-identity { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
        .sp-shop-logo {
          width: 72px; height: 72px; border-radius: 16px; overflow: hidden; flex-shrink: 0;
          background: rgba(255,107,0,0.12); border: 2px solid rgba(255,107,0,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 900; color: var(--orange);
        }
        .sp-shop-logo img { width: 100%; height: 100%; object-fit: cover; }
        .sp-shop-info { flex: 1; min-width: 0; }
        .sp-shop-name { font-size: 22px; font-weight: 900; color: var(--text); letter-spacing: -0.5px; margin-bottom: 4px; }
        .sp-shop-city { font-size: 13px; color: var(--muted); margin-bottom: 10px; }

        /* Badges contact */
        .sp-contacts { display: flex; gap: 8px; flex-wrap: wrap; }
        .sp-contact-btn {
          padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
          text-decoration: none; white-space: nowrap; border: 1px solid;
          transition: opacity 0.15s;
        }
        .sp-contact-btn:hover { opacity: 0.8; }
        .sp-wa  { background: rgba(37,211,102,0.1);  border-color: rgba(37,211,102,0.3);  color: #25d366; }
        .sp-tel { background: rgba(96,165,250,0.1);  border-color: rgba(96,165,250,0.25); color: #60a5fa; }

        /* Stats strip */
        .sp-stats-strip {
          display: flex; gap: 0; border-top: 1px solid var(--border); margin-top: 16px;
        }
        .sp-stat {
          flex: 1; padding: 14px 0; text-align: center; border-right: 1px solid var(--border);
        }
        .sp-stat:last-child { border-right: none; }
        .sp-stat-n { font-size: 18px; font-weight: 900; color: var(--text); line-height: 1; }
        .sp-stat-l { font-size: 11px; color: var(--muted); margin-top: 3px; }

        /* Description */
        .sp-desc-wrap { max-width: 1100px; margin: 0 auto; padding: 18px 16px 0; }
        .sp-desc { font-size: 13px; color: var(--muted); line-height: 1.65; }

        /* ── OWNER BANNER ── */
        .sp-owner-bar {
          max-width: 1100px; margin: 16px auto 0;
          padding: 13px 16px;
          background: rgba(255,107,0,0.06); border: 1px solid rgba(255,107,0,0.2);
          border-radius: 12px; display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }
        .sp-owner-bar p { font-size: 13px; color: var(--muted); flex: 1; }
        .sp-owner-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .sp-owner-btn {
          padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700;
          text-decoration: none; white-space: nowrap; border: 1px solid; transition: opacity 0.15s;
        }
        .sp-owner-btn:hover { opacity: 0.8; }
        .sp-obtn-primary { background: var(--orange); border-color: var(--orange); color: #fff; }
        .sp-obtn-blue    { background: rgba(96,165,250,0.1); border-color: rgba(96,165,250,0.3); color: #60a5fa; }
        .sp-obtn-ghost   { background: rgba(255,255,255,0.04); border-color: var(--border); color: var(--muted); }

        /* ── MAIN ── */
        .sp-main { max-width: 1100px; margin: 0 auto; padding: 24px 16px 100px; }

        /* Section header */
        .sp-sec { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .sp-sec-title { font-size: 15px; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 8px; }
        .sp-sec-pill { font-size: 11px; background: rgba(255,107,0,0.15); color: var(--orange); padding: 2px 9px; border-radius: 20px; font-weight: 700; }

        /* ── PRODUCT GRID ── */
        .sp-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        @media (min-width:480px)  { .sp-grid { grid-template-columns: repeat(3,1fr); } }
        @media (min-width:720px)  { .sp-grid { grid-template-columns: repeat(4,1fr); } }
        @media (min-width:1080px) { .sp-grid { grid-template-columns: repeat(5,1fr); } }

        /* ── CARD ── */
        .sp-card {
          background: var(--card); border-radius: 12px; border: 1px solid var(--border);
          overflow: hidden; text-decoration: none; display: block;
          transition: transform 0.2s, border-color 0.2s;
        }
        .sp-card:hover { transform: translateY(-3px); border-color: rgba(255,107,0,0.4); }

        .sp-card-img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--bg3); }
        .sp-card-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
        .sp-card:hover .sp-card-img { transform: scale(1.05); }
        .sp-card-ph { width: 100%; aspect-ratio: 1; background: var(--bg3); display: flex; align-items: center; justify-content: center; font-size: 40px; }

        .sp-bdiscount { position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 20px; background: #FF3B30; color: #fff; }
        .sp-bdelivery { position: absolute; bottom: 8px; left: 8px; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; background: rgba(0,200,83,0.9); color: #fff; }
        .sp-bservice  { position: absolute; top: 8px; right: 8px; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; background: rgba(124,58,237,0.9); color: #fff; }

        .sp-card-body { padding: 10px 12px 13px; }
        .sp-card-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 6px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .sp-card-price { font-size: 15px; font-weight: 900; color: var(--orange); }
        .sp-card-compare { font-size: 11px; color: var(--muted2); text-decoration: line-through; margin-left: 5px; }
        .sp-card-foot { display: flex; align-items: center; justify-content: flex-end; margin-top: 7px; }
        .sp-card-cart { width: 28px; height: 28px; border-radius: 8px; background: rgba(255,107,0,0.1); border: 1px solid rgba(255,107,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 14px; transition: background 0.15s; }
        .sp-card:hover .sp-card-cart { background: var(--orange); }

        /* ── EMPTY ── */
        .sp-empty { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 60px 20px; text-align: center; }

        /* ── BOTTOM NAV ── */
        .sp-bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg2); border-top: 1px solid var(--border); display: flex; z-index: 50; }
        .sp-bnav-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 0 6px; font-size: 10px; color: var(--muted); text-decoration: none; gap: 2px; }
        .sp-bnav-item.active { color: var(--orange); }
        .sp-bnav-ico { font-size: 20px; line-height: 1; }
        .sp-bnav-fab-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 0 6px; position: relative; }
        .sp-bnav-fab { width: 46px; height: 46px; border-radius: 50%; background: var(--orange); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; position: absolute; top: -22px; box-shadow: 0 4px 16px rgba(255,107,0,0.5); }
        .sp-bnav-fab-lbl { margin-top: 26px; font-size: 10px; color: var(--muted); }

        @media (min-width:768px) {
          .sp-bottom-nav { display: none; }
          .sp-topbar { padding: 0 28px; }
          .sp-cover { padding: 36px 28px 0; }
          .sp-desc-wrap { padding: 20px 28px 0; }
          .sp-owner-bar { margin: 20px 28px 0; }
          .sp-main { padding: 28px 28px 60px; }
        }
      `}</style>

      <div className="sp">
        <Navbar />

        {/* ── TOP BAR ── */}
        <div className="sp-topbar">
          <Link href="/" className="sp-logo-text">zando<span>.ci</span></Link>
          <Link href="/boutique" className="sp-back">← Marketplace</Link>
          <div className="sp-topbar-right">
            {isOwner && (
              <Link href="/publier/produit" className="sp-sell-btn">+ Produit</Link>
            )}
          </div>
        </div>

        {/* ── COVER / PROFIL ── */}
        <div className="sp-cover">
          <div className="sp-cover-inner">
            <div className="sp-identity">
              <div className="sp-shop-logo">
                {shop.logo_url
                  ? <img src={shop.logo_url} alt={shop.name} />
                  : shop.name?.slice(0, 2).toUpperCase()
                }
              </div>
              <div className="sp-shop-info">
                <div className="sp-shop-name">{shop.name}</div>
                <div className="sp-shop-city">📍 {shop.city}{shop.address ? ` · ${shop.address}` : ''}</div>
                <div className="sp-contacts">
                  {shop.whatsapp && (
                    <a href={`https://wa.me/${shop.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" className="sp-contact-btn sp-wa">
                      💬 WhatsApp
                    </a>
                  )}
                  {shop.phone && (
                    <a href={`tel:${shop.phone}`} className="sp-contact-btn sp-tel">
                      📞 Appeler
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats strip — style Bloop / Instagram */}
            <div className="sp-stats-strip">
              <div className="sp-stat">
                <div className="sp-stat-n">{products.length}</div>
                <div className="sp-stat-l">Produits</div>
              </div>
              <div className="sp-stat">
                <div className="sp-stat-n">{totalSales}</div>
                <div className="sp-stat-l">Ventes</div>
              </div>
              <div className="sp-stat">
                <div className="sp-stat-n" style={{ color: 'var(--orange)' }}>✓</div>
                <div className="sp-stat-l">Vérifié</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {shop.description && (
          <div className="sp-desc-wrap">
            <p className="sp-desc">{shop.description}</p>
          </div>
        )}

        {/* ── OWNER BAR ── */}
        {isOwner && (
          <div className="sp-owner-bar">
            <p>🏪 <strong style={{ color: 'var(--orange)' }}>Votre boutique</strong> — Gérez vos produits et informations.</p>
            <div className="sp-owner-actions">
              <Link href="/publier/produit"   className="sp-owner-btn sp-obtn-primary">+ Ajouter un produit</Link>
              <Link href="/modifier/boutique" className="sp-owner-btn sp-obtn-blue">✏️ Modifier</Link>
              <Link href="/dashboard"         className="sp-owner-btn sp-obtn-ghost">Dashboard</Link>
            </div>
          </div>
        )}

        {/* ── PRODUITS ── */}
        <div className="sp-main">
          <div className="sp-sec">
            <div className="sp-sec-title">
              🛍️ Produits
              <span className="sp-sec-pill">{products.length}</span>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="sp-grid">
              {products.map((p: any) => {
                const photo      = Array.isArray(p.photos) && p.photos[0] ? p.photos[0] : null
                const hasDiscount = p.compare_price && p.compare_price > p.price
                const discount   = hasDiscount ? Math.round((1 - p.price / p.compare_price) * 100) : 0
                const isService  = p.type === 'service'
                return (
                  <Link key={p.id} href={`/boutique/produit/${p.id}`} className="sp-card">
                    <div className="sp-card-img-wrap">
                      {photo
                        ? <img src={photo} alt={p.name} className="sp-card-img" />
                        : <div className="sp-card-ph">📦</div>
                      }
                      {hasDiscount  && <span className="sp-bdiscount">-{discount}%</span>}
                      {p.delivery_available && !isService && <span className="sp-bdelivery">🚚 Livraison</span>}
                      {isService    && <span className="sp-bservice">SERVICE</span>}
                    </div>
                    <div className="sp-card-body">
                      <div className="sp-card-name">{p.name}</div>
                      <div>
                        <span className="sp-card-price">{formatPrice(p.price)}</span>
                        {hasDiscount && <span className="sp-card-compare">{formatPrice(p.compare_price)}</span>}
                      </div>
                      <div className="sp-card-foot">
                        <div className="sp-card-cart">🛒</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="sp-empty">
              <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Aucun produit pour l'instant</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Cette boutique n'a pas encore ajouté de produits</p>
              {isOwner && (
                <Link href="/publier/produit" style={{ display: 'inline-block', padding: '12px 28px', background: 'var(--orange)', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                  + Ajouter mon premier produit
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── BOTTOM NAV ── */}
        <nav className="sp-bottom-nav">
          <Link href="/boutique" className="sp-bnav-item">
            <span className="sp-bnav-ico">🏠</span>Accueil
          </Link>
          <Link href="/boutique?category=mode" className="sp-bnav-item">
            <span className="sp-bnav-ico">👗</span>Mode
          </Link>
          <div className="sp-bnav-fab-wrap">
            <Link href="/boutique">
              <div className="sp-bnav-fab">🛍️</div>
            </Link>
            <span className="sp-bnav-fab-lbl">Boutique</span>
          </div>
          <Link href="/boutique?category=electronique" className="sp-bnav-item">
            <span className="sp-bnav-ico">📱</span>Tech
          </Link>
          <Link href="/publier/boutique" className="sp-bnav-item">
            <span className="sp-bnav-ico">➕</span>Vendre
          </Link>
        </nav>
      </div>
    </>
  )
}