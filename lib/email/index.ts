import { Resend } from 'resend'
import QRCode from 'qrcode'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zando-ci.vercel.app'

// ─── Génération QR Code ───────────────────────────────────────────────────────
async function generateQRCode(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: 200,
    margin: 2,
    color: { dark: '#0a0f1a', light: '#ffffff' },
  })
}

// ─── Email ticket événement ───────────────────────────────────────────────────
export async function sendEventTicket(params: {
  to: string
  customerName: string
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  ticketsCount: number
  totalPrice: number
  reference: string
  unitPrice: number
  // Tickets individuels avec codes uniques (optionnel — rétrocompatible)
  ticketLinks?: { code: string; ticket_number: number; total_in_booking: number; verify_url: string }[]
}) {
  // Si on a des tickets individuels, générer un QR par billet
  // Sinon fallback sur l'ancien comportement (QR de la référence)
  let ticketsHtml = ''

  if (params.ticketLinks && params.ticketLinks.length > 0) {
    // Générer un QR code pour chaque billet individuel
    const ticketCards = await Promise.all(
      params.ticketLinks.map(async (t) => {
        const qrDataUrl = await generateQRCode(t.verify_url)
        return `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid rgba(34,211,165,0.25);border-radius:16px;overflow:hidden;margin-bottom:16px;">
            <!-- Header billet -->
            <tr>
              <td style="background:linear-gradient(135deg,#22d3a5 0%,#0891b2 100%);padding:14px 24px;">
                <p style="margin:0;color:rgba(0,0,0,0.7);font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">
                  Billet ${t.ticket_number} / ${t.total_in_booking}
                </p>
              </td>
            </tr>
            <!-- Corps billet -->
            <tr>
              <td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <!-- Infos gauche -->
                    <td style="vertical-align:middle;">
                      <p style="margin:0 0 6px;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Événement</p>
                      <p style="margin:0 0 12px;color:#f1f5f9;font-size:14px;font-weight:700;">${params.eventName}</p>
                      <p style="margin:0 0 4px;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Code</p>
                      <p style="margin:0;color:#22d3a5;font-size:11px;font-family:monospace;background:rgba(34,211,165,0.08);padding:4px 8px;border-radius:4px;display:inline-block;">${t.code}</p>
                    </td>
                    <!-- QR code droite -->
                    <td style="text-align:center;vertical-align:middle;width:160px;">
                      <div style="background:#ffffff;border-radius:10px;padding:8px;display:inline-block;">
                        <img src="${qrDataUrl}" width="130" height="130" alt="QR Code billet ${t.ticket_number}" style="display:block;" />
                      </div>
                      <p style="margin:6px 0 0;color:#64748b;font-size:9px;text-align:center;">Scanner à l'entrée</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `
      })
    )
    ticketsHtml = ticketCards.join('')
  } else {
    // Ancien comportement — un seul QR pour la référence
    const qrDataUrl = await generateQRCode(
      JSON.stringify({ ref: params.reference, type: 'event_ticket' })
    )
    ticketsHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #334155;border-radius:16px;margin-bottom:16px;">
        <tr>
          <td style="padding:20px 24px;text-align:center;">
            <div style="background:#ffffff;border-radius:12px;padding:12px;display:inline-block;">
              <img src="${qrDataUrl}" width="140" height="140" alt="QR Code" style="display:block;" />
            </div>
            <p style="margin:8px 0 0;color:#64748b;font-size:10px;">Scanner à l'entrée · ${params.ticketsCount} place${params.ticketsCount > 1 ? 's' : ''}</p>
          </td>
        </tr>
      </table>
    `
  }

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Votre billet — ${params.eventName}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <span style="font-size:28px;font-weight:900;color:#22d3a5;letter-spacing:-1px;">Zando CI</span>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Votre billet d'entrée numérique</p>
          </td>
        </tr>

        <!-- Card événement -->
        <tr>
          <td style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid #334155;margin-bottom:24px;">

            <!-- Band header -->
            <div style="background:linear-gradient(135deg,#22d3a5 0%,#6366f1 100%);padding:28px 32px;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Billet(s) confirmé(s) ✓</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:900;line-height:1.2;">${params.eventName}</h1>
            </div>

            <!-- Infos événement -->
            <div style="padding:24px 32px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:14px;width:33%;">
                    <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Date</p>
                    <p style="margin:4px 0 0;color:#f1f5f9;font-size:14px;font-weight:600;">${params.eventDate}</p>
                  </td>
                  <td style="padding-bottom:14px;width:33%;">
                    <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Heure</p>
                    <p style="margin:4px 0 0;color:#f1f5f9;font-size:14px;font-weight:600;">${params.eventTime}</p>
                  </td>
                  <td style="padding-bottom:14px;width:33%;">
                    <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Lieu</p>
                    <p style="margin:4px 0 0;color:#f1f5f9;font-size:14px;font-weight:600;">${params.eventLocation}</p>
                  </td>
                </tr>
              </table>

              <!-- Récap paiement -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:10px;padding:14px 16px;border:1px solid #334155;margin-bottom:24px;">
                <tr>
                  <td style="color:#94a3b8;font-size:13px;">
                    ${params.ticketsCount} billet${params.ticketsCount > 1 ? 's' : ''} · ${params.customerName}
                  </td>
                  <td style="text-align:right;color:#22d3a5;font-size:16px;font-weight:900;">
                    ${new Intl.NumberFormat('fr-FR').format(params.totalPrice)} FCFA
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:8px;color:#475569;font-size:11px;font-family:monospace;">
                    Réf: ${params.reference}
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- Tickets individuels -->
        <tr>
          <td style="padding-top:24px;">
            <p style="margin:0 0 16px;color:#f1f5f9;font-size:15px;font-weight:700;">
              🎫 ${params.ticketsCount > 1 ? `Vos ${params.ticketsCount} billets` : 'Votre billet'} — à présenter à l'entrée
            </p>
            ${ticketsHtml}
          </td>
        </tr>

        <!-- Instructions -->
        <tr>
          <td style="padding-top:8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;border:1px solid rgba(34,211,165,0.2);padding:20px 24px;">
              <tr>
                <td>
                  <p style="margin:0;color:#22d3a5;font-size:12px;font-weight:700;">📱 Comment utiliser votre billet</p>
                  <ul style="margin:8px 0 0;padding:0 0 0 16px;color:#94a3b8;font-size:12px;line-height:1.8;">
                    <li>Présentez le QR code à l'entrée de l'événement</li>
                    <li>L'organisateur scannera votre code avec son téléphone</li>
                    <li>Chaque billet ne peut être utilisé qu'une seule fois</li>
                    <li>En cas de problème, communiquez votre référence : <strong style="color:#f1f5f9;font-family:monospace;">${params.reference}</strong></li>
                  </ul>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Note importante -->
        <tr>
          <td style="padding-top:16px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;border:1px solid #334155;padding:16px 24px;">
              <tr>
                <td>
                  <p style="margin:0;color:#f59e0b;font-size:12px;font-weight:700;">⚠️ Important</p>
                  <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
                    Ce billet est strictement personnel et non cessible. En cas de perte, contactez-nous via zando.ci.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:32px 0 0;text-align:center;">
            <p style="margin:0;color:#475569;font-size:11px;">© 2026 Zando CI · Côte d'Ivoire</p>
            <p style="margin:4px 0 0;color:#475569;font-size:11px;">Plateforme de location multi-services</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
`

  return await resend.emails.send({
    from: 'Zando CI <onboarding@resend.dev>',
    to: params.to,
    subject: `🎟️ Votre billet — ${params.eventName}`,
    html,
  })
}

// ─── Email confirmation résidence ─────────────────────────────────────────────
export async function sendResidenceConfirmation(params: {
  to: string
  customerName: string
  residenceName: string
  city: string
  startDate: string
  endDate: string
  nights: number
  totalPrice: number
  reference: string
  ownerPhone?: string
}) {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td align="center" style="padding-bottom:32px;">
            <span style="font-size:28px;font-weight:900;color:#22d3a5;letter-spacing:-1px;">Zando CI</span>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Confirmation de réservation</p>
          </td>
        </tr>

        <tr>
          <td style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid #334155;">

            <div style="background:linear-gradient(135deg,#22d3a5 0%,#0891b2 100%);padding:28px 32px;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Réservation confirmée ✓</p>
              <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:900;">${params.residenceName}</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">📍 ${params.city}</p>
            </div>

            <div style="padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:50%;padding-right:8px;">
                    <div style="background:#0f172a;border-radius:12px;padding:16px;border:1px solid #334155;">
                      <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Arrivée</p>
                      <p style="margin:6px 0 0;color:#f1f5f9;font-size:16px;font-weight:700;">${params.startDate}</p>
                    </div>
                  </td>
                  <td style="width:50%;padding-left:8px;">
                    <div style="background:#0f172a;border-radius:12px;padding:16px;border:1px solid #334155;">
                      <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Départ</p>
                      <p style="margin:6px 0 0;color:#f1f5f9;font-size:16px;font-weight:700;">${params.endDate}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;padding:20px;border:1px solid #334155;margin-bottom:24px;">
                <tr><td style="padding-bottom:12px;border-bottom:1px solid #1e293b;">
                  <table width="100%"><tr>
                    <td style="color:#94a3b8;font-size:13px;">Durée</td>
                    <td style="text-align:right;color:#f1f5f9;font-size:13px;font-weight:600;">${params.nights} nuit${params.nights > 1 ? 's' : ''}</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #1e293b;">
                  <table width="100%"><tr>
                    <td style="color:#94a3b8;font-size:13px;">Référence</td>
                    <td style="text-align:right;color:#94a3b8;font-size:12px;font-family:monospace;">${params.reference}</td>
                  </tr></table>
                </td></tr>
                ${params.ownerPhone ? `<tr><td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #1e293b;">
                  <table width="100%"><tr>
                    <td style="color:#94a3b8;font-size:13px;">Contact propriétaire</td>
                    <td style="text-align:right;color:#f1f5f9;font-size:13px;font-weight:600;">${params.ownerPhone}</td>
                  </tr></table>
                </td></tr>` : ''}
                <tr><td style="padding-top:12px;">
                  <table width="100%"><tr>
                    <td style="color:#94a3b8;font-size:13px;font-weight:700;">Total payé</td>
                    <td style="text-align:right;color:#22d3a5;font-size:20px;font-weight:900;">${new Intl.NumberFormat('fr-FR').format(params.totalPrice)} FCFA</td>
                  </tr></table>
                </td></tr>
              </table>

              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;">
                Bonjour <strong style="color:#f1f5f9;">${params.customerName}</strong>, votre réservation est confirmée.
                Le propriétaire vous contactera avant votre arrivée pour les modalités d'accès.
              </p>
            </div>
          </td>
        </tr>

        <tr><td style="padding:32px 0 0;text-align:center;">
          <p style="margin:0;color:#475569;font-size:11px;">© 2026 Zando CI · Côte d'Ivoire</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`

  return await resend.emails.send({
    from: 'Zando CI <onboarding@resend.dev>',
    to: params.to,
    subject: `✅ Réservation confirmée — ${params.residenceName}`,
    html,
  })
}

// ─── Email confirmation véhicule ──────────────────────────────────────────────
export async function sendVehicleConfirmation(params: {
  to: string
  customerName: string
  vehicleName: string
  city: string
  startDate: string
  endDate: string
  days: number
  totalPrice: number
  reference: string
  ownerPhone?: string
}) {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td align="center" style="padding-bottom:32px;">
            <span style="font-size:28px;font-weight:900;color:#22d3a5;letter-spacing:-1px;">Zando CI</span>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Confirmation de location</p>
          </td>
        </tr>

        <tr>
          <td style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid #334155;">

            <div style="background:linear-gradient(135deg,#3b82f6 0%,#6366f1 100%);padding:28px 32px;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Location confirmée ✓</p>
              <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:900;">${params.vehicleName}</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">📍 ${params.city}</p>
            </div>

            <div style="padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:50%;padding-right:8px;">
                    <div style="background:#0f172a;border-radius:12px;padding:16px;border:1px solid #334155;">
                      <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Prise en charge</p>
                      <p style="margin:6px 0 0;color:#f1f5f9;font-size:16px;font-weight:700;">${params.startDate}</p>
                    </div>
                  </td>
                  <td style="width:50%;padding-left:8px;">
                    <div style="background:#0f172a;border-radius:12px;padding:16px;border:1px solid #334155;">
                      <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Restitution</p>
                      <p style="margin:6px 0 0;color:#f1f5f9;font-size:16px;font-weight:700;">${params.endDate}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;padding:20px;border:1px solid #334155;margin-bottom:24px;">
                <tr><td style="padding-bottom:12px;border-bottom:1px solid #1e293b;">
                  <table width="100%"><tr>
                    <td style="color:#94a3b8;font-size:13px;">Durée</td>
                    <td style="text-align:right;color:#f1f5f9;font-size:13px;font-weight:600;">${params.days} jour${params.days > 1 ? 's' : ''}</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #1e293b;">
                  <table width="100%"><tr>
                    <td style="color:#94a3b8;font-size:13px;">Référence</td>
                    <td style="text-align:right;color:#94a3b8;font-size:12px;font-family:monospace;">${params.reference}</td>
                  </tr></table>
                </td></tr>
                ${params.ownerPhone ? `<tr><td style="padding-top:12px;padding-bottom:12px;border-bottom:1px solid #1e293b;">
                  <table width="100%"><tr>
                    <td style="color:#94a3b8;font-size:13px;">Contact loueur</td>
                    <td style="text-align:right;color:#f1f5f9;font-size:13px;font-weight:600;">${params.ownerPhone}</td>
                  </tr></table>
                </td></tr>` : ''}
                <tr><td style="padding-top:12px;">
                  <table width="100%"><tr>
                    <td style="color:#94a3b8;font-size:13px;font-weight:700;">Total payé</td>
                    <td style="text-align:right;color:#60a5fa;font-size:20px;font-weight:900;">${new Intl.NumberFormat('fr-FR').format(params.totalPrice)} FCFA</td>
                  </tr></table>
                </td></tr>
              </table>

              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;">
                Bonjour <strong style="color:#f1f5f9;">${params.customerName}</strong>, votre location est confirmée.
                Le loueur vous contactera pour les modalités de prise en charge du véhicule.
              </p>
            </div>
          </td>
        </tr>

        <tr><td style="padding:32px 0 0;text-align:center;">
          <p style="margin:0;color:#475569;font-size:11px;">© 2026 Zando CI · Côte d'Ivoire</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`

  return await resend.emails.send({
   from: 'Zando CI <onboarding@resend.dev>',
    to: params.to,
    subject: `✅ Location confirmée — ${params.vehicleName}`,
    html,
  })
}