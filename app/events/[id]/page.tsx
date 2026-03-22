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
    .select('*, profiles(full_name, phone)')
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

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero image plein écran */}
      {event.main_photo && (
        <div style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
          <img
            src={event.main_photo}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,15,26,0.2) 0%, rgba(10,15,26,0.95) 100%)' }} />

          {/* Badges sur l'image */}
          <div style={{ position: 'absolute', top: 24, left: 48, display: 'flex', gap: 8 }}>
            <span style={{
              background: 'rgba(167,139,250,0.2)', color: accent,
              border: '0.5px solid rgba(167,139,250,0.3)',
              fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20,
              textTransform: 'capitalize',
            }}>{event.category}</span>
            {isSoldOut && (
              <span style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171', border: '0.5px solid rgba(248,113,113,0.3)', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>Complet</span>
            )}
            {isPast && (
              <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.15)', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>Terminé</span>
            )}
            {!isSoldOut && !isPast && (
              <span style={{ background: 'rgba(34,211,165,0.15)', color: '#22d3a5', border: '0.5px solid rgba(34,211,165,0.25)', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>
                {remaining} billet{remaining > 1 ? 's' : ''} disponible{remaining > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Titre sur l'image */}
          <div style={{ position: 'absolute', bottom: 40, left: 48, right: 48 }}>
            <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: -1.5, lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
              {event.title}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>
              {event.venue_name} · {formatDate(event.event_date)}
            </p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: event.main_photo ? '40px 48px' : '40px 48px' }}>

        {/* Header si pas de photo */}
        {!event.main_photo && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span style={{ background: 'rgba(167,139,250,0.15)', color: accent, border: '0.5px solid rgba(167,139,250,0.25)', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, textTransform: 'capitalize' }}>{event.category}</span>
              {!isSoldOut && !isPast && (
                <span style={{ background: 'rgba(34,211,165,0.1)', color: '#22d3a5', border: '0.5px solid rgba(34,211,165,0.2)', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
                  {remaining} billets disponibles
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 8 }}>{event.title}</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{event.venue_name}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'flex-start' }}>

          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Infos clés */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Date', value: formatDate(event.event_date) },
                { label: 'Heure', value: event.event_time?.slice(0, 5) },
                { label: 'Lieu', value: event.venue_name },
                { label: 'Adresse', value: event.venue_address },
              ].map(info => (
                <div key={info.label} style={{
                  background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '16px 20px',
                }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{info.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{info.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {event.description && (
              <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 14 }}>À propos</h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{event.description}</p>
              </div>
            )}

            {/* Organisateur */}
            <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Organisé par</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(167,139,250,0.15)', border: '0.5px solid rgba(167,139,250,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: accent,
                }}>
                  {(event.profiles as { full_name: string })?.full_name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{(event.profiles as { full_name: string })?.full_name}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Organisateur vérifié</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite — Réservation sticky */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{
              background: '#111827', border: '0.5px solid rgba(167,139,250,0.2)',
              borderRadius: 20, padding: 28, overflow: 'hidden',
            }}>
              {/* Prix */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>
                  {event.price_per_ticket === 0 ? 'Gratuit' : formatPrice(event.price_per_ticket)}
                </p>
                {event.price_per_ticket > 0 && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>par billet</p>
                )}
              </div>

              {/* Stock */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {remaining} / {event.total_capacity} billets restants
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: fillRate >= 90 ? '#f87171' : fillRate >= 60 ? '#fbbf24' : '#22d3a5',
                  }}>{fillRate}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: fillRate >= 90 ? '#f87171' : fillRate >= 60 ? '#fbbf24' : accent,
                    width: `${fillRate}%`, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Formulaire */}
              <BookingFormEvent
                event={event}
                remaining={remaining}
                isLoggedIn={!!user}
                isPast={isPast}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}