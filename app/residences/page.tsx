import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { formatPrice } from '@/lib/utils'

export default async function ResidencesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; type?: string; min?: string; max?: string; bedrooms?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const page = Number(params.page ?? 1)
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('residences')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.city) query = query.eq('city', params.city)
  if (params.type) query = query.eq('type', params.type)
  if (params.min) query = query.gte('price_per_night', Number(params.min))
  if (params.max) query = query.lte('price_per_night', Number(params.max))
  if (params.bedrooms) query = query.gte('bedrooms', Number(params.bedrooms))

  const { data: residences, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo']
  const TYPES = [
    { value: 'villa', label: '🏡 Villa' },
    { value: 'appartement', label: '🏢 Appartement' },
    { value: 'studio', label: '🏠 Studio' },
  ]

  const accent = '#22d3a5'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .rp { background: #070b12; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ── HERO BANNER ── */
        .rp-hero {
          background: linear-gradient(135deg, #0a1a14 0%, #070b12 50%, #0a1020 100%);
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
          padding: 48px 0 0;
          position: relative;
          overflow: hidden;
        }
        .rp-hero::before {
          content: '';
          position: absolute; top: -80px; right: -80px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(34,211,165,0.06) 0%, transparent 65%);
          pointer-events: none;
        }
        .rp-hero-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 28px 40px;
        }
        .rp-breadcrumb {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: rgba(255,255,255,0.3);
          margin-bottom: 24px;
        }
        .rp-breadcrumb a { color: rgba(255,255,255,0.3); text-decoration: none; transition: color 0.2s; }
        .rp-breadcrumb a:hover { color: rgba(255,255,255,0.7); }
        .rp-breadcrumb span { color: rgba(255,255,255,0.6); }

        .rp-hero-top {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 20px; flex-wrap: wrap; margin-bottom: 32px;
        }
        .rp-hero-label {
          font-size: 10px; font-weight: 700; color: ${accent};
          text-transform: uppercase; letter-spacing: 0.18em;
          display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
        }
        .rp-hero-label::before { content: ''; width: 16px; height: 1px; background: ${accent}; }
        .rp-hero-h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(26px, 4vw, 40px); font-weight: 700;
          color: #fff; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 8px;
        }
        .rp-hero-count {
          font-size: 13px; color: rgba(255,255,255,0.35); font-weight: 300;
        }
        .rp-hero-count strong { color: ${accent}; font-weight: 600; }

        /* Type tabs */
        .rp-tabs {
          display: flex; gap: 6px; overflow-x: auto;
          scrollbar-width: none; padding-bottom: 2px;
        }
        .rp-tabs::-webkit-scrollbar { display: none; }
        .rp-tab {
          padding: 8px 18px; border-radius: 100px;
          font-size: 12px; font-weight: 600; white-space: nowrap;
          text-decoration: none; transition: all 0.2s; border: 0.5px solid transparent;
          cursor: pointer;
        }
        .rp-tab-all {
          background: ${accent}; color: #070b12; border-color: ${accent};
        }
        .rp-tab-inactive {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.45);
          border-color: rgba(255,255,255,0.08);
        }
        .rp-tab-inactive:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.75);
        }
        .rp-tab-active {
          background: rgba(34,211,165,0.1);
          color: ${accent};
          border-color: rgba(34,211,165,0.3);
        }

        /* ── LAYOUT ── */
        .rp-body { max-width: 1200px; margin: 0 auto; padding: 32px 28px 80px; }
        .rp-layout { display: flex; gap: 28px; align-items: flex-start; }

        /* ── SIDEBAR ── */
        .rp-sidebar {
          width: 220px; flex-shrink: 0;
          position: sticky; top: 88px;
        }
        .rp-sidebar-box {
          background: #0e1520;
          border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 20px;
        }
        .rp-sidebar-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13px; font-weight: 600; color: #fff;
          margin-bottom: 20px; letter-spacing: -0.3px;
          display: flex; align-items: center; gap: 8px;
        }
        .rp-field { margin-bottom: 18px; }
        .rp-label {
          display: block; font-size: 10px; font-weight: 700;
          color: rgba(255,255,255,0.35); text-transform: uppercase;
          letter-spacing: 0.12em; margin-bottom: 8px;
        }
        .rp-select, .rp-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 10px 12px;
          font-size: 13px; color: #fff; outline: none;
          colorScheme: dark; transition: border-color 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .rp-select:focus, .rp-input:focus { border-color: rgba(34,211,165,0.35); }
        .rp-price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .rp-divider { height: 0.5px; background: rgba(255,255,255,0.06); margin: 18px 0; }
        .rp-apply {
          width: 100%; padding: 11px; background: ${accent};
          color: #070b12; border-radius: 10px; border: none;
          font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.2s; margin-bottom: 8px;
        }
        .rp-apply:hover { background: #1ec99c; transform: translateY(-1px); }
        .rp-reset {
          display: block; text-align: center; font-size: 12px;
          color: rgba(255,255,255,0.25); text-decoration: none;
          transition: color 0.2s;
        }
        .rp-reset:hover { color: rgba(255,255,255,0.5); }

        /* ── GRID ── */
        .rp-main { flex: 1; min-width: 0; }
        .rp-results-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
        }
        .rp-results-text { font-size: 13px; color: rgba(255,255,255,0.35); }
        .rp-active-filters { display: flex; gap: 6px; flex-wrap: wrap; }
        .rp-filter-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 100px;
          background: rgba(34,211,165,0.08); border: 0.5px solid rgba(34,211,165,0.2);
          font-size: 11px; color: ${accent}; font-weight: 600;
        }

        .rp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        /* ── CARD ── */
        .rp-card {
          background: #0e1520;
          border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 18px; overflow: hidden;
          text-decoration: none; display: block;
          transition: all 0.25s;
        }
        .rp-card:hover {
          border-color: rgba(34,211,165,0.25);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .rp-card-img {
          position: relative; aspect-ratio: 4/3;
          background: #1a2236; overflow: hidden;
        }
        .rp-card-img img {
          width: 100%; height: 100%; object-fit: cover;
          display: block; transition: transform 0.5s ease;
        }
        .rp-card:hover .rp-card-img img { transform: scale(1.04); }
        .rp-card-img::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(7,11,18,0.7) 0%, transparent 50%);
        }
        .rp-card-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; color: rgba(255,255,255,0.08);
          background: linear-gradient(135deg, #0d1a26, #0a1018);
        }
        .rp-card-type {
          position: absolute; top: 12px; left: 12px; z-index: 2;
          padding: 4px 10px; border-radius: 100px;
          background: rgba(34,211,165,0.15); color: ${accent};
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: capitalize;
          border: 0.5px solid rgba(34,211,165,0.25);
        }
        .rp-card-city {
          position: absolute; bottom: 10px; left: 12px; z-index: 2;
          font-size: 11px; color: rgba(255,255,255,0.75);
          display: flex; align-items: center; gap: 4px;
        }
        .rp-card-body { padding: 16px; }
        .rp-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px; font-weight: 600; color: #fff;
          margin-bottom: 6px; letter-spacing: -0.3px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .rp-card-meta {
          font-size: 12px; color: rgba(255,255,255,0.3);
          margin-bottom: 14px; display: flex; gap: 10px;
        }
        .rp-card-meta span { display: flex; align-items: center; gap: 4px; }
        .rp-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 12px; border-top: 0.5px solid rgba(255,255,255,0.05);
        }
        .rp-card-price {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 16px; font-weight: 700; color: ${accent};
          letter-spacing: -0.5px;
        }
        .rp-card-price span { font-size: 11px; color: rgba(255,255,255,0.25); font-weight: 400; font-family: 'Plus Jakarta Sans', sans-serif; }
        .rp-card-arrow {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(34,211,165,0.08); border: 0.5px solid rgba(34,211,165,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: ${accent}; transition: all 0.2s;
        }
        .rp-card:hover .rp-card-arrow { background: ${accent}; color: #070b12; }

        /* ── EMPTY ── */
        .rp-empty {
          text-align: center; padding: 80px 20px;
          background: #0e1520; border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 20px;
        }
        .rp-empty-icon { font-size: 52px; color: rgba(255,255,255,0.06); margin-bottom: 20px; }
        .rp-empty-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
        .rp-empty-sub { font-size: 13px; color: rgba(255,255,255,0.2); margin-bottom: 24px; }

        /* ── PAGINATION ── */
        .rp-pagination { display: flex; justify-content: center; gap: 6px; margin-top: 40px; flex-wrap: wrap; }
        .rp-page {
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
          border-radius: 10px; font-size: 13px; text-decoration: none; transition: all 0.2s;
          border: 0.5px solid rgba(255,255,255,0.07);
        }
        .rp-page-active { background: ${accent}; color: #070b12; border-color: ${accent}; font-weight: 700; }
        .rp-page-inactive { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); }
        .rp-page-inactive:hover { background: rgba(255,255,255,0.08); color: #fff; }

        /* ── RESPONSIVE ── */
        @media (max-width: 767px) {
          .rp-hero-inner { padding: 0 16px 32px; }
          .rp-body { padding: 20px 16px 60px; }
          .rp-layout { flex-direction: column; }
          .rp-sidebar { width: 100%; position: static; }
          .rp-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .rp-hero-h1 { font-size: 24px; }
        }
        @media (max-width: 420px) {
          .rp-grid { grid-template-columns: 1fr; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .rp-hero-inner { padding: 0 20px 32px; }
          .rp-body { padding: 24px 20px 60px; }
          .rp-sidebar { width: 200px; }
          .rp-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="rp">
        <Navbar />

        {/* ── HERO ── */}
        <div className="rp-hero">
          <div className="rp-hero-inner">
            <div className="rp-breadcrumb">
              <Link href="/">Accueil</Link>
              <span>›</span>
              <span>Résidences</span>
            </div>

            <div className="rp-hero-top">
              <div>
                <div className="rp-hero-label">Location</div>
                <h1 className="rp-hero-h1">Résidences disponibles</h1>
                <p className="rp-hero-count">
                  <strong>{count ?? 0}</strong> résidence{(count ?? 0) > 1 ? 's' : ''} en Côte d&apos;Ivoire
                </p>
              </div>
            </div>

            {/* Type tabs */}
            <div className="rp-tabs">
              <Link href="/residences" className={`rp-tab ${!params.type ? 'rp-tab-all' : 'rp-tab-inactive'}`}>
                Tous types
              </Link>
              {TYPES.map(t => (
                <Link
                  key={t.value}
                  href={`/residences?type=${t.value}${params.city ? `&city=${params.city}` : ''}${params.min ? `&min=${params.min}` : ''}${params.max ? `&max=${params.max}` : ''}`}
                  className={`rp-tab ${params.type === t.value ? 'rp-tab-active' : 'rp-tab-inactive'}`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="rp-body">
          <div className="rp-layout">

            {/* ── SIDEBAR ── */}
            <aside className="rp-sidebar">
              <div className="rp-sidebar-box">
                <div className="rp-sidebar-title">🔍 Filtres</div>
                <form>
                  <div className="rp-field">
                    <label className="rp-label">Ville</label>
                    <select name="city" defaultValue={params.city ?? ''} className="rp-select">
                      <option value="">Toutes les villes</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="rp-field">
                    <label className="rp-label">Prix / nuit (FCFA)</label>
                    <div className="rp-price-row">
                      <input type="number" name="min" defaultValue={params.min ?? ''} placeholder="Min" className="rp-input" />
                      <input type="number" name="max" defaultValue={params.max ?? ''} placeholder="Max" className="rp-input" />
                    </div>
                  </div>

                  <div className="rp-field">
                    <label className="rp-label">Chambres min.</label>
                    <select name="bedrooms" defaultValue={params.bedrooms ?? ''} className="rp-select">
                      <option value="">Peu importe</option>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </div>

                  {params.type && <input type="hidden" name="type" value={params.type} />}

                  <div className="rp-divider" />
                  <button type="submit" className="rp-apply">Appliquer les filtres</button>
                  <Link href="/residences" className="rp-reset">Réinitialiser</Link>
                </form>
              </div>
            </aside>

            {/* ── MAIN ── */}
            <div className="rp-main">

              {/* Results bar */}
              <div className="rp-results-bar">
                <span className="rp-results-text">
                  {count ?? 0} résidence{(count ?? 0) > 1 ? 's' : ''} trouvée{(count ?? 0) > 1 ? 's' : ''}
                </span>
                <div className="rp-active-filters">
                  {params.city && <span className="rp-filter-badge">📍 {params.city}</span>}
                  {params.type && <span className="rp-filter-badge">🏠 {TYPES.find(t => t.value === params.type)?.label}</span>}
                  {params.bedrooms && <span className="rp-filter-badge">🛏️ {params.bedrooms}+ chambres</span>}
                  {(params.min || params.max) && <span className="rp-filter-badge">💰 {params.min ? formatPrice(Number(params.min)) : '0'} — {params.max ? formatPrice(Number(params.max)) : '∞'}</span>}
                </div>
              </div>

              {residences && residences.length > 0 ? (
                <>
                  <div className="rp-grid">
                    {residences.map(r => (
                      <Link key={r.id} href={`/residences/${r.id}`} className="rp-card">
                        <div className="rp-card-img">
                          {r.main_photo
                            ? <img src={r.main_photo} alt={r.title} />
                            : <div className="rp-card-img-placeholder">⌂</div>
                          }
                          <span className="rp-card-type">{r.type}</span>
                          <span className="rp-card-city">📍 {r.city}</span>
                        </div>
                        <div className="rp-card-body">
                          <p className="rp-card-title">{r.title}</p>
                          <div className="rp-card-meta">
                            <span>🛏️ {r.bedrooms} ch.</span>
                            <span>👥 {r.max_guests} pers.</span>
                            {r.bathrooms && <span>🚿 {r.bathrooms} sdb</span>}
                          </div>
                          <div className="rp-card-footer">
                            <div className="rp-card-price">
                              {formatPrice(r.price_per_night)}<span> / nuit</span>
                            </div>
                            <div className="rp-card-arrow">→</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="rp-pagination">
                      {page > 1 && (
                        <Link href={`/residences?${new URLSearchParams({ ...params, page: String(page - 1) })}`} className="rp-page rp-page-inactive">←</Link>
                      )}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Link key={p} href={`/residences?${new URLSearchParams({ ...params, page: String(p) })}`} className={`rp-page ${p === page ? 'rp-page-active' : 'rp-page-inactive'}`}>{p}</Link>
                      ))}
                      {page < totalPages && (
                        <Link href={`/residences?${new URLSearchParams({ ...params, page: String(page + 1) })}`} className="rp-page rp-page-inactive">→</Link>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="rp-empty">
                  <div className="rp-empty-icon">⌂</div>
                  <p className="rp-empty-title">Aucune résidence trouvée</p>
                  <p className="rp-empty-sub">Essayez de modifier vos filtres de recherche</p>
                  <Link href="/residences" style={{ display: 'inline-block', padding: '10px 24px', background: 'rgba(34,211,165,0.1)', color: '#22d3a5', borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '0.5px solid rgba(34,211,165,0.25)' }}>
                    Voir toutes les résidences
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}