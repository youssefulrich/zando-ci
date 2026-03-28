import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import BookingFormResidence from '@/components/booking/BookingFormResidence'
import PhotoGallery from '@/components/ui/PhotoGallery'
import { formatPrice } from '@/lib/utils'

/* ✅ AJOUT OG (NE CASSE RIEN) */
export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: residence } = await supabase
    .from('residences')
    .select('title, description, photos, main_photo')
    .eq('id', params.id)
    .single()

  if (!residence) {
    return {
      title: 'Résidence',
    }
  }

  const image =
    residence.main_photo ||
    (Array.isArray(residence.photos) ? residence.photos[0] : null)

  return {
    title: residence.title,
    description: residence.description || 'Découvrez cette résidence',
    openGraph: {
      title: residence.title,
      description: residence.description,
      images: image ? [image] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: residence.title,
      description: residence.description,
      images: image ? [image] : [],
    },
  }
}

/* ✅ TON PAGE (quasi inchangée) */
export default async function ResidenceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
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
      `}</style>

      <Navbar />

      <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#e2e8f0' }}>
        
        {photos.length > 0 && (
          <PhotoGallery
            photos={photos}
            title={residence.title}
            accent="#22d3a5"
          />
        )}

        <div className="rd-content">
          <div className="rd-grid">

            <div>
              <div style={{ marginBottom: 32, paddingTop: 16 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700 }}>{residence.title}</h1>
                <p style={{ color: '#64748b' }}>
                  {residence.address && `${residence.address}, `}{residence.city}
                </p>
              </div>

              <div className="rd-stats">
                {[
                  { icon: '🛏️', value: `${residence.bedrooms}`, label: 'Chambres' },
                  { icon: '🚿', value: `${residence.bathrooms}`, label: 'SDB' },
                  { icon: '👥', value: `${residence.max_guests}`, label: 'Personnes max' },
                  { icon: '📐', value: (residence as any).surface ? `${(residence as any).surface}m²` : '—', label: 'Surface' },
                ].map((s, i) => (
                  <div key={i}>
                    <div>{s.icon}</div>
                    <div>{s.value}</div>
                    <div>{s.label}</div>
                  </div>
                ))}
              </div>

              {residence.description && <p>{residence.description}</p>}

              <div>
                <h2>Tarifs</h2>
                <p>{formatPrice(residence.price_per_night)} / nuit</p>
              </div>
            </div>

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