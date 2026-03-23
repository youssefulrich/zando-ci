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

  return (
    <>
      <style>{`
        .veh-container { max-width: 1200px; margin: 0 auto; padding: 40px 48px; }
        .veh-layout { display: flex; gap: 32px; align-items: flex-start; }
        .veh-sidebar {
          width: 240px; flex-shrink: 0;
          background: #111827; border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 20px;
        }
        .veh-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

        @media (max-width: 767px) {
          .veh-container { padding: 24px 16px; }
          .veh-layout { flex-direction: column; }
          .veh-sidebar { width: 100%; }
          .veh-grid { grid-template-columns: 1fr 1fr; }
          .veh-title { font-size: 26px !important; }
        }

        @media (max-width: 480px) {
          .veh-grid { grid-template-columns: 1fr; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .veh-container { padding: 32px 24px; }
          .veh-sidebar { width: 200px; }
          .veh-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
        <Navbar />
        <div className="veh-container">

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Location</div>
            <h1 className="veh-title" style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>Véhicules disponibles</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{count ?? 0} véhicules en Côte d&apos;Ivoire</p>
          </div>

          {/* Filtres rapides */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
            <Link href="/vehicles" style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: !params.type ? '#60a5fa' : 'rgba(255,255,255,0.05)', color: !params.type ? '#0a1428' : 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.1)' }}>Tous</Link>
            {TYPES.map(t => (
              <Link key={t} href={`/vehicles?type=${t}`} style={{ padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, textDecoration: 'none', textTransform: 'uppercase', background: params.type === t ? '#60a5fa' : 'rgba(255,255,255,0.05)', color: params.type === t ? '#0a1428' : 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.1)' }}>{t}</Link>
            ))}
          </div>

          <div className="veh-layout">
            {/* Sidebar */}
            <aside className="veh-sidebar">
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

                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: 'block' }}>Transmission</label>
                  <select name="transmission" defaultValue={params.transmission ?? ''} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', marginBottom: 16, outline: 'none', colorScheme: 'dark' }}>
                    <option value="">Toutes</option>
                    <option value="automatique">Automatique</option>
                    <option value="manuelle">Manuelle</option>
                  </select>

                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8, display: 'block' }}>Prix / jour (FCFA)</label>
                  <input type="number" name="min" defaultValue={params.min ?? ''} placeholder="Min" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', marginBottom: 8, outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
                  <input type="number" name="max" defaultValue={params.max ?? ''} placeholder="Max" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', marginBottom: 16, outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />

                  {params.type && <input type="hidden" name="type" value={params.type} />}

                  <button type="submit" style={{ width: '100%', padding: 11, background: '#60a5fa', color: '#0a1428', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>Appliquer</button>
                  <Link href="/vehicles" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Réinitialiser</Link>
                </form>
              </details>
            </aside>

            {/* Grille */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {vehicles && vehicles.length > 0 ? (
                <>
                  <div className="veh-grid">
                    {vehicles.map(v => (
                      <Link key={v.id} href={`/vehicles/${v.id}`} style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', display: 'block' }}>
                        <div style={{ aspectRatio: '4/3', background: '#1a2236', overflow: 'hidden', position: 'relative' }}>
                          {v.main_photo ? (
                            <img src={v.main_photo} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'rgba(255,255,255,0.1)' }}>◈</div>
                          )}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,15,26,0.8) 0%, transparent 50%)' }} />
                          <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: '0.5px solid rgba(96,165,250,0.25)', textTransform: 'uppercase' }}>{v.type}</span>
                          <span style={{ position: 'absolute', top: 12, right: 12, background: v.is_available ? 'rgba(34,211,165,0.15)' : 'rgba(239,68,68,0.15)', color: v.is_available ? '#22d3a5' : '#f87171', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: `0.5px solid ${v.is_available ? 'rgba(34,211,165,0.25)' : 'rgba(239,68,68,0.25)'}` }}>{v.is_available ? 'Dispo' : 'Loué'}</span>
                          <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{v.city}</p>
                          </div>
                        </div>
                        <div style={{ padding: 16 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.brand} {v.model}</p>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>{v.year} · {v.transmission} · {v.seats} places</p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ fontSize: 15, fontWeight: 700, color: '#60a5fa' }}>
                              {formatPrice(v.price_per_day)}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}> / jour</span>
                            </p>
                            <span style={{ fontSize: 12, color: '#60a5fa' }}>→</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <Link key={p} href={`/vehicles?${new URLSearchParams({ ...params, page: String(p) })}`} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, fontSize: 13, textDecoration: 'none', background: p === page ? '#60a5fa' : 'rgba(255,255,255,0.05)', color: p === page ? '#0a1428' : 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.08)', fontWeight: p === page ? 700 : 400 }}>{p}</Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <div style={{ fontSize: 48, color: 'rgba(255,255,255,0.08)', marginBottom: 16 }}>◈</div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Aucun véhicule trouvé</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Essayez de modifier vos filtres</p>
                  <Link href="/vehicles" style={{ display: 'inline-block', marginTop: 20, fontSize: 13, color: '#60a5fa', textDecoration: 'none' }}>Voir tous les véhicules</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}