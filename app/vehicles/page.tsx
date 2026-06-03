import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { formatPrice } from '@/lib/utils'

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; type?: string; transmission?: string; min?: string; max?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const page = Number(params.page ?? 1)
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('vehicles')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.city) query = query.eq('city', params.city)
  if (params.type) query = query.eq('type', params.type)
  if (params.transmission) query = query.eq('transmission', params.transmission)
  if (params.min) query = query.gte('price_per_day', Number(params.min))
  if (params.max) query = query.lte('price_per_day', Number(params.max))

  const { data: vehicles, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo']
  const TYPES = ['suv', 'berline', '4x4', 'citadine', 'minibus']

  const accent = '#60a5fa'

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .veh { background: #0a0f1a; min-height: 100vh; }

        /* ── HERO ── */
        .veh-hero {
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
          padding: 48px 0 0;
          position: relative;
          overflow: hidden;
        }

        /* Image de fond */
        .veh-hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background-image: url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600&q=80&auto=format&fit=crop');
          background-size: cover;
          background-position: center 55%;
          background-repeat: no-repeat;
          filter: saturate(0.55) brightness(0.28);
          transform: scale(1.04);
          transition: transform 10s ease;
        }
        .veh-hero:hover .veh-hero-bg {
          transform: scale(1.08);
        }

        /* Overlay couleur */
        .veh-hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(
            135deg,
            rgba(10,15,26,0.65) 0%,
            rgba(10,20,40,0.4) 45%,
            rgba(10,15,26,0.7) 100%
          );
        }

        /* Fondu bas */
        .veh-hero-overlay-bottom {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 2;
          height: 90px;
          background: linear-gradient(to top, #0a0f1a 0%, transparent 100%);
        }

        .veh-hero::before {
          content: '';
          position: absolute; top: -80px; right: -80px; z-index: 3;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 65%);
          pointer-events: none;
        }

        .veh-hero-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 28px 40px;
          position: relative; z-index: 4;
        }

        /* Breadcrumb */
        .veh-breadcrumb {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: rgba(255,255,255,0.3);
          margin-bottom: 24px;
        }
        .veh-breadcrumb a { color: rgba(255,255,255,0.3); text-decoration: none; transition: color 0.2s; }
        .veh-breadcrumb a:hover { color: rgba(255,255,255,0.7); }
        .veh-breadcrumb span { color: rgba(255,255,255,0.6); }

        .veh-hero-label {
          font-size: 10px; font-weight: 700; color: ${accent};
          text-transform: uppercase; letter-spacing: 0.18em;
          display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
        }
        .veh-hero-label::before { content: ''; width: 16px; height: 1px; background: ${accent}; }

        .veh-hero-h1 {
          font-size: clamp(26px, 4vw, 40px); font-weight: 800;
          color: #fff; letter-spacing: -1.5px; line-height: 1.1;
          margin-bottom: 8px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.4);
        }
        .veh-hero-count {
          font-size: 13px; color: rgba(255,255,255,0.45); font-weight: 300;
          margin-bottom: 28px;
        }
        .veh-hero-count strong { color: ${accent}; font-weight: 600; }

        /* Type tabs */
        .veh-tabs {
          display: flex; gap: 6px; overflow-x: auto;
          scrollbar-width: none; padding-bottom: 2px;
        }
        .veh-tabs::-webkit-scrollbar { display: none; }
        .veh-tab {
          padding: 8px 18px; border-radius: 100px;
          font-size: 12px; font-weight: 600; white-space: nowrap;
          text-decoration: none; transition: all 0.2s; border: 0.5px solid transparent;
          text-transform: uppercase;
        }
        .veh-tab-all {
          background: ${accent}; color: #0a1428; border-color: ${accent};
        }
        .veh-tab-inactive {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.5);
          border-color: rgba(255,255,255,0.1);
          backdrop-filter: blur(4px);
        }
        .veh-tab-inactive:hover {
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.85);
        }
        .veh-tab-active {
          background: rgba(96,165,250,0.12);
          color: ${accent};
          border-color: rgba(96,165,250,0.35);
          backdrop-filter: blur(4px);
        }

        /* ── LAYOUT ── */
        .veh-container { max-width: 1200px; margin: 0 auto; padding: 32px 28px 80px; }
        .veh-layout { display: flex; gap: 28px; align-items: flex-start; }

        /* ── SIDEBAR ── */
        .veh-sidebar {
          width: 220px; flex-shrink: 0;
          position: sticky; top: 88px;
        }
        .veh-sidebar-box {
          background: #111827;
          border: 0.5px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 20px;
        }
        .veh-sidebar-title {
          font-size: 13px; font-weight: 600; color: #fff;
          margin-bottom: 20px; letter-spacing: -0.3px;
          display: flex; align-items: center; gap: 8px;
        }
        .veh-field { margin-bottom: 18px; }
        .veh-label {
          display: block; font-size: 10px; font-weight: 700;
          color: rgba(255,255,255,0.35); text-transform: uppercase;
          letter-spacing: 0.12em; margin-bottom: 8px;
        }
        .veh-select, .veh-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 10px 12px;
          font-size: 13px; color: #fff; outline: none;
          colorScheme: dark; transition: border-color 0.2s;
        }
        .veh-select:focus, .veh-input:focus { border-color: rgba(96,165,250,0.35); }
        .veh-price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .veh-divider { height: 0.5px; background: rgba(255,255,255,0.06); margin: 18px 0; }
        .veh-apply {
          width: 100%; padding: 11px; background: ${accent};
          color: #0a1428; border-radius: 10px; border: none;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; margin-bottom: 8px;
        }
        .veh-apply:hover { background: #93c5fd; transform: translateY(-1px); }
        .veh-reset {
          display: block; text-align: center; font-size: 12px;
          color: rgba(255,255,255,0.25); text-decoration: none;
          transition: color 0.2s;
        }
        .veh-reset:hover { color: rgba(255,255,255,0.5); }

        /* ── GRID ── */
        .veh-main { flex: 1; min-width: 0; }
        .veh-results-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
        }
        .veh-results-text { font-size: 13px; color: rgba(255,255,255,0.35); }
        .veh-active-filters { display: flex; gap: 6px; flex-wrap: wrap; }
        .veh-filter-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 12px; border-radius: 100px;
          background: rgba(96,165,250,0.08); border: 0.5px solid rgba(96,165,250,0.2);
          font-size: 11px; color: ${accent}; font-weight: 600;
        }

        .veh-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

        /* ── CARD ── */
        .veh-card {
          background: #111827;
          border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 16px; overflow: hidden;
          text-decoration: none; display: block;
          transition: all 0.25s;
        }
        .veh-card:hover {
          border-color: rgba(96,165,250,0.25);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }
        .veh-card-img {
          position: relative; aspect-ratio: 4/3;
          background: #1a2236; overflow: hidden;
        }
        .veh-card-img img {
          width: 100%; height: 100%; object-fit: cover;
          display: block; transition: transform 0.5s ease;
        }
        .veh-card:hover .veh-card-img img { transform: scale(1.04); }
        .veh-card-img::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(10,15,26,0.8) 0%, transparent 50%);
        }
        .veh-card-img-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 40px; color: rgba(255,255,255,0.08);
        }
        .veh-card-type {
          position: absolute; top: 12px; left: 12px; z-index: 2;
          padding: 4px 10px; border-radius: 100px;
          background: rgba(96,165,250,0.15); color: ${accent};
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 0.5px solid rgba(96,165,250,0.25);
        }
        .veh-card-status-ok {
          position: absolute; top: 12px; right: 12px; z-index: 2;
          padding: 4px 10px; border-radius: 100px;
          background: rgba(34,211,165,0.15); color: #22d3a5;
          font-size: 10px; font-weight: 700;
          border: 0.5px solid rgba(34,211,165,0.25);
        }
        .veh-card-status-no {
          position: absolute; top: 12px; right: 12px; z-index: 2;
          padding: 4px 10px; border-radius: 100px;
          background: rgba(239,68,68,0.15); color: #f87171;
          font-size: 10px; font-weight: 700;
          border: 0.5px solid rgba(239,68,68,0.25);
        }
        .veh-card-city {
          position: absolute; bottom: 10px; left: 12px; z-index: 2;
          font-size: 11px; color: rgba(255,255,255,0.7);
        }
        .veh-card-body { padding: 16px; }
        .veh-card-title {
          font-size: 14px; font-weight: 600; color: #fff;
          margin-bottom: 4px; letter-spacing: -0.3px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .veh-card-sub {
          font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 14px;
        }
        .veh-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 12px; border-top: 0.5px solid rgba(255,255,255,0.05);
        }
        .veh-card-price {
          font-size: 15px; font-weight: 700; color: ${accent};
          letter-spacing: -0.5px;
        }
        .veh-card-price span { font-size: 11px; color: rgba(255,255,255,0.25); font-weight: 400; }
        .veh-card-arrow {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(96,165,250,0.08); border: 0.5px solid rgba(96,165,250,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: ${accent}; transition: all 0.2s;
        }
        .veh-card:hover .veh-card-arrow { background: ${accent}; color: #0a1428; }

        /* ── EMPTY ── */
        .veh-empty {
          text-align: center; padding: 80px 20px;
          background: #111827; border: 0.5px solid rgba(255,255,255,0.06);
          border-radius: 20px;
        }

        /* ── PAGINATION ── */
        .veh-pagination { display: flex; justify-content: center; gap: 6px; margin-top: 40px; flex-wrap: wrap; }
        .veh-page {
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
          border-radius: 10px; font-size: 13px; text-decoration: none; transition: all 0.2s;
          border: 0.5px solid rgba(255,255,255,0.07);
        }
        .veh-page-active { background: ${accent}; color: #0a1428; border-color: ${accent}; font-weight: 700; }
        .veh-page-inactive { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); }
        .veh-page-inactive:hover { background: rgba(255,255,255,0.08); color: #fff; }

        /* ── RESPONSIVE ── */
        @media (max-width: 767px) {
          .veh-hero-inner { padding: 0 16px 32px; }
          .veh-container { padding: 20px 16px 60px; }
          .veh-layout { flex-direction: column; }
          .veh-sidebar { width: 100%; position: static; }
          .veh-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .veh-hero-h1 { font-size: 24px; }
        }
        @media (max-width: 420px) {
          .veh-grid { grid-template-columns: 1fr; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .veh-hero-inner { padding: 0 20px 32px; }
          .veh-container { padding: 24px 20px 60px; }
          .veh-sidebar { width: 200px; }
          .veh-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="veh">
        <Navbar />

        {/* ── HERO ── */}
        <div className="veh-hero">
          {/* Image de fond */}
          <div className="veh-hero-bg" />
          {/* Overlay couleur */}
          <div className="veh-hero-overlay" />
          {/* Fondu bas */}
          <div className="veh-hero-overlay-bottom" />

          <div className="veh-hero-inner">
            <div className="veh-breadcrumb">
              <Link href="/">Accueil</Link>
              <span>›</span>
              <span>Véhicules</span>
            </div>

            <div className="veh-hero-label">Location</div>
            <h1 className="veh-hero-h1">Véhicules disponibles</h1>
            <p className="veh-hero-count">
              <strong>{count ?? 0}</strong> véhicule{(count ?? 0) > 1 ? 's' : ''} en Côte d&apos;Ivoire
            </p>

            {/* Type tabs */}
            <div className="veh-tabs">
              <Link href="/vehicles" className={`veh-tab ${!params.type ? 'veh-tab-all' : 'veh-tab-inactive'}`}>
                Tous
              </Link>
              {TYPES.map(t => (
                <Link
                  key={t}
                  href={`/vehicles?type=${t}${params.city ? `&city=${params.city}` : ''}${params.min ? `&min=${params.min}` : ''}${params.max ? `&max=${params.max}` : ''}`}
                  className={`veh-tab ${params.type === t ? 'veh-tab-active' : 'veh-tab-inactive'}`}
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="veh-container">
          <div className="veh-layout">

            {/* ── SIDEBAR ── */}
            <aside className="veh-sidebar">
              <div className="veh-sidebar-box">
                <div className="veh-sidebar-title">🔍 Filtres</div>
                <form>
                  <div className="veh-field">
                    <label className="veh-label">Ville</label>
                    <select name="city" defaultValue={params.city ?? ''} className="veh-select">
                      <option value="">Toutes les villes</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="veh-field">
                    <label className="veh-label">Transmission</label>
                    <select name="transmission" defaultValue={params.transmission ?? ''} className="veh-select">
                      <option value="">Toutes</option>
                      <option value="automatique">Automatique</option>
                      <option value="manuelle">Manuelle</option>
                    </select>
                  </div>

                  <div className="veh-field">
                    <label className="veh-label">Prix / jour (FCFA)</label>
                    <div className="veh-price-row">
                      <input type="number" name="min" defaultValue={params.min ?? ''} placeholder="Min" className="veh-input" />
                      <input type="number" name="max" defaultValue={params.max ?? ''} placeholder="Max" className="veh-input" />
                    </div>
                  </div>

                  {params.type && <input type="hidden" name="type" value={params.type} />}

                  <div className="veh-divider" />
                  <button type="submit" className="veh-apply">Appliquer les filtres</button>
                  <Link href="/vehicles" className="veh-reset">Réinitialiser</Link>
                </form>
              </div>
            </aside>

            {/* ── MAIN ── */}
            <div className="veh-main">

              {/* Results bar */}
              <div className="veh-results-bar">
                <span className="veh-results-text">
                  {count ?? 0} véhicule{(count ?? 0) > 1 ? 's' : ''} trouvé{(count ?? 0) > 1 ? 's' : ''}
                </span>
                <div className="veh-active-filters">
                  {params.city && <span className="veh-filter-badge">{params.city}</span>}
                  {params.type && <span className="veh-filter-badge">{params.type.toUpperCase()}</span>}
                  {params.transmission && <span className="veh-filter-badge">{params.transmission}</span>}
                  {(params.min || params.max) && <span className="veh-filter-badge">{params.min ? formatPrice(Number(params.min)) : '0'} — {params.max ? formatPrice(Number(params.max)) : '∞'}</span>}
                </div>
              </div>

              {vehicles && vehicles.length > 0 ? (
                <>
                  <div className="veh-grid">
                    {vehicles.map(v => (
                      <Link key={v.id} href={`/vehicles/${v.id}`} className="veh-card">
                        <div className="veh-card-img">
                          {v.main_photo
                            ? <img src={v.main_photo} alt={`${v.brand} ${v.model}`} />
                            : <div className="veh-card-img-placeholder">◈</div>
                          }
                          <span className="veh-card-type">{v.type}</span>
                          <span className={v.is_available ? 'veh-card-status-ok' : 'veh-card-status-no'}>
                            {v.is_available ? 'Dispo' : 'Loué'}
                          </span>
                          <span className="veh-card-city">{v.city}</span>
                        </div>
                        <div className="veh-card-body">
                          <p className="veh-card-title">{v.brand} {v.model}</p>
                          <p className="veh-card-sub">{v.year} · {v.transmission} · {v.seats} places</p>
                          <div className="veh-card-footer">
                            <div className="veh-card-price">
                              {formatPrice(v.price_per_day)}<span> / jour</span>
                            </div>
                            <div className="veh-card-arrow">→</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="veh-pagination">
                      {page > 1 && (
                        <Link href={`/vehicles?${new URLSearchParams({ ...params, page: String(page - 1) })}`} className="veh-page veh-page-inactive">←</Link>
                      )}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Link key={p} href={`/vehicles?${new URLSearchParams({ ...params, page: String(p) })}`} className={`veh-page ${p === page ? 'veh-page-active' : 'veh-page-inactive'}`}>{p}</Link>
                      ))}
                      {page < totalPages && (
                        <Link href={`/vehicles?${new URLSearchParams({ ...params, page: String(page + 1) })}`} className="veh-page veh-page-inactive">→</Link>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="veh-empty">
                  <div style={{ fontSize: 52, color: 'rgba(255,255,255,0.06)', marginBottom: 20 }}>◈</div>
                  <p style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Aucun véhicule trouvé</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginBottom: 24 }}>Essayez de modifier vos filtres de recherche</p>
                  <Link href="/vehicles" style={{ display: 'inline-block', padding: '10px 24px', background: 'rgba(96,165,250,0.1)', color: '#60a5fa', borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '0.5px solid rgba(96,165,250,0.25)' }}>
                    Voir tous les véhicules
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