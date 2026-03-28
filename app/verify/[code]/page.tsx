import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export default async function VerifyTicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const admin = createAdminClient() as any

  const { data: ticket } = await admin
    .from('tickets')
    .select('*, events(title, event_date, event_time, venue_name, city)')
    .eq('code', code)
    .single()

  if (!ticket) notFound()

  const isValid = ticket.status === 'valid'
  const isUsed = ticket.status === 'used'

  const event = ticket.events as any
  const date = event?.event_date
    ? new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const accent = isValid ? '#22d3a5' : '#f87171'
  const bgAccent = isValid ? 'rgba(34,211,165,0.08)' : 'rgba(248,113,113,0.08)'
  const borderAccent = isValid ? 'rgba(34,211,165,0.25)' : 'rgba(248,113,113,0.25)'

  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Zando<span style={{ color: '#22d3a5' }}>CI</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Vérification de billet</div>
        </div>

        {/* Statut principal */}
        <div style={{ background: bgAccent, border: `1px solid ${borderAccent}`, borderRadius: 20, padding: '32px 24px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {isValid ? '✅' : isUsed ? '🚫' : '❌'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: accent, letterSpacing: -1, marginBottom: 8 }}>
            {isValid ? 'BILLET VALIDE' : isUsed ? 'DÉJÀ SCANNÉ' : 'BILLET ANNULÉ'}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            {isValid ? 'Ce billet est authentique et n\'a pas encore été utilisé.' : isUsed ? `Scanné le ${ticket.scanned_at ? new Date(ticket.scanned_at).toLocaleString('fr-FR') : '—'}` : 'Ce billet a été annulé.'}
          </div>
        </div>

        {/* Infos billet */}
        <div style={{ background: '#111827', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Événement</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{event?.title ?? '—'}</div>
            </div>
            <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Date</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{date}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Lieu</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{event?.venue_name ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Billet</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: accent }}>{ticket.ticket_number} / {ticket.total_in_booking}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Statut</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: accent }}>{isValid ? 'Valide' : isUsed ? 'Utilisé' : 'Annulé'}</div>
              </div>
            </div>
            <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Code</div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: 6, display: 'inline-block' }}>{ticket.code}</div>
            </div>
          </div>
        </div>

        {/* Bouton marquer comme scanné — visible uniquement si valide */}
        {isValid && (
          <MarkAsUsedButton ticketCode={code} />
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 20 }}>
          ZandoCI · Billetterie sécurisée · Abidjan
        </p>
      </div>
    </div>
  )
}

// Composant client pour marquer le billet comme utilisé
function MarkAsUsedButton({ ticketCode }: { ticketCode: string }) {
  return (
    <form action={`/api/tickets/scan`} method="POST">
      <input type="hidden" name="code" value={ticketCode} />
      <button
        type="submit"
        style={{
          width: '100%', padding: '16px',
          background: '#22d3a5', color: '#0a0f1a',
          border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 800, cursor: 'pointer',
          letterSpacing: -0.3,
        }}
      >
        ✓ Marquer comme scanné
      </button>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
        À utiliser par l'organisateur à l'entrée
      </p>
    </form>
  )
}