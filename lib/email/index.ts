import { Resend } from 'resend'
import QRCode from 'qrcode'

const resend = new Resend(process.env.RESEND_API_KEY)

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
}) {
  const qrDataUrl = await generateQRCode(
    JSON.stringify({ ref: params.reference, type: 'event_ticket' })
  )

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Votre ticket — ${params.eventName}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
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

        <!-- Ticket Card -->
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid #334155;">

              <!-- Event Header Band -->
              <tr>
                <td style="background:linear-gradient(135deg,#22d3a5 0%,#6366f1 100%);padding:28px 32px;">
                  <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Billet confirmé ✓</p>
                  <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:900;line-height:1.2;">${params.eventName}</h1>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:28px 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <!-- Infos gauche -->
                      <td style="vertical-align:top;width:60%;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-bottom:16px;">
                              <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Date</p>
                              <p style="margin:4px 0 0;color:#f1f5f9;font-size:15px;font-weight:600;">${params.eventDate}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:16px;">
                              <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Heure</p>
                              <p style="margin:4px 0 0;color:#f1f5f9;font-size:15px;font-weight:600;">${params.eventTime}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:16px;">
                              <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Lieu</p>
                              <p style="margin:4px 0 0;color:#f1f5f9;font-size:15px;font-weight:600;">${params.eventLocation}</p>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Billets</p>
                              <p style="margin:4px 0 0;color:#f1f5f9;font-size:15px;font-weight:600;">${params.ticketsCount} place${params.ticketsCount > 1 ? 's' : ''}</p>
                            </td>
                          </tr>
                        </table>
                      </td>

                      <!-- QR Code droite -->
                      <td style="vertical-align:top;text-align:center;width:40%;">
                        <div style="background:#ffffff;border-radius:12px;padding:12px;display:inline-block;">
                          <img src="${qrDataUrl}" width="140" height="140" alt="QR Code" style="display:block;" />
                        </div>
                        <p style="margin:8px 0 0;color:#64748b;font-size:10px;">Scanner à l'entrée</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Divider tirets -->
              <tr>
                <td style="padding:0 32px;">
                  <div style="border-top:2px dashed #334155;position:relative;">
                    <div style="position:absolute;left:-20px;top:-10px;width:20px;height:20px;background:#0f172a;border-radius:50%;"></div>
                    <div style="position:absolute;right:-20px;top:-10px;width:20px;height:20px;background:#0f172a;border-radius:50%;"></div>
                  </div>
                </td>
              </tr>

              <!-- Footer ticket -->
              <tr>
                <td style="padding:20px 32px 28px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Réservé au nom de</p>
                        <p style="margin:4px 0 0;color:#f1f5f9;font-size:14px;font-weight:600;">${params.customerName}</p>
                      </td>
                      <td style="text-align:right;">
                        <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Montant payé</p>
                        <p style="margin:4px 0 0;color:#22d3a5;font-size:18px;font-weight:900;">${new Intl.NumberFormat('fr-FR').format(params.totalPrice)} FCFA</p>
                      </td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                    <tr>
                      <td>
                        <p style="margin:0;color:#64748b;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Référence</p>
                        <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;font-family:monospace;">${params.reference}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- Note importante -->
        <tr>
          <td style="padding:24px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;border:1px solid #334155;padding:20px 24px;">
              <tr>
                <td>
                  <p style="margin:0;color:#f59e0b;font-size:12px;font-weight:700;">⚠️ Important</p>
                  <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
                    Présentez ce QR code à l'entrée de l'événement pour validation. Ce billet est strictement personnel et non cessible. En cas de perte, contactez-nous via zando.ci.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer email -->
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
    from: 'Zando CI <tickets@zando.ci>',
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

        <!-- Header -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <span style="font-size:28px;font-weight:900;color:#22d3a5;letter-spacing:-1px;">Zando CI</span>
            <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Confirmation de réservation</p>
          </td>
        </tr>

        <!-- Card principale -->
        <tr>
          <td style="background:#1e293b;border-radius:20px;overflow:hidden;border:1px solid #334155;">

            <!-- Band vert résidence -->
            <div style="background:linear-gradient(135deg,#22d3a5 0%,#0891b2 100%);padding:28px 32px;">
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Réservation confirmée ✓</p>
              <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:900;">${params.residenceName}</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">📍 ${params.city}</p>
            </div>

            <div style="padding:28px 32px;">

              <!-- Dates -->
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

              <!-- Détails -->
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
    from: 'Zando CI <reservations@zando.ci>',
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
    from: 'Zando CI <reservations@zando.ci>',
    to: params.to,
    subject: `✅ Location confirmée — ${params.vehicleName}`,
    html,
  })
}