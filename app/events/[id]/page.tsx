import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import BookingFormEvent from '@/components/booking/BookingFormEvent'
import { formatPrice, formatDate } from '@/lib/utils'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*, profiles(full_name, phone, orange_money, wave, mtn_money)')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!event) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const remaining = event.total_capacity - event.tickets_sold
  const isSoldOut = remaining <= 0
  const isPast = new Date(event.event_date) < new Date()
  const fillRate = Math.min(100, Math.round((event.tickets_sold / event.total_capacity) * 100))
  const accent = '#a78bfa'

  const profiles = event.profiles as any
  // Récupère le premier numéro disponible comme WhatsApp
  const organizerPhone = profiles?.phone || profiles?.orange_money || profiles?.wave || profiles?.mtn_money || null

  return (
    <>
      <style>{`
        .ed-hero { position: relative; height: 420px; overflow: hidden; }
        .ed-hero-badges { position: absolute; top: 24px; left: 48px; display: flex; gap: 8px; flex-wrap: wrap; }
        .ed-hero-bottom { position: absolute; bottom: 40px; left: 48px; right: 48px; }
        .ed-content { max-width: 1200px; margin: 0 auto; padding: 40px 48px; }
        .ed-grid { display: grid; grid-template-columns: 1fr 360px; gap: 40px; align-items: flex-start; }
        .ed-infos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 32px; }
        .ed-booking { position: sticky; top: 24px; }

        @media (max-width: 767px) {
          .ed-hero { height: 56vw; min-height: 200px; }
          .ed-hero-badges { top: 12px; left: 16px; }
          .ed-hero-badges span { font-size: 10px !important; padding: 3px 8px !important; }
          .ed-hero-bottom { bottom: 16px; left: 16px; right: 16px; }
          .ed-hero-bottom h1 { font-size: clamp(18px, 5.5vw, 30px) !important; letter-spacing: -0.5px !important; }
          .ed-content { padding: 24px 16px; }
          .ed-grid { grid-template-columns: 1fr; gap: 24px; }
          .ed-infos { grid-template-columns: 1fr 1fr; }
          .ed-booking { position: static; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .ed-content { padding: 32px 24px; }
          .ed-grid { grid-template-columns: 1fr; }
          .ed-booking { position: static; }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
        <Navbar />

        {/* Hero */}
        {event.main_photo && (
          <div className="ed-hero">
            <img src={event.main_photo} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,15,26,0.2) 0%, rgba(10,15,26,0.95) 100%)' }} />

            <div className="ed-hero-badges">
              <span style={{ background: 'rgba(167,139,250,0.2)', color: accent, border: '0.5px solid rgba(167,139,250,0.3)', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20, textTransform: 'capitalize' }}>{event.category}</span>
              {isSoldOut && <span style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.3)', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>Complet</span>}
              {isPast && <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.15)', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>Terminé</span>}
              {!isSoldOut && !isPast && <span style={{ background: 'rgba(34,211,165,0.15)', color: '#22d3a5', border: '0.5px solid rgba(34,211,165,0.25)', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>{remaining} billet{remaining > 1 ? 's' : ''} disponible{remaining > 1 ? 's' : ''}</span>}
            </div>

            <div className="ed-hero-bottom">
              <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: -1.5, lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.5)', margin: 0 }}>{event.title}</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>{event.venue_name} · {formatDate(event.event_date)}</p>
            </div>
          </div>
        )}

        <div className="ed-content">

          {!event.main_photo && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(167,139,250,0.15)', color: accent, border: '0.5px solid rgba(167,139,250,0.25)', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, textTransform: 'capitalize' }}>{event.category}</span>
                {!isSoldOut && !isPast && <span style={{ background: 'rgba(34,211,165,0.1)', color: '#22d3a5', border: '0.5px solid rgba(34,211,165,0.2)', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>{remaining} billets disponibles</span>}
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 8 }}>{event.title}</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{event.venue_name}</p>
            </div>
          )}

          <div className="ed-grid">

            {/* Gauche */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

              <div className="ed-infos">
                {[
                  { label: 'Date', value: formatDate(event.event_date) },
                  { label: 'Heure', value: event.event_time?.slice(0, 5) },
                  { label: 'Lieu', value: event.venue_name },
                  { label: 'Adresse', value: event.venue_address },
                ].map(info => (
                  <div key={info.label} style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px' }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{info.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{info.value}</p>
                  </div>
                ))}
              </div>

              {event.description && (
                <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 14 }}>À propos</h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{event.description}</p>
                </div>
              )}

              {/* Organisateur */}
              <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Organisé par</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: organizerPhone ? 16 : 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(167,139,250,0.15)', border: '0.5px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: accent, flexShrink: 0 }}>
                    {profiles?.full_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{profiles?.full_name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Organisateur vérifié</p>
                  </div>
                </div>
                {organizerPhone && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <a href={`https://wa.me/${organizerPhone.replace(/\D/g, '')}`} target="_blank" style={{ flex: 1, padding: '10px', background: 'rgba(37,211,102,0.1)', border: '0.5px solid rgba(37,211,102,0.2)', borderRadius: 10, fontSize: 13, color: '#25d366', textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>
                      WhatsApp
                    </a>
                    <a href={`tel:${organizerPhone}`} style={{ flex: 1, padding: '10px', background: 'rgba(96,165,250,0.1)', border: '0.5px solid rgba(96,165,250,0.2)', borderRadius: 10, fontSize: 13, color: '#60a5fa', textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>
                      Appeler
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Réservation */}
            <div className="ed-booking">
              <div style={{ background: '#111827', border: '0.5px solid rgba(167,139,250,0.2)', borderRadius: 20, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>
                    {event.price_per_ticket === 0 ? 'Gratuit' : formatPrice(event.price_per_ticket)}
                  </p>
                  {event.price_per_ticket > 0 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>par billet</p>}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{remaining} / {event.total_capacity} billets restants</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: fillRate >= 90 ? '#f87171' : fillRate >= 60 ? '#fbbf24' : '#22d3a5' }}>{fillRate}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: fillRate >= 90 ? '#f87171' : fillRate >= 60 ? '#fbbf24' : accent, width: `${fillRate}%` }} />
                  </div>
                </div>

                <BookingFormEvent
                  event={event}
                  remaining={remaining}
                  isLoggedIn={!!user}
                  isPast={isPast}
                  organizerPhone={organizerPhone}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}