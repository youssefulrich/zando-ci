import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import BookingFormResidence from '@/components/booking/BookingFormResidence'
import { formatPrice } from '@/lib/utils'

export default async function ResidenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: residence } = await supabase
    .from('residences')
    .select('*, profiles(full_name, phone, city)')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!residence) notFound()

  const photos: string[] = Array.isArray(residence.photos) ? residence.photos : []
  const amenities: string[] = Array.isArray(residence.amenities) ? residence.amenities : []

  const AMENITY_ICONS: Record<string, string> = {
    wifi: '📶', piscine: '🏊', parking: '🅿️', climatisation: '❄️',
    cuisine: '🍳', tv: '📺', lave_linge: '🫧', sécurité: '🔒',
    gardien: '💂', générateur: '⚡', eau_chaude: '🚿', balcon: '🌿',
  }

  const TYPE_LABELS: Record<string, string> = {
    apartment: 'Appartement', villa: 'Villa', studio: 'Studio',
    house: 'Maison', room: 'Chambre',
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#e2e8f0' }}>

        {/* Hero Gallery */}
        <div style={{ position: 'relative', height: '70vh', overflow: 'hidden' }}>
          {photos[0] ? (
            <img
              src={photos[0]}
              alt={residence.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0d1f2d 0%, #1a2a3a 100%)' }} />
          )}

          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, #0a0f1a 0%, rgba(10,15,26,0.5) 50%, transparent 100%)'
          }} />

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 24, left: 24,
              display: 'flex', gap: 8
            }}>
              {photos.slice(1, 5).map((p, i) => (
                <div key={i} style={{
                  width: 72, height: 52, borderRadius: 8, overflow: 'hidden',
                  border: '2px solid rgba(34,211,165,0.4)'
                }}>
                  <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              {photos.length > 5 && (
                <div style={{
                  width: 72, height: 52, borderRadius: 8,
                  background: 'rgba(34,211,165,0.15)', border: '2px solid rgba(34,211,165,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#22d3a5', fontWeight: 600
                }}>
                  +{photos.length - 5}
                </div>
              )}
            </div>
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', gap: 8 }}>
            <span style={{
              background: 'rgba(34,211,165,0.2)', border: '1px solid rgba(34,211,165,0.4)',
              color: '#22d3a5', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600
            }}>
              {TYPE_LABELS[residence.type] ?? residence.type}
            </span>
            <span style={{
              background: 'rgba(10,15,26,0.7)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', padding: '4px 12px', borderRadius: 20, fontSize: 12
            }}>
              📍 {residence.city}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, marginTop: -60, position: 'relative', zIndex: 10 }}>

            {/* Left — Details */}
            <div>
              {/* Title */}
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 8 }}>
                  {residence.title}
                </h1>
                <p style={{ color: '#64748b', fontSize: 14 }}>
                  {residence.address && `${residence.address}, `}{residence.city}
                </p>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32
              }}>
                {[
                  { icon: '🛏️', value: `${residence.bedrooms}`, label: 'Chambres' },
                  { icon: '🚿', value: `${residence.bathrooms}`, label: 'SDB' },
                  { icon: '👥', value: `${residence.max_guests}`, label: 'Personnes max' },
                  { icon: '📐', value: (residence as any).surface ? `${(residence as any).surface}m²` : '—', label: 'Surface' },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: '16px 12px', textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#22d3a5' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {residence.description && (
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: '#cbd5e1', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Description
                  </h2>
                  <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: 15 }}>
                    {residence.description}
                  </p>
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Équipements
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {amenities.map((a) => (
                      <span key={a} style={{
                        background: 'rgba(34,211,165,0.08)', border: '1px solid rgba(34,211,165,0.2)',
                        color: '#22d3a5', padding: '6px 14px', borderRadius: 8, fontSize: 13,
                        display: 'flex', alignItems: 'center', gap: 6
                      }}>
                        <span>{AMENITY_ICONS[a] ?? '✓'}</span> {a.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing breakdown */}
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Tarifs
                </h2>
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, overflow: 'hidden'
                }}>
                  {[
                    { label: 'Prix par nuit', value: formatPrice(residence.price_per_night), accent: true },
                    ...(residence.price_per_week ? [{ label: 'Prix par semaine', value: formatPrice(residence.price_per_week), accent: false }] : []),
                    ...(residence.price_per_month ? [{ label: 'Prix par mois', value: formatPrice(residence.price_per_month), accent: false }] : []),
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 20px',
                      borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                    }}>
                      <span style={{ color: '#64748b', fontSize: 14 }}>{row.label}</span>
                      <span style={{ color: row.accent ? '#22d3a5' : '#e2e8f0', fontWeight: 600, fontSize: row.accent ? 18 : 14 }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Host */}
              <div>
                <h2 style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Propriétaire
                </h2>
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: '20px', display: 'flex', alignItems: 'center', gap: 16
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #22d3a5, #0891b2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 700, color: '#0a0f1a', flexShrink: 0
                  }}>
                    {(residence.profiles as { full_name: string })?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 2 }}>
                      {(residence.profiles as { full_name: string })?.full_name}
                    </p>
                    <p style={{ color: '#64748b', fontSize: 13 }}>
                      📍 {(residence.profiles as { city: string })?.city}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Booking Form */}
            <div style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
              <BookingFormResidence
                residenceId={residence.id}
                pricePerNight={residence.price_per_night}
                pricePerWeek={residence.price_per_week}
                pricePerMonth={residence.price_per_month}
                maxGuests={residence.max_guests}
              />
            </div>

          </div>
        </div>
      </div>
    </>
  )
}