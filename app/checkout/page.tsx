'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { formatPrice, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const PAYMENT_METHODS = [
  { value: 'orange_money', label: 'Orange Money', color: '#ff6b00', bg: 'rgba(255,107,0,0.1)', border: 'rgba(255,107,0,0.25)' },
  { value: 'mtn_money', label: 'MTN Money', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' },
  { value: 'wave', label: 'Wave', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)' },
  { value: 'moov_money', label: 'Moov Money', color: '#22d3a5', bg: 'rgba(34,211,165,0.1)', border: 'rgba(34,211,165,0.25)' },
]

const TYPE_ICONS: Record<string, string> = {
  residence: '⌂',
  vehicle: '◈',
  event: '◉',
}

const TYPE_LABELS: Record<string, string> = {
  residence: 'Résidence',
  vehicle: 'Véhicule',
  event: 'Événement',
}

function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const itemType = searchParams.get('item_type') ?? ''
  const itemId = searchParams.get('item_id') ?? ''
  const startDate = searchParams.get('start_date') ?? ''
  const endDate = searchParams.get('end_date') ?? ''
  const ticketsCount = Number(searchParams.get('tickets_count') ?? 1)
  const total = Number(searchParams.get('total') ?? 0)
  const commission = Math.round(total * 0.1)
  const ownerAmount = total - commission

  const [profile, setProfile] = useState<{ full_name: string; phone: string } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('orange_money')
  const [mobilePhone, setMobilePhone] = useState('')
  const [cgv, setCgv] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single()
      if (data) {
        setProfile(data as { full_name: string; phone: string })
        setMobilePhone(data.phone ?? '')
      }
    })
  }, [router])

  async function handlePay() {
    if (!cgv) { setError('Veuillez accepter les conditions générales'); return }
    if (!mobilePhone) { setError('Entrez votre numéro Mobile Money'); return }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/paiement/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, itemId, startDate, endDate, ticketsCount, total, paymentMethod, mobilePhone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur lors de l\'initiation du paiement')
      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        router.push('/paiement/succes?ref=' + data.reference)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  const selectedMethod = PAYMENT_METHODS.find(m => m.value === paymentMethod)!

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>
            Paiement sécurisé
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8 }}>
            Finaliser la réservation
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Récapitulatif */}
          <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(34,211,165,0.1)', border: '0.5px solid rgba(34,211,165,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: '#22d3a5',
              }}>
                {TYPE_ICONS[itemType] ?? '◈'}
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Récapitulatif</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{TYPE_LABELS[itemType] ?? itemType}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {startDate && endDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Dates</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{formatDate(startDate)} → {formatDate(endDate)}</span>
                </div>
              )}
              {itemType === 'event' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Billets</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{ticketsCount} billet{ticketsCount > 1 ? 's' : ''}</span>
                </div>
              )}
              <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Total à payer</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#22d3a5', letterSpacing: -0.5 }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Infos client */}
          {profile && (
            <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Vos informations</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Nom</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{profile.full_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Téléphone</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{profile.phone}</span>
              </div>
            </div>
          )}

          {/* Méthode de paiement */}
          <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              Choisir le moyen de paiement
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  style={{
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    border: paymentMethod === m.value ? `1.5px solid ${m.border}` : '0.5px solid rgba(255,255,255,0.08)',
                    background: paymentMethod === m.value ? m.bg : 'rgba(255,255,255,0.03)',
                    color: paymentMethod === m.value ? m.color : 'rgba(255,255,255,0.45)',
                    fontSize: 13, fontWeight: paymentMethod === m.value ? 700 : 500,
                    transition: 'all 0.15s ease', textAlign: 'left',
                  }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: paymentMethod === m.value ? m.color : 'rgba(255,255,255,0.15)',
                    display: 'inline-block', marginRight: 8, verticalAlign: 'middle',
                  }} />
                  {m.label}
                </button>
              ))}
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 10 }}>
                Numéro {selectedMethod.label}
              </label>
              <input
                type="tel"
                value={mobilePhone}
                onChange={e => setMobilePhone(e.target.value)}
                placeholder="+225 07 00 00 00 00"
                style={{
                  width: '100%', padding: '14px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `0.5px solid ${selectedMethod.border}`,
                  borderRadius: 12, fontSize: 14, color: '#fff',
                  outline: 'none', colorScheme: 'dark',
                }}
              />
            </div>
          </div>

          {/* CGV */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '4px 0' }}>
            <div
              onClick={() => setCgv(!cgv)}
              style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                border: cgv ? 'none' : '0.5px solid rgba(255,255,255,0.2)',
                background: cgv ? '#22d3a5' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}>
              {cgv && <span style={{ fontSize: 11, color: '#0a1a14', fontWeight: 800 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              J&apos;accepte les conditions générales d&apos;utilisation et la politique d&apos;annulation de Zando CI
            </span>
          </label>

          {/* Erreur */}
          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)',
              borderRadius: 12, padding: '12px 16px',
            }}>
              <p style={{ fontSize: 13, color: '#f87171' }}>{error}</p>
            </div>
          )}

          {/* Bouton payer */}
          <button
            onClick={handlePay}
            disabled={loading}
            style={{
              width: '100%', padding: '16px',
              background: loading ? 'rgba(34,211,165,0.4)' : '#22d3a5',
              color: '#0a1a14', borderRadius: 14, border: 'none',
              fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: -0.3, transition: 'all 0.15s ease',
            }}>
            {loading ? 'Redirection vers Genius Pay...' : `Payer ${formatPrice(total)}`}
          </button>

          {/* Sécurité */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>🔒</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Paiement sécurisé via Genius Pay</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Chargement...</p>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  )
}