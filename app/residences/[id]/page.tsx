import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import BookingFormResidence from '@/components/booking/BookingFormResidence'
import PhotoGallery from '@/components/ui/PhotoGallery'
import { formatPrice } from '@/lib/utils'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: r } = await supabase
    .from('residences')
    .select('title, description, main_photo, photos, city, price_per_night')
    .eq('id', id)
    .single()

  if (!r) return {}

  const photos: string[] = Array.isArray(r.photos) ? r.photos : []
  const image = r.main_photo ?? photos[0] ?? null

  return {
    title: `${r.title} — ${formatPrice(r.price_per_night)}/nuit | Zando CI`,
    description: r.description ?? `Résidence à ${r.city} disponible sur Zando CI`,
    openGraph: {
      title: `${r.title} | ${r.city}`,
      description: r.description ?? `À partir de ${formatPrice(r.price_per_night)} / nuit`,
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
      type: 'website',
    },
  }
}

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

  const ownerName = (residence.profiles as any)?.full_name ?? ''
  const ownerCity = (residence.profiles as any)?.city ?? ''

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:      #0E0E12;
          --bg2:     #16161C;
          --bg3:     #1E1E26;
          --card:    #1A1A22;
          --border:  rgba(255,255,255,0.07);
          --teal:    #22D3A5;
          --text:    #F0F0F0;
          --muted:   #888;
          --muted2:  #444;
        }

        .rd { background: var(--bg); min-height: 100vh; color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; }

        /* ── BREADCRUMB ── */
        .rd-bc {
          max-width: 1200px; margin: 0 auto;
          padding: 14px 24px; display: flex; align-items: center; gap: 6px;
          border-bottom: 1px solid var(--border);
        }
        .rd-bc-link { font-size: 12px; color: var(--muted); text-decoration: none; }
        .rd-bc-link:hover { color: var(--teal); }
        .rd-bc-sep { font-size: 12px; color: var(--muted2); }
        .rd-bc-cur { font-size: 12px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }

        /* ── MAIN LAYOUT ── */
        .rd-content { max-width: 1200px; margin: 0 auto; padding: 32px 24px 100px; }
        .rd-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 40px;
          align-items: flex-start;
        }

        /* ── LEFT COLUMN ── */
        .rd-left {}

        /* Header */
        .rd-header { margin-bottom: 28px; }
        .rd-type-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; color: var(--teal);
          text-transform: uppercase; letter-spacing: 0.12em;
          background: rgba(34,211,165,0.08); border: 1px solid rgba(34,211,165,0.2);
          padding: 3px 10px; border-radius: 20px; margin-bottom: 12px;
        }
        .rd-title { font-size: clamp(22px, 3vw, 30px); font-weight: 900; color: var(--text); letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 8px; }
        .rd-location { font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 5px; }

        /* Stats strip */
        .rd-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 10px; margin-bottom: 32px;
        }
        .rd-stat {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px 10px; text-align: center;
          transition: border-color 0.2s;
        }
        .rd-stat:hover { border-color: rgba(34,211,165,0.25); }
        .rd-stat-ico   { font-size: 22px; margin-bottom: 6px; line-height: 1; }
        .rd-stat-val   { font-size: 18px; font-weight: 900; color: var(--teal); line-height: 1; }
        .rd-stat-label { font-size: 11px; color: var(--muted); margin-top: 4px; }

        /* Sections */
        .rd-section { margin-bottom: 32px; }
        .rd-section-title {
          font-size: 11px; font-weight: 700; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.12em;
          margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
        }
        .rd-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        /* Description */
        .rd-desc { font-size: 14px; color: var(--muted); line-height: 1.8; }

        /* Équipements */
        .rd-amenities { display: flex; flex-wrap: wrap; gap: 8px; }
        .rd-amenity {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(34,211,165,0.06); border: 1px solid rgba(34,211,165,0.18);
          color: var(--teal); padding: 7px 14px; border-radius: 8px; font-size: 13px;
          transition: background 0.15s;
        }
        .rd-amenity:hover { background: rgba(34,211,165,0.12); }

        /* Tarifs */
        .rd-price-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden;
        }
        .rd-price-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 18px; border-bottom: 1px solid var(--border);
        }
        .rd-price-row:last-child { border-bottom: none; }
        .rd-price-label { font-size: 13px; color: var(--muted); }
        .rd-price-val   { font-size: 18px; font-weight: 900; color: var(--teal); }

        /* Propriétaire */
        .rd-owner-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: 12px; padding: 18px;
          display: flex; align-items: center; gap: 14px;
          transition: border-color 0.2s;
        }
        .rd-owner-card:hover { border-color: rgba(34,211,165,0.25); }
        .rd-owner-avatar {
          width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, #22D3A5, #0891b2);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 900; color: #0a0f1a;
        }
        .rd-owner-name { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
        .rd-owner-city { font-size: 12px; color: var(--muted); }
        .rd-owner-badge {
          margin-left: auto; padding: 4px 10px; border-radius: 20px;
          font-size: 10px; font-weight: 700;
          background: rgba(34,211,165,0.08); border: 1px solid rgba(34,211,165,0.2);
          color: var(--teal);
        }

        /* ── RIGHT COLUMN (booking) ── */
        .rd-booking-col { position: sticky; top: 24px; }

        /* ── BOTTOM BAR mobile ── */
        .rd-bottom-bar {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--bg2); border-top: 1px solid var(--border);
          padding: 10px 16px; display: none;
          align-items: center; justify-content: space-between; gap: 12px;
          z-index: 50;
        }
        .rd-bottom-price { font-size: 18px; font-weight: 900; color: var(--teal); }
        .rd-bottom-price small { display: block; font-size: 11px; color: var(--muted); font-weight: 400; }
        .rd-bottom-btn {
          padding: 13px 28px; background: var(--teal); color: #0E0E12;
          border: none; border-radius: 10px; font-size: 14px; font-weight: 800;
          cursor: pointer; white-space: nowrap;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 767px) {
          .rd-bc { padding: 12px 16px; }
          .rd-content { padding: 20px 16px 90px; }
          .rd-grid { grid-template-columns: 1fr; gap: 24px; }
          .rd-stats { grid-template-columns: repeat(2, 1fr); }
          .rd-booking-col { position: static; }
          .rd-bottom-bar { display: flex; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .rd-grid { grid-template-columns: 1fr; }
          .rd-booking-col { position: static; }
        }
      `}</style>

      <div className="rd">
        <Navbar />

        {/* ── GALERIE ── */}
        {photos.length > 0 && (
          <PhotoGallery photos={photos} title={residence.title} accent="#22d3a5" />
        )}

        {/* ── BREADCRUMB ── */}
        <div className="rd-bc">
          <a href="/residences" className="rd-bc-link">Résidences</a>
          <span className="rd-bc-sep">›</span>
          <a href={`/residences?city=${residence.city}`} className="rd-bc-link">{residence.city}</a>
          <span className="rd-bc-sep">›</span>
          <span className="rd-bc-cur">{residence.title}</span>
        </div>

        <div className="rd-content">
          <div className="rd-grid">

            {/* ── COLONNE GAUCHE ── */}
            <div className="rd-left">

              {/* Header */}
              <div className="rd-header">
                <div className="rd-type-badge">🏡 {residence.type ?? 'Résidence'}</div>
                <h1 className="rd-title">{residence.title}</h1>
                <div className="rd-location">
                  <span>📍</span>
                  {residence.address && `${residence.address}, `}{residence.city}
                </div>
              </div>

              {/* Stats */}
              <div className="rd-stats">
                {[
                  { icon: '🛏️', value: String(residence.bedrooms),  label: 'Chambres' },
                  { icon: '🚿', value: String(residence.bathrooms), label: 'Salles de bain' },
                  { icon: '👥', value: String(residence.max_guests), label: 'Personnes max' },
                  { icon: '📐', value: (residence as any).surface ? `${(residence as any).surface}m²` : '—', label: 'Surface' },
                ].map((s, i) => (
                  <div key={i} className="rd-stat">
                    <div className="rd-stat-ico">{s.icon}</div>
                    <div className="rd-stat-val">{s.value}</div>
                    <div className="rd-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {residence.description && (
                <div className="rd-section">
                  <div className="rd-section-title">Description</div>
                  <p className="rd-desc">{residence.description}</p>
                </div>
              )}

              {/* Équipements */}
              {amenities.length > 0 && (
                <div className="rd-section">
                  <div className="rd-section-title">Équipements</div>
                  <div className="rd-amenities">
                    {amenities.map(a => (
                      <span key={a} className="rd-amenity">
                        {AMENITY_ICONS[a] ?? '✓'} {a.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarifs */}
              <div className="rd-section">
                <div className="rd-section-title">Tarifs</div>
                <div className="rd-price-card">
                  <div className="rd-price-row">
                    <span className="rd-price-label">Prix par nuit</span>
                    <span className="rd-price-val">{formatPrice(residence.price_per_night)}</span>
                  </div>
                  {(residence as any).price_per_week && (
                    <div className="rd-price-row">
                      <span className="rd-price-label">Prix par semaine</span>
                      <span className="rd-price-val">{formatPrice((residence as any).price_per_week)}</span>
                    </div>
                  )}
                  {(residence as any).price_per_month && (
                    <div className="rd-price-row">
                      <span className="rd-price-label">Prix par mois</span>
                      <span className="rd-price-val">{formatPrice((residence as any).price_per_month)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Propriétaire */}
              {ownerName && (
                <div className="rd-section">
                  <div className="rd-section-title">Propriétaire</div>
                  <div className="rd-owner-card">
                    <div className="rd-owner-avatar">
                      {ownerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="rd-owner-name">{ownerName}</div>
                      {ownerCity && <div className="rd-owner-city">📍 {ownerCity}</div>}
                    </div>
                    <span className="rd-owner-badge">✓ Vérifié</span>
                  </div>
                </div>
              )}

            </div>

            {/* ── COLONNE DROITE (réservation) ── */}
            <div className="rd-booking-col">
              <BookingFormResidence
                residenceId={residence.id}
                pricePerNight={residence.price_per_night}
                maxGuests={residence.max_guests}
              />
            </div>

          </div>
        </div>

        {/* ── BOTTOM BAR mobile ── */}
        <div className="rd-bottom-bar">
          <div className="rd-bottom-price">
            {formatPrice(residence.price_per_night)}
            <small>par nuit</small>
          </div>
          <button className="rd-bottom-btn">Réserver →</button>
        </div>
      </div>
    </>
  )
}