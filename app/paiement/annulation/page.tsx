import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default async function PaiementAnnulationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>

          {/* Icône annulation */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(248,113,113,0.1)', border: '0.5px solid rgba(248,113,113,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px', fontSize: 28, color: '#f87171',
          }}>
            ✕
          </div>

          <div style={{ fontSize: 11, color: '#f87171', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 12 }}>
            Paiement annulé
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 12 }}>
            Paiement non abouti
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28 }}>
            Votre paiement n&apos;a pas été complété. Aucun montant n&apos;a été débité de votre compte.
          </p>

          {params.ref && (
            <div style={{
              background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '14px 24px', display: 'inline-block', marginBottom: 32,
            }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Référence</p>
              <p style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>{params.ref}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/" style={{
              display: 'block', padding: '14px 28px', background: '#22d3a5',
              color: '#0a1a14', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}>
              Réessayer
            </Link>
            <Link href="/mes-reservations" style={{
              display: 'block', padding: '13px 28px',
              background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)', borderRadius: 12, fontSize: 14, textDecoration: 'none',
            }}>
              Mes réservations
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}