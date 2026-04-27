import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { formatPrice } from '@/lib/utils'

const CATEGORIES = [
  { value: 'all', label: 'Tout', icon: '◈' },
  { value: 'mode', label: 'Mode', icon: '👗' },
  { value: 'electronique', label: 'Électronique', icon: '📱' },
  { value: 'alimentaire', label: 'Alimentaire', icon: '🍽️' },
  { value: 'beaute', label: 'Beauté', icon: '💄' },
  { value: 'maison', label: 'Maison', icon: '🏠' },
  { value: 'service', label: 'Services', icon: '⚙️' },
  { value: 'autre', label: 'Autre', icon: '📦' },
]

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; q?: string }>
}) {
  const sp = await searchParams
  const category = sp.category ?? 'all'
  const city = sp.city ?? ''
  const q = sp.q ?? ''

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, shops(name, city, logo_url, rating)')
    .eq('status', 'active')
    .eq('available', true)
    .order('created_at', { ascending: false })
    .limit(48)

  if (category !== 'all') query = query.eq('category', category)
  if (city) query = query.eq('city', city)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: productsRaw } = await query
  const products = (productsRaw ?? []) as any[]

  const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active')
  const { count: totalShops } = await supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'active')

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .bq { background: #0a0f1a; min-height: 100vh; }

        /* HERO */
        .bq-hero { background: linear-gradient(135deg, #0d1520 0%, #111827 100%); border-bottom: 0.5px solid rgba(255,255,255,0.06); padding: 48px 20px 40px; }
        .bq-hero-inner { max-width: 1200px; margin: 0 auto; }

        /* Top row : titre + CTA — colonne sur mobile, ligne sur desktop */
        .bq-hero-top {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (min-width: 640px) {
          .bq-hero-top {
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
          }
        }

        /* Ligne stats + bouton sur mobile */
        .bq-hero-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 20px;
        }

        /* Barre de recherche — ne déborde jamais */
        .bq-search {
          display: flex;
          gap: 10px;
          flex-wrap: nowrap;
        }
        .bq-search input {
          flex: 1;
          min-width: 0; /* empêche le débordement flex */
          background: rgba(255,255,255,0.06);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          color: #fff;
          font-size: 14px;
          outline: none;
        }
        .bq-search input::placeholder { color: rgba(255,255,255,0.3); }
        .bq-search-btn {
          flex-shrink: 0;
          padding: 12px 18px;
          background: #fb923c;
          color: #0a1a14;
          border-radius: 12px;
          border: none;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        /* CTA bouton */
        .bq-cta-btn {
          display: inline-block;
          padding: 12px 22px;
          background: #fb923c;
          color: #0a1a14;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Stats */
        .bq-stats { display: flex; gap: 20px; }
        .bq-stat { text-align: center; }

        /* WRAP */
        .bq-wrap { max-width: 1200px; margin: 0 auto; padding: 28px 20px 80px; }

        /* Catégories */
        .bq-cats { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 24px; scrollbar-width: none; }
        .bq-cats::-webkit-scrollbar { display: none; }
        .bq-cat {
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s;
          border: 0.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.5);
        }
        .bq-cat.active {
          background: rgba(34,211,165,0.12);
          border-color: rgba(34,211,165,0.3);
          color: #d36c22;
          font-weight: 600;
        }

        /* Grille produits */
        .bq-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) { .bq-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1024px) { .bq-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; } }

        /* Carte produit */
        .bq-card {
          background: #111827;
          border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          display: block;
          transition: all 0.2s;
        }
        .bq-card:hover { border-color: rgba(34,211,165,0.2); transform: translateY(-2px); }
        .bq-img { width: 100%; aspect-ratio: 1; object-fit: cover; background: #1a2236; display: block; }
        .bq-img-placeholder {
          width: 100%; aspect-ratio: 1;
          background: linear-gradient(135deg, #1a2236, #0d1520);
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; color: rgba(255,255,255,0.1);
        }
        .bq-info { padding: 10px 12px 12px; }
      `}</style>

      <div className="bq">
        <Navbar />

        {/* Hero */}
        <div className="bq-hero">
          <div className="bq-hero-inner">

            <div className="bq-hero-top">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#fb923c', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 10 }}>
                  Marketplace
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6, lineHeight: 1.2 }}>
                  Boutique Zando CI
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  Produits & services de vendeurs
                </p>

                {/* Stats + bouton CTA sur la même ligne */}
                <div className="bq-hero-bottom-row">
                  <div className="bq-stats">
                    <div className="bq-stat">
                      <p style={{ fontSize: 22, fontWeight: 800, color: '#fb923c', lineHeight: 1 }}>{totalProducts ?? 0}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Produits</p>
                    </div>
                    <div className="bq-stat">
                      <p style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa', lineHeight: 1 }}>{totalShops ?? 0}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Boutiques</p>
                    </div>
                  </div>
                  <Link href="/creer-boutique" className="bq-cta-btn">
                    + Ouvrir ma boutique
                  </Link>
                </div>
              </div>
            </div>

            {/* Barre de recherche */}
            <form className="bq-search" method="GET">
              <input
                name="q"
                defaultValue={q}
                placeholder="Rechercher un produit ou service..."
              />
              {category !== 'all' && <input type="hidden" name="category" value={category} />}
              {city && <input type="hidden" name="city" value={city} />}
              <button type="submit" className="bq-search-btn">Rechercher</button>
            </form>

          </div>
        </div>

        <div className="bq-wrap">

          {/* Catégories */}
          <div className="bq-cats">
            {CATEGORIES.map(c => (
              <Link
                key={c.value}
                href={`/boutique?category=${c.value}${city ? `&city=${city}` : ''}${q ? `&q=${q}` : ''}`}
                className={`bq-cat${category === c.value ? ' active' : ''}`}
              >
                {c.icon} {c.label}
              </Link>
            ))}
          </div>

          {/* Résultats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {products.length} produit{products.length > 1 ? 's' : ''}
              {category !== 'all' ? ` · ${CATEGORIES.find(c => c.value === category)?.label}` : ''}
              {q ? ` · "${q}"` : ''}
            </p>
            <Link href="/boutique/mes-boutiques" style={{ fontSize: 13, color: '#fb923c', textDecoration: 'none' }}>
              Voir toutes les boutiques →
            </Link>
          </div>

          {/* Grille produits */}
          {products.length > 0 ? (
            <div className="bq-grid">
              {products.map((p: any) => (
                <Link key={p.id} href={`/boutique/produit/${p.id}`} className="bq-card">
                  {p.photos?.[0] || p.main_photo ? (
                    <img src={p.photos?.[0] || p.main_photo} alt={p.name} className="bq-img" />
                  ) : (
                    <div className="bq-img-placeholder">📦</div>
                  )}
                  <div className="bq-info">
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(p.shops as any)?.name ?? 'Boutique'}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fb923c' }}>{formatPrice(p.price)}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {p.type === 'service' && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>SERVICE</span>
                        )}
                        {p.delivery_available && p.type === 'physical' && (
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>🚚</span>
                        )}
                      </div>
                    </div>
                    {p.compare_price && p.compare_price > p.price && (
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'line-through', marginTop: 2 }}>
                        {formatPrice(p.compare_price)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>📦</div>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Aucun produit trouvé</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Soyez le premier à vendre sur Zando CI</p>
              <Link href="/creer-boutique" style={{
                display: 'inline-block', marginTop: 20, padding: '12px 24px',
                background: '#fb923c', color: '#0a1a14', borderRadius: 12,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}>Ouvrir ma boutique</Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}