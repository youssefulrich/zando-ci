'use client'

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

  // ✅ Photos (avec main_photo en premier)
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
        .rd-content { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
        .rd-grid { display: grid; grid-template-columns: 1fr 380px; gap: 48px; margin-top: 24px; }
        .rd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
        .rd-booking { position: sticky; top: 24px; align-self: start; }

        @media (max-width: 767px) {
          .rd-content { padding: 20px 16px 60px; }
          .rd-grid { grid-template-columns: 1fr; gap: 24px; }
          .rd-stats { grid-template-columns: repeat(2, 1fr); }
          .rd-booking { position: static; }
          .rd-title { font-size: clamp(22px, 6vw, 32px) !important; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .rd-grid { grid-template-columns: 1fr; }
          .rd-booking { position: static; }
        }
      `}</style>

      <Navbar />

      <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#e2e8f0' }}>

        {/* ✅ GALERIE PHOTO */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 0' }}>
          {photos.length > 0 ? (
            <PhotoGallery
              photos={photos}
              title={residence.title}
              accent="#22d3a5"
            />
          ) : (
            <div
              style={{
                height: 320,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #0d1f2d, #1a2a3a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: 48, opacity: 0.2 }}>⌂</span>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="rd-content">
          <div className="rd-grid">

            {/* LEFT */}
            <div>

              {/* Title */}
              <div style={{ marginBottom: 32 }}>
                <h1 className="rd-title" style={{ fontSize: 32, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
                  {residence.title}
                </h1>
                <p style={{ color: '#64748b', fontSize: 14 }}>
                  {residence.address && `${residence.address}, `}{residence.city}
                </p>
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
                    <div style={{ fontSize: 22 }}>{s.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#22d3a5' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {residence.description && (
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 12 }}>Description</h2>
                  <p style={{ color: '#94a3b8', lineHeight: 1.8 }}>{residence.description}</p>
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 12 }}>Équipements</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {amenities.map((a) => (
                      <span key={a} style={{ background: 'rgba(34,211,165,0.1)', padding: '6px 12px', borderRadius: 8 }}>
                        {AMENITY_ICONS[a] ?? '✓'} {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 12 }}>Tarifs</h2>
                <div style={{ padding: 16, borderRadius: 12, background: '#111827' }}>
                  {formatPrice(residence.price_per_night)} / nuit
                </div>
              </div>

              {/* Owner */}
              <div>
                <h2 style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 12 }}>Propriétaire</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#22d3a5' }} />
                  <div>
                    <p>{(residence.profiles as any)?.full_name}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>
                      📍 {(residence.profiles as any)?.city}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT - BOOKING */}
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