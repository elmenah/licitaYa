/**
 * LicitaYa — Netlify Function: check-alerts
 *
 * Revisa todas las alertas activas en Supabase y envía emails
 * vía Resend si hay licitaciones nuevas.
 *
 * Llámala desde cron-job.org cada hora:
 *   GET https://tuapp.netlify.app/.netlify/functions/check-alerts?token=TU_CRON_SECRET
 *
 * Env vars necesarias (en Netlify Site Settings → Environment variables):
 *   SUPABASE_URL, SUPABASE_ANON_KEY, RESEND_API_KEY,
 *   MERCADO_PUBLICO_TICKET, FROM_EMAIL, CRON_SECRET
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// ─── Clientes ────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

const TICKET   = process.env.MERCADO_PUBLICO_TICKET
const API_BASE = 'https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json'
const FROM     = process.env.FROM_EMAIL || 'alertas@licitaya.cl'

// ─── Mercado Público API ──────────────────────────────────────────────────────

async function fetchLicitaciones(alert) {
  const params = new URLSearchParams({ ticket: TICKET })
  if (alert.estado && alert.estado !== 'todos') params.set('estado', alert.estado)
  if (alert.nombre) params.set('nombre', alert.nombre)

  const res = await fetch(`${API_BASE}?${params}`)
  if (!res.ok) throw new Error(`API Mercado Público ${res.status}`)
  const json = await res.json()
  return json.Listado ?? []
}

// ─── Email ────────────────────────────────────────────────────────────────────

async function sendAlertEmail(toEmail, alert, licitaciones) {
  const keyword = alert.nombre || 'Sin keyword'
  const count   = licitaciones.length

  const rows = licitaciones.slice(0, 15).map(l => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
        <p style="margin:0 0 4px;font-weight:600;color:#1e293b;font-size:13px;">${l.Nombre ?? ''}</p>
        <p style="margin:0;color:#94a3b8;font-size:11px;font-family:monospace;">${l.CodigoExterno ?? ''}</p>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:12px;white-space:nowrap;">
        ${l.Comprador?.NombreOrganismo ?? l.Comprador?.NombreUnidad ?? '—'}
      </td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header naranja -->
      <tr>
        <td style="background:#f97316;border-radius:16px 16px 0 0;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">
                  <span style="color:#fff1e0;">Licita</span>Ya
                </p>
                <p style="margin:4px 0 0;font-size:13px;color:#fed7aa;">
                  Monitor de licitaciones del mercado público chileno
                </p>
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

      <!-- Cuerpo -->
      <tr>
        <td style="background:#fff;padding:32px;">
          <h1 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1e293b;">
            ${count} nueva${count !== 1 ? 's' : ''} licitacion${count !== 1 ? 'es' : ''} encontrada${count !== 1 ? 's' : ''}
          </h1>
          <p style="margin:0 0 24px;font-size:14px;color:#64748b;">
            Para tu alerta: <strong style="color:#f97316;">"${keyword}"</strong>
          </p>

          <table width="100%" cellpadding="0" cellspacing="0"
            style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">
                  Licitación
                </th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">
                  Organismo
                </th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          ${count > 15 ? `<p style="margin:12px 0 0;font-size:12px;color:#94a3b8;text-align:center;">... y ${count - 15} más. Abre LicitaYa para verlas todas.</p>` : ''}

          <div style="margin-top:28px;text-align:center;">
            <a href="https://licitaya.netlify.app/explorar"
              style="display:inline-block;background:#f97316;color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
              Ver en LicitaYa →
            </a>
          </div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
            Configurado desde <strong>LicitaYa</strong> ·
            Si no deseas recibir estos correos, desactiva la alerta en la aplicación.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

  await resend.emails.send({
    from: FROM,
    to:   toEmail,
    subject: `🔔 LicitaYa: ${count} nueva${count !== 1 ? 's' : ''} licitacion${count !== 1 ? 'es' : ''} para "${keyword}"`,
    html,
  })
}

// ─── Handler principal ────────────────────────────────────────────────────────

export const handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' }

  // Verificar token secreto (protege el endpoint de llamadas externas no autorizadas)
  const token = event.headers?.['x-cron-token'] || event.queryStringParameters?.token
  if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (!TICKET) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'MERCADO_PUBLICO_TICKET no configurado' }) }
  }

  // Cargar alertas activas desde Supabase
  const { data: alertas, error: dbError } = await supabase
    .from('alertas')
    .select('*')
    .eq('activa', true)

  if (dbError) {
    console.error('[check-alerts] Supabase error:', dbError.message)
    return { statusCode: 500, headers, body: JSON.stringify({ error: dbError.message }) }
  }

  console.log(`[check-alerts] Verificando ${alertas.length} alerta(s)...`)

  const resultados = []

  for (const alert of alertas) {
    if (!alert.email) continue

    try {
      const licitaciones = await fetchLicitaciones(alert)
      const notificados  = new Set(alert.codigos_notificados ?? [])
      const nuevas       = licitaciones.filter(l => !notificados.has(l.CodigoExterno))

      if (nuevas.length > 0) {
        console.log(`[check-alerts] Alerta ${alert.id}: ${nuevas.length} nuevas → email a ${alert.email}`)
        await sendAlertEmail(alert.email, alert, nuevas)

        nuevas.forEach(l => notificados.add(l.CodigoExterno))

        await supabase
          .from('alertas')
          .update({
            codigos_notificados: [...notificados],
            ultima_ejecucion:    new Date().toISOString(),
          })
          .eq('id', alert.id)

        resultados.push({ id: alert.id, keyword: alert.nombre, nuevas: nuevas.length })
      } else {
        console.log(`[check-alerts] Alerta ${alert.id}: sin novedades`)
      }
    } catch (err) {
      console.error(`[check-alerts] Error en alerta ${alert.id}:`, err.message)
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok:         true,
      timestamp:  new Date().toISOString(),
      checked:    alertas.length,
      resultados,
    }),
  }
}
