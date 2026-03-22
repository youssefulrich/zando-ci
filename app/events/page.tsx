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

  const s = {
    page: { background: '#0a0f1a', minHeight: '100vh' },
    container: { maxWidth: 1200, margin: '0 auto', padding: '40px 48px' },
    header: { marginBottom: 40 },
    label: { fontSize: 11, color: '#a78bfa', textTransform: 'uppercase' as const, letterSpacing: 2, fontWeight: 600, marginBottom: 8 },
    title: { fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 },
    sub: { fontSize: 14, color: 'rgba(255,255,255,0.35)' },
    layout: { display: 'flex', gap: 32, alignItems: 'flex-start' },
    sidebar: {
      width: 240, flexShrink: 0,
      background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: 20,
    },
    sideLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: 'block' },
    select: {
      width: '100%', background: 'rgba(255,255,255,0.05)',
      border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10,
      padding: '10px 12px', fontSize: 13, color: '#fff',
      marginBottom: 16, outline: 'none', colorScheme: 'dark' as const,
    },
    input: {
      width: '100%', background: 'rgba(255,255,255,0.05)',
      border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10,
      padding: '10px 12px', fontSize: 13, color: '#fff',
      marginBottom: 16, outline: 'none', colorScheme: 'dark' as const,
    },
    btnFilter: {
      width: '100%', padding: '11px', background: '#a78bfa',
      color: '#1a0a3d', borderRadius: 10, border: 'none',
      fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 10,
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, flex: 1 },
    card: {
      background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)',
      borderRadius: 16, overflow: 'hidden', textDecoration: 'none', display: 'block',
    },
    cardImg: { aspectRatio: '4/3', background: '#1a2236', overflow: 'hidden', position: 'relative' as const },
    cardBody: { padding: '16px' },
    cardTitle: { fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
    cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 },
    cardPrice: { fontSize: 15, fontWeight: 700, color: '#a78bfa' },
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.label}>Découvrir</div>
          <h1 style={s.title}>Événements à venir</h1>
          <p style={s.sub}>{count ?? 0} événements disponibles en Côte d&apos;Ivoire</p>
        </div>

        {/* Filtres rapides catégorie */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          <Link href="/events" style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            textDecoration: 'none',
            background: !params.category ? '#a78bfa' : 'rgba(255,255,255,0.05)',
            color: !params.category ? '#1a0a3d' : 'rgba(255,255,255,0.5)',
            border: '0.5px solid rgba(255,255,255,0.1)',
          }}>Tous</Link>
          {CATEGORIES.map(c => (
            <Link key={c.value} href={`/events?category=${c.value}`} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              textDecoration: 'none',
              background: params.category === c.value ? '#a78bfa' : 'rgba(255,255,255,0.05)',
              color: params.category === c.value ? '#1a0a3d' : 'rgba(255,255,255,0.5)',
              border: '0.5px solid rgba(255,255,255,0.1)',
            }}>{c.label}</Link>
          ))}
        </div>

        <div style={s.layout}>

          {/* Sidebar filtres */}
          <aside style={s.sidebar}>
            <form>
              <label style={s.sideLabel}>Ville</label>
              <select name="city" defaultValue={params.city ?? ''} style={s.select}>
                <option value="">Toutes les villes</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <label style={s.sideLabel}>Date</label>
              <input type="date" name="date" defaultValue={params.date ?? ''} min={today} style={s.input} />

              {params.category && <input type="hidden" name="category" value={params.category} />}

              <button type="submit" style={s.btnFilter}>Appliquer</button>
              <Link href="/events" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
                Réinitialiser
              </Link>
            </form>
          </aside>

          {/* Grille événements */}
          <div style={{ flex: 1 }}>
            {events && events.length > 0 ? (
              <>
                <div style={s.grid}>
                  {events.map(e => {
                    const badge = getBadge(e)
                    return (
                      <Link key={e.id} href={`/events/${e.id}`} style={s.card}>
                        {/* Image */}
                        <div style={s.cardImg}>
                          {e.main_photo ? (
                            <img src={e.main_photo} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'rgba(255,255,255,0.1)' }}>
                              ◉
                            </div>
                          )}
                          {/* Overlay dégradé */}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,15,26,0.8) 0%, transparent 50%)' }} />
                          {/* Badge statut */}
                          <span style={{
                            position: 'absolute', top: 12, right: 12,
                            background: badge.bg, color: badge.color,
                            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                            border: `0.5px solid ${badge.color}30`,
                          }}>
                            {badge.label}
                          </span>
                          {/* Badge catégorie */}
                          <span style={{
                            position: 'absolute', top: 12, left: 12,
                            background: 'rgba(167,139,250,0.15)', color: '#a78bfa',
                            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                            border: '0.5px solid rgba(167,139,250,0.25)', textTransform: 'capitalize',
                          }}>
                            {e.category}
                          </span>
                          {/* Date sur l'image */}
                          <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{formatDate(e.event_date)}</p>
                          </div>
                        </div>

                        {/* Infos */}
                        <div style={s.cardBody}>
                          <p style={s.cardTitle}>{e.title}</p>
                          <p style={s.cardSub}>{e.venue_name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={s.cardPrice}>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <Link key={p}
                        href={`/events?${new URLSearchParams({ ...params, page: String(p) })}`}
                        style={{
                          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 10, fontSize: 13, textDecoration: 'none',
                          background: p === page ? '#a78bfa' : 'rgba(255,255,255,0.05)',
                          color: p === page ? '#1a0a3d' : 'rgba(255,255,255,0.5)',
                          border: '0.5px solid rgba(255,255,255,0.08)',
                          fontWeight: p === page ? 700 : 400,
                        }}>
                        {p}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: 48, color: 'rgba(255,255,255,0.08)', marginBottom: 16 }}>◉</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Aucun événement trouvé</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Revenez bientôt ou modifiez vos filtres</p>
                <Link href="/events" style={{ display: 'inline-block', marginTop: 20, fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>
                  Voir tous les événements
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}