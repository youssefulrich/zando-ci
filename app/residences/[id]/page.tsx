import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import BookingFormResidence from '@/components/booking/BookingFormResidence'
import PhotoGallery from '@/components/ui/PhotoGallery'
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

  const photos: string[] = Array.isArray(residence.photos) ? [...residence.photos] : []
  if (residence.main_photo && !photos.includes(residence.main_photo)) {
    photos.unshift(residence.main_photo)
  }

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
      <style>{`
        .rd-content { max-width: 1200px; margin: 0 auto; padding: 0 24px 80px; }
        .rd-grid { display: grid; grid-template-columns: 1fr 380px; gap: 48px; margin-top: -60px; position: relative; z-index: 10; }
        .rd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
        .rd-booking { position: sticky; top: 24px; align-self: start; }

        @media (max-width: 767px) {
          .rd-content { padding: 0 16px 60px; }
          .rd-grid { grid-template-columns: 1fr; margin-top: 0; gap: 24px; }
          .rd-stats { grid-template-columns: repeat(2, 1fr); }
          .rd-booking { position: static; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .rd-grid { grid-template-columns: 1fr; }
          .rd-booking { position: static; }
        }
      `}</style>

      <Navbar />

      <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#e2e8f0' }}>
        
        {/* Photo Gallery */}
        {photos.length > 0 && (
          <PhotoGallery
            photos={photos}
            title={residence.title}
            accent="#22d3a5"
          />
        )}

        {/* Content */}
        <div className="rd-content">
          <div className="rd-grid">

            {/* Left */}
            <div>
              {/* Title */}
              <div style={{ marginBottom: 32, paddingTop: 16 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 8 }}>{residence.title}</h1>
                <p style={{ color: '#64748b', fontSize: 14 }}>{residence.address && `${residence.address}, `}{residence.city}</p>
              </div>

              {/* Stats */}
              <div className="rd-stats">
                {[
                  { icon: '🛏️', value: `${residence.bedrooms}`, label: 'Chambres' },
                  { icon: '🚿', value: `${residence.bathrooms}`, label: 'SDB' },
                  { icon: '👥', value: `${residence.max_guests}`, label: 'Personnes max' },
                  { icon: '📐', value: (residence as any).surface ? `${(residence as any).surface}m²` : '—', label: 'Surface' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#22d3a5' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {residence.description && (
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</h2>
                  <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: 15 }}>{residence.description}</p>
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Équipements</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {amenities.map((a) => (
                      <span key={a} style={{ background: 'rgba(34,211,165,0.08)', border: '1px solid rgba(34,211,165,0.2)', color: '#22d3a5', padding: '6px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{AMENITY_ICONS[a] ?? '✓'}</span> {a.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tarifs</h2>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
                    <span style={{ color: '#64748b', fontSize: 14 }}>Prix par nuit</span>
                    <span style={{ color: '#22d3a5', fontWeight: 600, fontSize: 18 }}>{formatPrice(residence.price_per_night)}</span>
                  </div>
                </div>
              </div>

              {/* Host */}
              <div>
                <h2 style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Propriétaire</h2>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #22d3a5, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#0a0f1a', flexShrink: 0 }}>
                    {(residence.profiles as { full_name: string })?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 2 }}>{(residence.profiles as { full_name: string })?.full_name}</p>
                    <p style={{ color: '#64748b', fontSize: 13 }}>📍 {(residence.profiles as { city: string })?.city}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking */}
            <div className="rd-booking">
              <BookingFormResidence
                residenceId={residence.id}
                pricePerNight={residence.price_per_night}
                maxGuests={residence.max_guests}
              />
            </div>

          </div>
        </div>
      </div>
    </>
  )
}