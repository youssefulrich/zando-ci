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
    { value: 'villa', label: 'Villa' },
    { value: 'appartement', label: 'Appartement' },
    { value: 'studio', label: 'Studio' },
  ]

  return (
    <>
      <style>{`
        .res-container { max-width: 1200px; margin: 0 auto; padding: 40px 48px; }
        .res-layout { display: flex; gap: 32px; align-items: flex-start; }
        .res-sidebar {
          width: 240px; flex-shrink: 0;
          background: #111827; border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 20px;
        }
        .res-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; flex: 1; }
        .res-filter-toggle {
          display: none; width: 100%; padding: 11px; background: rgba(255,255,255,0.05);
          border: 0.5px solid rgba(255,255,255,0.12); border-radius: 10px;
          color: #fff; font-size: 13px; cursor: pointer; margin-bottom: 16px;
        }

        @media (max-width: 767px) {
          .res-container { padding: 24px 16px; }
          .res-layout { flex-direction: column; }
          .res-sidebar { width: 100%; }
          .res-grid { grid-template-columns: 1fr 1fr; }
          .res-filter-toggle { display: block; }
          .res-sidebar-inner { display: none; }
          .res-sidebar-inner.open { display: block; }
          .res-title { font-size: 26px !important; }
        }

        @media (max-width: 480px) {
          .res-grid { grid-template-columns: 1fr; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .res-container { padding: 32px 24px; }
          .res-sidebar { width: 200px; }
          .res-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
        <Navbar />
        <div className="res-container">

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Location</div>
            <h1 className="res-title" style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>Résidences disponibles</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{count ?? 0} résidences en Côte d&apos;Ivoire</p>
          </div>

          {/* Filtres rapides */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
            <Link href="/residences" style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, textDecoration: 'none',
              background: !params.type ? '#22d3a5' : 'rgba(255,255,255,0.05)',
              color: !params.type ? '#0a1a14' : 'rgba(255,255,255,0.5)',
              border: '0.5px solid rgba(255,255,255,0.1)',
            }}>Tous types</Link>
            {TYPES.map(t => (
              <Link key={t.value} href={`/residences?type=${t.value}`} style={{
                padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                background: params.type === t.value ? '#22d3a5' : 'rgba(255,255,255,0.05)',
                color: params.type === t.value ? '#0a1a14' : 'rgba(255,255,255,0.5)',
                border: '0.5px solid rgba(255,255,255,0.1)',
              }}>{t.label}</Link>
            ))}
          </div>

          <div className="res-layout">
            {/* Sidebar */}
            <aside className="res-sidebar">
              <details>
                <summary style={{
                  display: 'block', width: '100%', padding: '10px 0', background: 'none',
                  border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer',
                  listStyle: 'none', marginBottom: 16,
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                    🔍 Filtres
                  </span>
                </summary>
                <form>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: 'block' }}>Ville</label>
                  <select name="city" defaultValue={params.city ?? ''} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', marginBottom: 16, outline: 'none', colorScheme: 'dark' }}>
                    <option value="">Toutes les villes</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: 'block' }}>Prix / nuit (FCFA)</label>
                  <input type="number" name="min" defaultValue={params.min ?? ''} placeholder="Min" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', marginBottom: 8, outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
                  <input type="number" name="max" defaultValue={params.max ?? ''} placeholder="Max" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', marginBottom: 16, outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />

                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: 'block' }}>Chambres min.</label>
                  <select name="bedrooms" defaultValue={params.bedrooms ?? ''} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', marginBottom: 16, outline: 'none', colorScheme: 'dark' }}>
                    <option value="">Peu importe</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
                  </select>

                  {params.type && <input type="hidden" name="type" value={params.type} />}

                  <button type="submit" style={{ width: '100%', padding: 11, background: '#22d3a5', color: '#0a1a14', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>Appliquer</button>
                  <Link href="/residences" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Réinitialiser</Link>
                </form>
              </details>
            </aside>

            {/* Grille */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {residences && residences.length > 0 ? (
                <>
                  <div className="res-grid">
                    {residences.map(r => (
                      <Link key={r.id} href={`/residences/${r.id}`} style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', display: 'block' }}>
                        <div style={{ aspectRatio: '4/3', background: '#1a2236', overflow: 'hidden', position: 'relative' }}>
                          {r.main_photo ? (
                            <img src={r.main_photo} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'rgba(255,255,255,0.1)' }}>⌂</div>
                          )}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,15,26,0.8) 0%, transparent 50%)' }} />
                          <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(34,211,165,0.15)', color: '#22d3a5', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: '0.5px solid rgba(34,211,165,0.25)', textTransform: 'capitalize' }}>{r.type}</span>
                          <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{r.city}</p>
                          </div>
                        </div>
                        <div style={{ padding: 16 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</p>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>{r.bedrooms} chambre{r.bedrooms > 1 ? 's' : ''} · {r.max_guests} voyageurs max</p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: 15, fontWeight: 700, color: '#22d3a5' }}>
                              {formatPrice(r.price_per_night)}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}> / nuit</span>
                            </p>
                            <span style={{ fontSize: 12, color: '#22d3a5' }}>→</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Link key={p} href={`/residences?${new URLSearchParams({ ...params, page: String(p) })}`} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, fontSize: 13, textDecoration: 'none', background: p === page ? '#22d3a5' : 'rgba(255,255,255,0.05)', color: p === page ? '#0a1a14' : 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.08)', fontWeight: p === page ? 700 : 400 }}>{p}</Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <div style={{ fontSize: 48, color: 'rgba(255,255,255,0.08)', marginBottom: 16 }}>⌂</div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Aucune résidence trouvée</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Essayez de modifier vos filtres</p>
                  <Link href="/residences" style={{ display: 'inline-block', marginTop: 20, fontSize: 13, color: '#22d3a5', textDecoration: 'none' }}>Voir toutes les résidences</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}