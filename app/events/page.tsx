import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { formatPrice, formatDate } from '@/lib/utils'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; date?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const page = Number(params.page ?? 1)
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .range(from, to)

  if (params.category) query = query.eq('category', params.category)
  if (params.city)     query = query.eq('city', params.city)
  if (params.date)     query = query.eq('event_date', params.date)

  const { data: events, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const CATEGORIES = [
    { value: 'concert',    label: 'Concert',    emoji: '🎵' },
    { value: 'festival',   label: 'Festival',   emoji: '🎪' },
    { value: 'sport',      label: 'Sport',      emoji: '⚽' },
    { value: 'conference', label: 'Conférence', emoji: '🎤' },
    { value: 'theatre',    label: 'Théâtre',    emoji: '🎭' },
    { value: 'autre',      label: 'Autre',      emoji: '✨' },
  ]
  const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo']

  function getBadge(e: { tickets_sold: number; total_capacity: number; event_date: string }) {
    const remaining = e.total_capacity - e.tickets_sold
    const daysLeft  = Math.ceil((new Date(e.event_date).getTime() - Date.now()) / 86400000)
    if (remaining === 0) return { label: 'Complet',          bg: 'rgba(239,68,68,0.15)',    color: '#f87171' }
    if (daysLeft <= 7)   return { label: 'Bientôt !',        bg: 'rgba(251,191,36,0.15)',   color: '#fbbf24' }
    return                      { label: `${remaining} billets`, bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:      #0E0E12;
          --bg2:     #16161C;
          --bg3:     #1E1E26;
          --card:    #1A1A22;
          --border:  rgba(255,255,255,0.07);
          --purple:  #A78BFA;
          --purpled: #1A0A3D;
          --text:    #F0F0F0;
          --muted:   #888;
          --muted2:  #444;
        }

        .ev { background: var(--bg); min-height: 100vh; color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; }

        /* ── CATS TABS ── */
        .ev-tabs-bar {
          background: var(--bg2); border-bottom: 1px solid var(--border);
          padding: 0 16px; display: flex; overflow-x: auto; scrollbar-width: none;
        }
        .ev-tabs-bar::-webkit-scrollbar { display: none; }
        .ev-tab {
          display: flex; align-items: center; gap: 5px;
          padding: 12px 16px; text-decoration: none; white-space: nowrap;
          font-size: 13px; font-weight: 500; color: var(--muted);
          border-bottom: 2px solid transparent; flex-shrink: 0;
          transition: color 0.15s, border-color 0.15s;
        }
        .ev-tab:hover  { color: var(--text); }
        .ev-tab.active { color: var(--purple); border-bottom-color: var(--purple); font-weight: 700; }

        /* ── HERO ── */
        .ev-hero {
          background: var(--bg2); border-bottom: 1px solid var(--border);
          padding: 28px 16px 22px; position: relative; overflow: hidden;
        }
        .ev-hero::before {
          content: ''; position: absolute; top: -80px; right: -80px;
          width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 65%);
          pointer-events: none;
        }
        .ev-hero-inner { max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }
        .ev-hero-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; color: var(--purple);
          text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 10px;
        }
        .ev-hero-tag::before { content: ''; width: 14px; height: 1.5px; background: var(--purple); }
        .ev-hero-h1 { font-size: clamp(22px, 4vw, 36px); font-weight: 900; color: var(--text); letter-spacing: -1px; line-height: 1.1; margin-bottom: 6px; }
        .ev-hero-count { font-size: 13px; color: var(--muted); }
        .ev-hero-count strong { color: var(--purple); font-weight: 700; }

        .ev-active-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 14px; }
        .ev-filter-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 20px;
          background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.2);
          font-size: 11px; color: var(--purple); font-weight: 600;
        }

        /* ── BODY ── */
        .ev-body { max-width: 1100px; margin: 0 auto; padding: 24px 16px 100px; }
        .ev-layout { display: flex; gap: 24px; align-items: flex-start; }

        /* ── SIDEBAR ── */
        .ev-sidebar { width: 220px; flex-shrink: 0; position: sticky; top: 70px; }
        .ev-sidebar-box { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 20px; }
        .ev-sidebar-title { font-size: 13px; font-weight: 800; color: var(--text); margin-bottom: 18px; }
        .ev-field { margin-bottom: 16px; }
        .ev-label { display: block; font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 7px; }
        .ev-select, .ev-input {
          width: 100%; background: var(--bg3); border: 1px solid var(--border);
          border-radius: 8px; padding: 9px 12px; font-size: 13px; color: var(--text);
          outline: none; color-scheme: dark; transition: border-color 0.2s; font-family: inherit;
        }
        .ev-select:focus, .ev-input:focus { border-color: rgba(167,139,250,0.4); }
        .ev-divider { height: 1px; background: var(--border); margin: 16px 0; }
        .ev-apply { width: 100%; padding: 11px; background: var(--purple); color: var(--purpled); border-radius: 8px; border: none; font-size: 13px; font-weight: 800; cursor: pointer; font-family: inherit; transition: opacity 0.2s; margin-bottom: 8px; }
        .ev-apply:hover { opacity: 0.85; }
        .ev-reset { display: block; text-align: center; font-size: 12px; color: var(--muted); text-decoration: none; }
        .ev-reset:hover { color: var(--text); }

        /* ── MAIN ── */
        .ev-main { flex: 1; min-width: 0; }
        .ev-results-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
        .ev-results-text { font-size: 13px; color: var(--muted); }

        /* ── GRID ── */
        .ev-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        @media (max-width:1023px) { .ev-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width:479px)  { .ev-grid { grid-template-columns: 1fr; } }

        /* ── CARD ── */
        .ev-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 14px; overflow: hidden; text-decoration: none; display: block;
          transition: transform 0.2s, border-color 0.2s;
        }
        .ev-card:hover { transform: translateY(-3px); border-color: rgba(167,139,250,0.3); }

        .ev-card-img { position: relative; aspect-ratio: 4/3; background: var(--bg3); overflow: hidden; }
        .ev-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s; }
        .ev-card:hover .ev-card-img img { transform: scale(1.05); }
        .ev-card-img::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(14,14,18,0.75) 0%, transparent 55%); }
        .ev-card-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 44px; }

        .ev-badge-cat {
          position: absolute; top: 10px; left: 10px; z-index: 2;
          padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700;
          background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.25);
          color: var(--purple); text-transform: capitalize;
        }
        .ev-badge-status {
          position: absolute; top: 10px; right: 10px; z-index: 2;
          padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; border: 1px solid;
        }
        .ev-card-date { position: absolute; bottom: 10px; left: 12px; z-index: 2; font-size: 11px; color: rgba(255,255,255,0.8); }

        .ev-card-body { padding: 14px; }
        .ev-card-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ev-card-venue { font-size: 12px; color: var(--muted); margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ev-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border); }
        .ev-card-price { font-size: 16px; font-weight: 900; color: var(--purple); }
        .ev-card-price small { font-size: 11px; color: var(--muted); font-weight: 400; }
        .ev-card-arrow { width: 28px; height: 28px; border-radius: 50%; background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.2); display: flex; align-items: center; justify-content: center; font-size: 13px; color: var(--purple); transition: all 0.2s; }
        .ev-card:hover .ev-card-arrow { background: var(--purple); color: var(--purpled); }

        /* ── EMPTY ── */
        .ev-empty { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 70px 20px; text-align: center; }

        /* ── PAGINATION ── */
        .ev-pagination { display: flex; justify-content: center; gap: 6px; margin-top: 36px; flex-wrap: wrap; }
        .ev-page { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 13px; text-decoration: none; transition: all 0.2s; border: 1px solid var(--border); }
        .ev-page-active   { background: var(--purple); color: var(--purpled); border-color: var(--purple); font-weight: 800; }
        .ev-page-inactive { background: var(--card); color: var(--muted); }
        .ev-page-inactive:hover { color: var(--text); border-color: rgba(255,255,255,0.15); }

        /* ── BOTTOM NAV ── */
        .ev-bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg2); border-top: 1px solid var(--border); display: flex; z-index: 50; }
        .ev-bnav-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 0 6px; font-size: 10px; color: var(--muted); text-decoration: none; gap: 2px; }
        .ev-bnav-item.active { color: var(--purple); }
        .ev-bnav-ico { font-size: 20px; line-height: 1; }
        .ev-bnav-fab-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 0 6px; position: relative; }
        .ev-bnav-fab { width: 46px; height: 46px; border-radius: 50%; background: var(--purple); color: var(--purpled); display: flex; align-items: center; justify-content: center; font-size: 22px; position: absolute; top: -22px; box-shadow: 0 4px 16px rgba(167,139,250,0.4); }
        .ev-bnav-fab-lbl { margin-top: 26px; font-size: 10px; color: var(--muted); }

        /* ── RESPONSIVE ── */
        @media (max-width: 767px) {
          .ev-hero { padding: 20px 16px 16px; }
          .ev-body { padding: 16px 16px 90px; }
          .ev-layout { flex-direction: column; }
          .ev-sidebar { width: 100%; position: static; }
        }
        @media (min-width: 768px) {
          .ev-bottom-nav { display: none; }
          .ev-tabs-bar { padding: 0 28px; }
          .ev-hero { padding: 32px 28px 24px; }
          .ev-body { padding: 28px 28px 60px; }
        }
      `}</style>

      <div className="ev">
        <Navbar />

        {/* ── TABS CATÉGORIES ── */}
        <div className="ev-tabs-bar">
          <Link href="/events" className={`ev-tab${!params.category ? ' active' : ''}`}>
            🎉 Tous
          </Link>
          {CATEGORIES.map(c => (
            <Link
              key={c.value}
              href={`/events?category=${c.value}${params.city ? `&city=${params.city}` : ''}${params.date ? `&date=${params.date}` : ''}`}
              className={`ev-tab${params.category === c.value ? ' active' : ''}`}
            >
              {c.emoji} {c.label}
            </Link>
          ))}
        </div>

        {/* ── HERO ── */}
        <div className="ev-hero">
          <div className="ev-hero-inner">
            <div className="ev-hero-tag">Découvrir</div>
            <h1 className="ev-hero-h1">Événements à venir</h1>
            <p className="ev-hero-count">
              <strong>{count ?? 0}</strong> événement{(count ?? 0) > 1 ? 's' : ''} en Côte d&apos;Ivoire
            </p>
            {(params.category || params.city || params.date) && (
              <div className="ev-active-filters">
                {params.category && <span className="ev-filter-badge">{CATEGORIES.find(c => c.value === params.category)?.emoji} {CATEGORIES.find(c => c.value === params.category)?.label}</span>}
                {params.city     && <span className="ev-filter-badge">📍 {params.city}</span>}
                {params.date     && <span className="ev-filter-badge">📅 {params.date}</span>}
              </div>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="ev-body">
          <div className="ev-layout">

            {/* ── SIDEBAR ── */}
            <aside className="ev-sidebar">
              <div className="ev-sidebar-box">
                <div className="ev-sidebar-title">🔍 Filtres</div>
                <form>
                  <div className="ev-field">
                    <label className="ev-label">Ville</label>
                    <select name="city" defaultValue={params.city ?? ''} className="ev-select">
                      <option value="">Toutes les villes</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="ev-field">
                    <label className="ev-label">Date</label>
                    <input type="date" name="date" defaultValue={params.date ?? ''} min={today} className="ev-input" />
                  </div>
                  {params.category && <input type="hidden" name="category" value={params.category} />}
                  <div className="ev-divider" />
                  <button type="submit" className="ev-apply">Appliquer</button>
                  <Link href="/events" className="ev-reset">Réinitialiser</Link>
                </form>
              </div>
            </aside>

            {/* ── MAIN ── */}
            <div className="ev-main">
              <div className="ev-results-bar">
                <span className="ev-results-text">
                  {count ?? 0} événement{(count ?? 0) > 1 ? 's' : ''} trouvé{(count ?? 0) > 1 ? 's' : ''}
                </span>
              </div>

              {events && events.length > 0 ? (
                <>
                  <div className="ev-grid">
                    {events.map((e: any) => {
                      const badge = getBadge(e)
                      return (
                        <Link key={e.id} href={`/events/${e.id}`} className="ev-card">
                          <div className="ev-card-img">
                            {e.main_photo
                              ? <img src={e.main_photo} alt={e.title} />
                              : <div className="ev-card-ph">◉</div>
                            }
                            <span className="ev-badge-cat">{e.category}</span>
                            <span className="ev-badge-status" style={{ background: badge.bg, color: badge.color, borderColor: badge.color + '40' }}>
                              {badge.label}
                            </span>
                            <div className="ev-card-date">📅 {formatDate(e.event_date)}</div>
                          </div>
                          <div className="ev-card-body">
                            <div className="ev-card-title">{e.title}</div>
                            <div className="ev-card-venue">📍 {e.venue_name}</div>
                            <div className="ev-card-footer">
                              <div className="ev-card-price">
                                {e.price_per_ticket === 0
                                  ? 'Gratuit'
                                  : <>{formatPrice(e.price_per_ticket)}<small> / billet</small></>
                                }
                              </div>
                              <div className="ev-card-arrow">→</div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="ev-pagination">
                      {page > 1 && (
                        <Link href={`/events?${new URLSearchParams({ ...params, page: String(page - 1) })}`} className="ev-page ev-page-inactive">←</Link>
                      )}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Link key={p} href={`/events?${new URLSearchParams({ ...params, page: String(p) })}`} className={`ev-page ${p === page ? 'ev-page-active' : 'ev-page-inactive'}`}>
                          {p}
                        </Link>
                      ))}
                      {page < totalPages && (
                        <Link href={`/events?${new URLSearchParams({ ...params, page: String(page + 1) })}`} className="ev-page ev-page-inactive">→</Link>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="ev-empty">
                  <div style={{ fontSize: 52, marginBottom: 16 }}>◉</div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Aucun événement trouvé</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 22 }}>Revenez bientôt ou modifiez vos filtres</p>
                  <Link href="/events" style={{ display: 'inline-block', padding: '10px 24px', background: 'rgba(167,139,250,0.1)', color: 'var(--purple)', borderRadius: 20, fontSize: 13, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(167,139,250,0.25)' }}>
                    Voir tous les événements
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BOTTOM NAV mobile ── */}
        <nav className="ev-bottom-nav">
          <Link href="/boutique" className="ev-bnav-item">
            <span className="ev-bnav-ico">🛍️</span>Boutique
          </Link>
          <Link href="/residences" className="ev-bnav-item">
            <span className="ev-bnav-ico">🏡</span>Résidences
          </Link>
          <div className="ev-bnav-fab-wrap">
            <Link href="/publier/event">
              <div className="ev-bnav-fab">➕</div>
            </Link>
            <span className="ev-bnav-fab-lbl">Publier</span>
          </div>
          <Link href="/events" className="ev-bnav-item active">
            <span className="ev-bnav-ico">🎉</span>Événements
          </Link>
          <Link href="/dashboard" className="ev-bnav-item">
            <span className="ev-bnav-ico">👤</span>Compte
          </Link>
        </nav>
      </div>
    </>
  )
}