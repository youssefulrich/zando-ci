'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { formatPrice } from '@/lib/utils'

function EventConfirmationContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') ?? ''
  const waUrl = decodeURIComponent(searchParams.get('wa') ?? '')
  const total = Number(searchParams.get('total') ?? 0)
  const qty = Number(searchParams.get('qty') ?? 1)

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 20px 80px' }}>

        {/* Icône succès */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(167,139,250,0.1)', border: '0.5px solid rgba(167,139,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 36,
          }}>🎟️</div>
          <div style={{ fontSize: 11, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 10 }}>
            Réservation enregistrée
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 10 }}>
            Réservation envoyée !
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
            Votre demande a bien été prise en compte. Contactez l'organisateur sur WhatsApp pour finaliser le paiement.
          </p>
        </div>

        {/* Récapitulatif */}
        <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Récapitulatif</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ref && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Référence</span>
                <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#a78bfa' }}>{ref}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Billets</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{qty} billet{qty > 1 ? 's' : ''}</span>
            </div>
            <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>{formatPrice(total)} FCFA</span>
            </div>
          </div>
        </div>

        {/* Contact organisateur */}
        <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Contacter l'organisateur
          </p>

          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '14px', borderRadius: 12,
                background: '#25D366', color: '#fff',
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Confirmer sur WhatsApp
            </a>
          ) : (
            <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(251,191,36,0.08)', border: '0.5px solid rgba(251,191,36,0.2)', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#fbbf24' }}>⚠️ L'organisateur vous contactera sous peu</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ background: 'rgba(167,139,250,0.05)', border: '0.5px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            💡 Le message WhatsApp contient votre référence et le nombre de billets. Le paiement se règle directement avec l'organisateur.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/events" style={{
            display: 'block', padding: '14px', background: '#a78bfa',
            color: '#1a0a3d', borderRadius: 12, fontSize: 14, fontWeight: 700,
            textDecoration: 'none', textAlign: 'center',
          }}>
            Voir d'autres événements
          </Link>
          <Link href="/dashboard" style={{
            display: 'block', padding: '13px',
            background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', borderRadius: 12, fontSize: 14,
            textDecoration: 'none', textAlign: 'center',
          }}>
            Mon dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function EventConfirmationPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)' }}>Chargement...</p>
      </div>
    }>
      <EventConfirmationContent />
    </Suspense>
  )
}