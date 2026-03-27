// =============================================
// VEHICLE DETAIL PAGE — vehicle/[id]/page.tsx
// =============================================

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import BookingFormVehicle from '@/components/booking/BookingFormVehicle'
import PhotoGallery from '@/components/ui/PhotoGallery'
import { formatPrice } from '@/lib/utils'

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*, profiles(full_name, phone)')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!vehicle) notFound()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_date, end_date')
    .eq('item_id', id)
    .in('status', ['pending', 'confirmed'])

  const bookedDates = bookings?.map(b => ({ start: b.start_date!, end: b.end_date! })) ?? []
  const { data: { user } } = await supabase.auth.getUser()

  const conditions = vehicle.rental_conditions as Record<string, any>
  const accent = '#60a5fa'

  // ✅ Photos corrigées
  const photos: string[] = Array.isArray(vehicle.photos) ? [...vehicle.photos] : []

  if (vehicle.main_photo && !photos.includes(vehicle.main_photo)) {
    photos.unshift(vehicle.main_photo)
  }

  return (
    <>
      <style>{`
        .vd-content { max-width: 1200px; margin: 0 auto; padding: 32px 24px 80px; }
        .vd-grid { display: grid; grid-template-columns: 1fr 360px; gap: 40px; margin-top: 24px; }
        .vd-conditions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .vd-booking { position: sticky; top: 24px; }

        @media (max-width: 767px) {
          .vd-content { padding: 24px 16px; }
          .vd-grid { grid-template-columns: 1fr; gap: 24px; }
          .vd-booking { position: static; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .vd-grid { grid-template-columns: 1fr; }
          .vd-booking { position: static; }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
        <Navbar />

        {/* ✅ GALERIE PHOTO */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 0' }}>
          {photos.length > 0 ? (
            <PhotoGallery
              photos={photos}
              title={`${vehicle.brand} ${vehicle.model}`}
              accent={accent}
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
              <span style={{ fontSize: 48, opacity: 0.2 }}>🚗</span>
            </div>
          )}
        </div>

        <div className="vd-content">
          <div className="vd-grid">

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* Title */}
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                  {vehicle.brand} {vehicle.model}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {vehicle.year} · {vehicle.city}
                </p>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[vehicle.transmission, vehicle.fuel, `${vehicle.seats} places`, ...(vehicle.mileage ? [`${Number(vehicle.mileage).toLocaleString()} km`] : [])].map(label => (
                  <span key={label} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 20, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    {label}
                  </span>
                ))}
              </div>

              {/* Description */}
              {vehicle.description && (
                <div style={{ background: '#111827', borderRadius: 16, padding: 24 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Description</h2>
                  <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>{vehicle.description}</p>
                </div>
              )}

              {/* Conditions */}
              <div style={{ background: '#111827', borderRadius: 16, padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Conditions</h2>
                <div className="vd-conditions">
                  {[
                    { label: 'Âge minimum', value: `${conditions.min_age} ans` },
                    { label: 'Permis', value: `${conditions.min_license_years} an(s)` },
                    { label: 'Caution', value: formatPrice(conditions.deposit) },
                    { label: 'Km/jour', value: `${conditions.max_km_per_day} km` },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12 }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.label}</p>
                      <p style={{ color: '#fff', fontWeight: 600 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Owner */}
              <div style={{ background: '#111827', borderRadius: 16, padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Propriétaire</h2>
                <p style={{ color: '#fff' }}>{(vehicle.profiles as any)?.full_name}</p>
              </div>

            </div>

            {/* RIGHT */}
            <div className="vd-booking">
              <div style={{ background: '#111827', borderRadius: 20, padding: 28 }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>
                  {formatPrice(vehicle.price_per_day)} / jour
                </p>
                <BookingFormVehicle vehicle={vehicle} bookedDates={bookedDates} isLoggedIn={!!user} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}