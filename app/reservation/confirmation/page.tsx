'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

function formatPhone(phone: string): string {
  let p = phone.replace(/\s/g, '').replace(/[^0-9+]/g, '')
  if (p.startsWith('0')) p = '225' + p.slice(1)
  if (p.startsWith('+')) p = p.slice(1)
  if (!p.startsWith('225')) p = '225' + p
  return p
}

function ConfirmationContent() {
  const searchParams = useSearchParams()

  const ref = searchParams.get('ref') ?? ''
  const type = searchParams.get('type') ?? 'residence'
  const ownerPhone = searchParams.get('owner_phone') ?? ''
  const ownerName = searchParams.get('owner_name') ?? 'Le propriétaire'
  const itemName = searchParams.get('item_name') ?? ''
  const startDate = searchParams.get('start_date') ?? ''
  const endDate = searchParams.get('end_date') ?? ''

  const emoji = type === 'vehicle' ? '🚗' : '🏠'
  const typeLabel = type === 'vehicle' ? 'location' : 'réservation'

  const whatsappMessage = encodeURIComponent(
    `Bonjour ${ownerName}, je viens d'envoyer une demande de ${typeLabel} pour "${itemName}"` +
    (startDate ? ` du ${startDate} au ${endDate}` : '') +
    `. Ma référence est ${ref}. Pouvez-vous me confirmer la disponibilité ?`
  )

  const whatsappUrl = ownerPhone
    ? `https://wa.me/${formatPhone(ownerPhone)}?text=${whatsappMessage}`
    : null

  const callUrl = ownerPhone ? `tel:+${formatPhone(ownerPhone)}` : null

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{
        minHeight: '85vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px 20px',
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Icône succès */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(34,211,165,0.1)', border: '0.5px solid rgba(34,211,165,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 32,
            }}>
              ✓
            </div>
            <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 10 }}>
              Demande envoyée
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 10 }}>
              {emoji} Demande enregistrée !
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
              Votre demande a bien été reçue. Contactez maintenant le propriétaire pour finaliser votre {typeLabel}.
            </p>
          </div>

          {/* Référence */}
          {ref && (
            <div style={{
              background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '14px 20px', marginBottom: 20, textAlign: 'center',
            }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Référence</p>
              <p style={{ fontSize: 15, fontFamily: 'monospace', fontWeight: 700, color: '#22d3a5' }}>{ref}</p>
            </div>
          )}

          {/* Card propriétaire */}
          <div style={{
            background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 24, marginBottom: 16,
          }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              Contacter le propriétaire
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(34,211,165,0.1)', border: '0.5px solid rgba(34,211,165,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                👤
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{ownerName}</p>
                {ownerPhone && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    +{formatPhone(ownerPhone)}
                  </p>
                )}
              </div>
            </div>

            {/* Boutons contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* WhatsApp */}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '14px', borderRadius: 12,
                    background: '#25D366', border: 'none',
                    color: '#fff', fontSize: 15, fontWeight: 700,
                    textDecoration: 'none', transition: 'opacity 0.15s',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Contacter sur WhatsApp
                </a>
              )}

              {/* Appel téléphonique */}
              {callUrl && (
                <a
                  href={callUrl}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 15, fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  📞 Appeler directement
                </a>
              )}

              {!ownerPhone && (
                <div style={{
                  padding: '14px', borderRadius: 12,
                  background: 'rgba(251,191,36,0.08)', border: '0.5px solid rgba(251,191,36,0.2)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 13, color: '#fbbf24' }}>
                    ⚠️ Le propriétaire vous contactera sous 24h
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{
            background: 'rgba(34,211,165,0.05)', border: '0.5px solid rgba(34,211,165,0.15)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 20,
          }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>
              💡 Le message WhatsApp est pré-rempli avec votre référence et les dates. Le paiement se fait directement avec le propriétaire (cash, Orange Money, Wave, MTN...).
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/dashboard/reservations" style={{
              display: 'block', padding: '14px', background: '#22d3a5',
              color: '#0a1a14', borderRadius: 12, fontSize: 14, fontWeight: 700,
              textDecoration: 'none', textAlign: 'center',
            }}>
              Voir mes réservations
            </Link>
            <Link href="/" style={{
              display: 'block', padding: '13px',
              background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)', borderRadius: 12, fontSize: 14,
              textDecoration: 'none', textAlign: 'center',
            }}>
              Retour à l'accueil
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function ReservationConfirmationPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Chargement...</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}