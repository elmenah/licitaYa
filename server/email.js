import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendAlertEmail(toEmail, alert, licitaciones) {
  const keyword = alert.nombre || 'Sin keyword'
  const count = licitaciones.length

  const licHtml = licitaciones.map(l => `
    <tr>
      <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;">
        <p style="margin:0 0 4px 0; font-weight:600; color:#1e293b; font-size:13px;">${l.Nombre ?? ''}</p>
        <p style="margin:0; color:#94a3b8; font-size:11px; font-family:monospace;">${l.CodigoExterno ?? ''}</p>
      </td>
      <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:12px; white-space:nowrap;">
        ${l.Comprador?.NombreOrganismo ?? l.Comprador?.NombreUnidad ?? '—'}
      </td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#f97316;border-radius:16px 16px 0 0;padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">
                      <span style="color:#fff1e0;">Licita</span>Ya
                    </p>
                    <p style="margin:4px 0 0 0;font-size:13px;color:#fed7aa;">Monitor de licitaciones del mercado público chileno</p>
                  </td>
                  <td align="right">
                    <span style="background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;">
                      🔔 NUEVA ALERTA
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;">
              <h1 style="margin:0 0 8px 0;font-size:18px;font-weight:700;color:#1e293b;">
                ${count} nueva${count !== 1 ? 's' : ''} licitacion${count !== 1 ? 'es' : ''} encontrada${count !== 1 ? 's' : ''}
              </h1>
              <p style="margin:0 0 24px 0;font-size:14px;color:#64748b;">
                Para tu alerta: <strong style="color:#f97316;">"${keyword}"</strong>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Licitación</th>
                    <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Organismo</th>
                  </tr>
                </thead>
                <tbody>
                  ${licHtml}
                </tbody>
              </table>

              <div style="margin-top:24px;text-align:center;">
                <a href="https://licitaya.cl" style="display:inline-block;background:#f97316;color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
                  Ver en LicitaYa
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
                Configurado desde <strong>LicitaYa</strong> · Si no deseas recibir estos correos, desactiva la alerta en la aplicación.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'alertas@licitaya.cl',
    to: toEmail,
    subject: `🔔 LicitaYa: ${count} nueva${count !== 1 ? 's' : ''} licitacion${count !== 1 ? 'es' : ''} para "${keyword}"`,
    html,
  })
}
