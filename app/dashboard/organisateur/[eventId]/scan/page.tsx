import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { formatDate } from '@/lib/utils'

// ✅ Requis pour output: export avec routes dynamiques
export function generateStaticParams() {
  return []
}
export const dynamic = 'force-dynamic'

export default async function OrgaScanPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('id, title, event_date, event_time, venue_name, total_capacity, tickets_sold')
    .eq('id', eventId)
    .eq('owner_id', user.id)
    .single()

  if (!event) notFound()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, bookings(client_name, client_phone, reference)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  const allTickets = tickets ?? []
  const validCount = allTickets.filter((t: any) => t.status === 'valid').length
  const usedCount = allTickets.filter((t: any) => t.status === 'used').length
  const total = allTickets.length

  return (
    <>
      <style>{`
        .scan-wrap { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
        .scan-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .scan-table-wrap { overflow-x: auto; }
        @media (max-width: 767px) {
          .scan-wrap { padding: 20px 16px; }
          .scan-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
        <Navbar />
        <div className="scan-wrap">

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>Contrôle d&apos;accès</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 6 }}>{event.title}</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
              {formatDate(event.event_date)}{event.event_time ? ` à ${event.event_time.slice(0, 5)}` : ''} · {event.venue_name}
            </p>
          </div>

          <div className="scan-stats">
            {[
              { label: 'Total billets', value: total, color: '#fff' },
              { label: 'Valides', value: validCount, color: '#22d3a5', bg: 'rgba(34,211,165,0.06)', border: 'rgba(34,211,165,0.2)' },
              { label: 'Scannés', value: usedCount, color: '#fbbf24', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.2)' },
              { label: 'Taux entrée', value: total > 0 ? `${Math.round(usedCount / total * 100)}%` : '0%', color: '#60a5fa' },
            ].map((s, i) => (
              <div key={i} style={{ background: (s as any).bg ?? '#111827', border: `0.5px solid ${(s as any).border ?? 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: '18px 16px' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: -1 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {total > 0 && (
            <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Entrées validées</span>
                <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>{usedCount} / {total}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#fbbf24', borderRadius: 3, width: `${Math.round(usedCount / total * 100)}%` }} />
              </div>
            </div>
          )}

          <div style={{ background: 'rgba(167,139,250,0.06)', border: '0.5px solid rgba(167,139,250,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Scanner un billet</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Pointez la caméra sur le QR code du client</p>
            </div>
            <a href={`/verify/`} style={{ padding: '10px 20px', background: '#a78bfa', color: '#1a0a3d', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Saisir un code →
            </a>
          </div>

          <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Liste des billets</h2>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 20 }}>{total} billets</span>
            </div>

            {allTickets.length > 0 ? (
              <div className="scan-table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr>
                      {['Code', 'Client', 'Billet', 'Statut', 'Scanné le'].map(h => (
                        <th key={h} style={{ textAlign: 'left', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, padding: '0 16px 12px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allTickets.map((t: any) => {
                      const isValid = t.status === 'valid'
                      const isUsed = t.status === 'used'
                      const sc = isValid ? '#22d3a5' : isUsed ? '#fbbf24' : '#f87171'
                      const booking = t.bookings as any
                      return (
                        <tr key={t.id} style={{ borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 16px 12px 0' }}>
                            <a href={`/verify/${t.ticket_code}`} target="_blank" style={{ fontSize: 11, fontFamily: 'monospace', color: '#60a5fa', textDecoration: 'none' }}>
                              {t.ticket_code}
                            </a>
                          </td>
                          <td style={{ padding: '12px 16px 12px 0', fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                            {booking?.client_name ?? '—'}
                          </td>
                          <td style={{ padding: '12px 16px 12px 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                            {t.ticket_number}
                          </td>
                          <td style={{ padding: '12px 16px 12px 0' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, color: sc, background: `${sc}15`, border: `0.5px solid ${sc}30`, whiteSpace: 'nowrap' }}>
                              {isValid ? 'Valide' : isUsed ? 'Scanné' : 'Annulé'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 0', fontSize: 11, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                            {t.used_at ? new Date(t.used_at).toLocaleString('fr-FR') : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>🎫</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Aucun billet vendu pour l&apos;instant</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}