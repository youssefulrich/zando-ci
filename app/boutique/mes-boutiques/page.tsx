import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default async function MesBoutiquesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>
}) {
  const sp = await searchParams
  const q = sp.q ?? ''
  const city = sp.city ?? ''

  const supabase = await createClient()

  let query = supabase
    .from('shops' as any)
    .select('*, products(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (q) query = (query as any).ilike('name', `%${q}%`)
  if (city) query = (query as any).eq('city', city)

  const { data: shopsRaw } = await query
  const shops = (shopsRaw ?? []) as any[]

  const { count: totalShops } = await supabase
    .from('shops' as any)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { data: citiesRaw } = await supabase
    .from('shops' as any)
    .select('city')
    .eq('status', 'active')
  const cities = [...new Set((citiesRaw ?? []).map((s: any) => s.city).filter(Boolean))] as string[]

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .mb { background: #0a0f1a; min-height: 100vh; color: #e2e8f0; }

        .mb-hero {
          background: linear-gradient(135deg, #0d1520 0%, #111827 100%);
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
          padding: 40px 20px 32px;
        }
        .mb-hero-inner { max-width: 1200px; margin: 0 auto; }
        .mb-hero-top {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }
        @media (min-width: 640px) {
          .mb-hero-top { flex-direction: row; align-items: flex-start; justify-content: space-between; }
        }

        .mb-search { display: flex; gap: 8px; }
        .mb-search input {
          flex: 1; min-width: 0;
          background: rgba(255,255,255,0.06);
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 11px 16px;
          color: #fff; font-size: 14px; outline: none;
        }
        .mb-search input::placeholder { color: rgba(255,255,255,0.3); }
        .mb-search-btn {
          flex-shrink: 0; padding: 11px 18px;
          background: #fb923c; color: #fff;
          border-radius: 12px; border: none;
          font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap;
        }

        .mb-wrap { max-width: 1200px; margin: 0 auto; padding: 28px 20px 80px; }

        .mb-cities { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 24px; scrollbar-width: none; }
        .mb-cities::-webkit-scrollbar { display: none; }
        .mb-city {
          padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 500;
          white-space: nowrap; cursor: pointer; text-decoration: none;
          border: 0.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5);
          transition: all 0.15s;
        }
        .mb-city.active {
          background: rgba(251,146,60,0.12); border-color: rgba(251,146,60,0.35);
          color: #fb923c; font-weight: 600;
        }

        .mb-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) { .mb-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1024px) { .mb-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; } }

        /* ── Card ── */
        .mb-card {
          background: #111827;
          border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: all 0.2s;
        }
        .mb-card:hover { border-color: rgba(251,146,60,0.3); transform: translateY(-2px); background: #13202f; }

        /* Bannière */
        .mb-card-banner {
          width: 100%;
          height: 80px;
          background: linear-gradient(135deg, #1a2236 0%, #0d1520 100%);
          position: relative;
          flex-shrink: 0;
        }

        /* Corps — padding-top = hauteur logo / 2 + gap */
        .mb-card-body {
          padding: 30px 14px 14px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
          position: relative; /* pour que le logo z-index fonctionne */
        }

        /* Logo — chevauche bannière et corps */
        .mb-card-logo {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          overflow: hidden;
          background: rgba(251,146,60,0.2);
          border: 3px solid #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 800;
          color: #fb923c;
          position: absolute;
          top: -26px;   /* remonte dans la bannière */
          left: 14px;
          z-index: 2;
        }
        .mb-card-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .mb-card-name { font-size: 14px; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 4px; }
        .mb-card-city { font-size: 11px; color: rgba(255,255,255,0.4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mb-card-desc {
          font-size: 11px; color: rgba(255,255,255,0.35); line-height: 1.5; margin-top: 2px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .mb-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: auto; padding-top: 10px;
          border-top: 0.5px solid rgba(255,255,255,0.05);
        }
      `}</style>

      <div className="mb">
        <Navbar />

        {/* Hero */}
        <div className="mb-hero">
          <div className="mb-hero-inner">
            <div className="mb-hero-top">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#fb923c', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 10 }}>
                  Marketplace
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 6, lineHeight: 1.2 }}>
                  Toutes les boutiques
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                  {totalShops ?? 0} boutique{(totalShops ?? 0) > 1 ? 's' : ''} active{(totalShops ?? 0) > 1 ? 's' : ''} sur Zando CI
                </p>
              </div>
              <Link
                href="/creer-boutique"
                style={{ padding: '11px 20px', background: '#fb923c', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start' }}
              >
                + Ouvrir ma boutique
              </Link>
            </div>

            <form className="mb-search" method="GET">
              <input name="q" defaultValue={q} placeholder="Rechercher une boutique..." />
              {city && <input type="hidden" name="city" value={city} />}
              <button type="submit" className="mb-search-btn">Rechercher</button>
            </form>
          </div>
        </div>

        <div className="mb-wrap">

          <Link href="/boutique" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            ← Retour à la marketplace
          </Link>

          {cities.length > 0 && (
            <div className="mb-cities">
              <Link href={`/boutique/mes-boutiques${q ? `?q=${q}` : ''}`} className={`mb-city${!city ? ' active' : ''}`}>
                🌍 Toutes les villes
              </Link>
              {cities.map(c => (
                <Link key={c} href={`/boutique/mes-boutiques?city=${c}${q ? `&q=${q}` : ''}`} className={`mb-city${city === c ? ' active' : ''}`}>
                  📍 {c}
                </Link>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {shops.length} boutique{shops.length > 1 ? 's' : ''}
              {city ? ` · ${city}` : ''}
              {q ? ` · "${q}"` : ''}
            </p>
          </div>

          {shops.length > 0 ? (
            <div className="mb-grid">
              {shops.map((shop: any) => {
                const productCount = shop.products?.[0]?.count ?? 0
                return (
                  <Link key={shop.id} href={`/shops/${shop.id}`} className="mb-card">

                    {/* Bannière de couleur */}
                    <div className="mb-card-banner">
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(34,211,165,0.05) 100%)'
                      }} />
                    </div>

                    {/* Corps avec logo en absolute top:-26px */}
                    <div className="mb-card-body">
                      <div className="mb-card-logo">
                        {shop.logo_url
                          ? <img src={shop.logo_url} alt={shop.name} />
                          : shop.name?.slice(0, 2).toUpperCase()
                        }
                      </div>

                      <p className="mb-card-name">{shop.name}</p>
                      {shop.city && (
                        <p className="mb-card-city">📍 {shop.city}{shop.address ? ` · ${shop.address}` : ''}</p>
                      )}
                      {shop.description && (
                        <p className="mb-card-desc">{shop.description}</p>
                      )}

                      {(shop.whatsapp || shop.phone) && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          {shop.whatsapp && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '0.5px solid rgba(37,211,102,0.2)' }}>
                              💬 WA
                            </span>
                          )}
                          {shop.phone && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '0.5px solid rgba(96,165,250,0.2)' }}>
                              📞
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mb-card-footer">
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                          {productCount} produit{productCount > 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: 11, color: '#fb923c', fontWeight: 600 }}>Voir →</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.15 }}>🏪</div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                {q || city ? 'Aucune boutique trouvée' : "Aucune boutique pour l'instant"}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginBottom: 20 }}>
                Soyez le premier à ouvrir votre boutique sur Zando CI
              </p>
              <Link href="/creer-boutique" style={{ display: 'inline-block', padding: '12px 24px', background: '#fb923c', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                Ouvrir ma boutique →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}