// =============================================
// VEHICLE DETAIL PAGE — vehicle/[id]/page.tsx
// =============================================

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import BookingFormVehicle from '@/components/booking/BookingFormVehicle'
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
  const conditions = vehicle.rental_conditions as Record<string, unknown>
  const accent = '#60a5fa'
  const photos = vehicle.photos as string[]

  return (
    <>
      <style>{`
        .vd-hero { position: relative; height: 420px; overflow: hidden; }
        .vd-hero-badges { position: absolute; top: 24px; left: 48px; display: flex; gap: 8px; }
        .vd-hero-title { position: absolute; bottom: 40px; left: 48px; right: 48px; }
        .vd-thumbs { max-width: 1200px; margin: 0 auto; padding: 16px 48px 0; display: flex; gap: 8px; }
        .vd-content { max-width: 1200px; margin: 0 auto; padding: 40px 48px; }
        .vd-grid { display: grid; grid-template-columns: 1fr 360px; gap: 40px; align-items: flex-start; }
        .vd-conditions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .vd-booking { position: sticky; top: 24px; }

        @media (max-width: 767px) {
          .vd-hero { height: 56vw; min-height: 200px; }
          .vd-hero-badges { top: 12px; left: 16px; }
          .vd-hero-badges span { font-size: 10px !important; padding: 3px 8px !important; }
          .vd-hero-title { bottom: 16px; left: 16px; right: 16px; }
          .vd-hero-title h1 { font-size: clamp(20px, 6vw, 32px) !important; letter-spacing: -0.5px !important; }
          .vd-thumbs { padding: 12px 16px 0; }
          .vd-content { padding: 24px 16px; }
          .vd-grid { grid-template-columns: 1fr; gap: 24px; }
          .vd-conditions { grid-template-columns: 1fr 1fr; }
          .vd-booking { position: static; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .vd-content { padding: 32px 24px; }
          .vd-hero-badges { left: 24px; }
          .vd-hero-title { left: 24px; right: 24px; }
          .vd-thumbs { padding: 12px 24px 0; }
          .vd-grid { grid-template-columns: 1fr; }
          .vd-booking { position: static; }
        }
      `}</style>

      <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
        <Navbar />

        {/* Hero */}
        {photos.length > 0 ? (
          <div className="vd-hero">
            <img src={photos[0]} alt={vehicle.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,15,26,0.2) 0%, rgba(10,15,26,0.95) 100%)' }} />
            <div className="vd-hero-badges">
              <span style={{ background: 'rgba(96,165,250,0.2)', color: accent, border: '0.5px solid rgba(96,165,250,0.3)', fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20, textTransform: 'uppercase' }}>{vehicle.type}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 20, background: vehicle.is_available ? 'rgba(34,211,165,0.15)' : 'rgba(248,113,113,0.15)', color: vehicle.is_available ? '#22d3a5' : '#f87171', border: `0.5px solid ${vehicle.is_available ? 'rgba(34,211,165,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
                {vehicle.is_available ? 'Disponible' : 'Loué'}
              </span>
            </div>
            <div className="vd-hero-title">
              <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: -1.5, lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.5)', margin: 0 }}>{vehicle.brand} {vehicle.model}</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>{vehicle.year} · {vehicle.city}</p>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 0' }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>{vehicle.brand} {vehicle.model} ({vehicle.year})</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{vehicle.city}</p>
          </div>
        )}

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="vd-thumbs">
            {photos.slice(1, 5).map((p: string, i: number) => (
              <div key={i} style={{ width: 80, height: 56, borderRadius: 10, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}

        <div className="vd-content">
          <div className="vd-grid">

            {/* Gauche */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[vehicle.transmission, vehicle.fuel, `${vehicle.seats} places`, ...(vehicle.mileage ? [`${Number(vehicle.mileage).toLocaleString()} km`] : [])].map(label => (
                  <span key={label} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 20, fontSize: 13, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{label}</span>
                ))}
              </div>

              {/* Description */}
              {vehicle.description && (
                <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Description</h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>{vehicle.description}</p>
                </div>
              )}

              {/* Conditions */}
              <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Conditions de location</h2>
                <div className="vd-conditions">
                  {[
                    { label: 'Âge minimum', value: `${conditions.min_age} ans` },
                    { label: 'Permis minimum', value: `${conditions.min_license_years} an(s)` },
                    { label: 'Caution', value: formatPrice(conditions.deposit as number) },
                    { label: 'Km max / jour', value: `${conditions.max_km_per_day} km` },
                    { label: 'Assurance', value: conditions.insurance_included ? 'Incluse ✓' : 'Non incluse' },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px' }}>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{item.label}</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: item.label === 'Assurance' && conditions.insurance_included ? '#22d3a5' : '#fff' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Propriétaire */}
              <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Proposé par</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(96,165,250,0.15)', border: '0.5px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: accent, flexShrink: 0 }}>
                    {(vehicle.profiles as { full_name: string })?.full_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{(vehicle.profiles as { full_name: string })?.full_name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Loueur vérifié</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Réservation */}
            <div className="vd-booking">
              <div style={{ background: '#111827', border: `0.5px solid rgba(96,165,250,0.2)`, borderRadius: 20, padding: 28 }}>
                <div style={{ marginBottom: 4 }}>
                  <p style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>{formatPrice(vehicle.price_per_day)}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>par jour</p>
                </div>
                <BookingFormVehicle vehicle={vehicle} bookedDates={bookedDates} isLoggedIn={!!user} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}