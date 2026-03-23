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
  if (params.city) query = query.eq('city', params.city)
  if (params.date) query = query.eq('event_date', params.date)

  const { data: events, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  const CATEGORIES = [
    { value: 'concert', label: 'Concert' },
    { value: 'festival', label: 'Festival' },
    { value: 'sport', label: 'Sport' },
    { value: 'conference', label: 'Conférence' },
    { value: 'theatre', label: 'Théâtre' },
    { value: 'autre', label: 'Autre' },
  ]
  const CITIES = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo']

  function getBadge(event: { tickets_sold: number; total_capacity: number; event_date: string }) {
    const remaining = event.total_capacity - event.tickets_sold
    const daysLeft = Math.ceil((new Date(event.event_date).getTime() - Date.now()) / 86400000)
    if (remaining === 0) return { label: 'Complet', bg: 'rgba(239,68,68,0.15)', color: '#f87171' }
    if (daysLeft <= 7) return { label: 'Bientôt', bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' }
    return { label: `${remaining} billets`, bg: 'rgba(34,211,165,0.15)', color: '#22d3a5' }
  }

  return (
    <>
      <style>{`
        .evt-container { max-width: 1200px; margin: 0 auto; padding: 40px 48px; }
        .evt-layout { display: flex; gap: 32px; align-items: flex-start; }
        .evt-sidebar {
          width: 240px; flex-shrink: 0;
          background: #111827; border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 20px;
        }
        .evt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

        @media (max-width: 767px) {
          .evt-container { padding: 24px 16px; }
          .evt-layout { flex-direction: column; }
          .evt-sidebar { width: 100%; }
          .evt-grid { grid-template-columns: 1fr 1fr; }
          .evt-title { font-size: 26px !important; }
        }

        @media (max-width: 480px) {
          .evt-grid { grid-template-columns: 1fr; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .evt-container { padding: 32px 24px; }
          .evt-sidebar { width: 200px; }
          .evt-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
        <Navbar />
        <div className="evt-container">

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Découvrir</div>
            <h1 className="evt-title" style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>Événements à venir</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{count ?? 0} événements disponibles en Côte d&apos;Ivoire</p>
          </div>

          {/* Filtres rapides */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
            <Link href="/events" style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: !params.category ? '#a78bfa' : 'rgba(255,255,255,0.05)', color: !params.category ? '#1a0a3d' : 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.1)' }}>Tous</Link>
            {CATEGORIES.map(c => (
              <Link key={c.value} href={`/events?category=${c.value}`} style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: params.category === c.value ? '#a78bfa' : 'rgba(255,255,255,0.05)', color: params.category === c.value ? '#1a0a3d' : 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.1)' }}>{c.label}</Link>
            ))}
          </div>

          <div className="evt-layout">
            {/* Sidebar */}
            <aside className="evt-sidebar">
              <details>
                <summary style={{ display: 'block', padding: '10px 0', background: 'none', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer', listStyle: 'none', marginBottom: 16 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>🔍 Filtres</span>
                </summary>
                <form>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: 'block' }}>Ville</label>
                  <select name="city" defaultValue={params.city ?? ''} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', marginBottom: 16, outline: 'none', colorScheme: 'dark' }}>
                    <option value="">Toutes les villes</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: 'block' }}>Date</label>
                  <input type="date" name="date" defaultValue={params.date ?? ''} min={today} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', marginBottom: 16, outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />

                  {params.category && <input type="hidden" name="category" value={params.category} />}

                  <button type="submit" style={{ width: '100%', padding: '11px', background: '#a78bfa', color: '#1a0a3d', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>Appliquer</button>
                  <Link href="/events" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Réinitialiser</Link>
                </form>
              </details>
            </aside>

            {/* Grille */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {events && events.length > 0 ? (
                <>
                  <div className="evt-grid">
                    {events.map(e => {
                      const badge = getBadge(e)
                      return (
                        <Link key={e.id} href={`/events/${e.id}`} style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', display: 'block' }}>
                          <div style={{ aspectRatio: '4/3', background: '#1a2236', overflow: 'hidden', position: 'relative' }}>
                            {e.main_photo ? (
                              <img src={e.main_photo} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'rgba(255,255,255,0.1)' }}>◉</div>
                            )}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,15,26,0.8) 0%, transparent 50%)' }} />
                            <span style={{ position: 'absolute', top: 12, right: 12, background: badge.bg, color: badge.color, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: `0.5px solid ${badge.color}30` }}>{badge.label}</span>
                            <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: '0.5px solid rgba(167,139,250,0.25)', textTransform: 'capitalize' }}>{e.category}</span>
                            <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{formatDate(e.event_date)}</p>
                            </div>
                          </div>
                          <div style={{ padding: 16 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</p>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.venue_name}</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <p style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa' }}>
                                {e.price_per_ticket === 0 ? 'Gratuit' : formatPrice(e.price_per_ticket)}
                                {e.price_per_ticket > 0 && <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}> / billet</span>}
                              </p>
                              <span style={{ fontSize: 12, color: '#a78bfa' }}>→</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Link key={p} href={`/events?${new URLSearchParams({ ...params, page: String(p) })}`} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, fontSize: 13, textDecoration: 'none', background: p === page ? '#a78bfa' : 'rgba(255,255,255,0.05)', color: p === page ? '#1a0a3d' : 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.08)', fontWeight: p === page ? 700 : 400 }}>{p}</Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <div style={{ fontSize: 48, color: 'rgba(255,255,255,0.08)', marginBottom: 16 }}>◉</div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Aucun événement trouvé</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Revenez bientôt ou modifiez vos filtres</p>
                  <Link href="/events" style={{ display: 'inline-block', marginTop: 20, fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>Voir tous les événements</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}