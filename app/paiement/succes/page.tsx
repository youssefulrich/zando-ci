import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default async function PaiementSuccesPage({
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

          {/* Icône succès */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(34,211,165,0.1)', border: '0.5px solid rgba(34,211,165,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px', fontSize: 32,
          }}>
            ✓
          </div>

          <div style={{ fontSize: 11, color: '#22d3a5', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600, marginBottom: 12 }}>
            Paiement confirmé
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.8, marginBottom: 12 }}>
            Réservation confirmée !
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28 }}>
            Votre paiement a bien été reçu. Vous allez recevoir un email de confirmation avec tous les détails.
          </p>

          {params.ref && (
            <div style={{
              background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '14px 24px', display: 'inline-block', marginBottom: 32,
            }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Référence</p>
              <p style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700, color: '#22d3a5', letterSpacing: 0.5 }}>{params.ref}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/mes-reservations" style={{
              display: 'block', padding: '14px 28px', background: '#22d3a5',
              color: '#0a1a14', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none',
            }}>
              Voir mes réservations
            </Link>
            <Link href="/" style={{
              display: 'block', padding: '13px 28px',
              background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)', borderRadius: 12, fontSize: 14, textDecoration: 'none',
            }}>
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}