import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { sendAlertEmail } from './email.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ALERTS_PATH = join(__dirname, 'data', 'alerts.json')
const TICKET = process.env.MERCADO_PUBLICO_TICKET
const API_BASE = 'https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json'

function readAlerts() {
  try {
    return JSON.parse(readFileSync(ALERTS_PATH, 'utf8'))
  } catch {
    return []
  }
}

function writeAlerts(alerts) {
  writeFileSync(ALERTS_PATH, JSON.stringify(alerts, null, 2), 'utf8')
}

async function fetchLicitacionesForAlert(alert) {
  const params = new URLSearchParams({ ticket: TICKET })
  if (alert.estado && alert.estado !== 'todos') params.set('estado', alert.estado)
  if (alert.nombre) params.set('nombre', alert.nombre)

  const url = `${API_BASE}?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = await res.json()
  const lista = json.Listado ?? []

  // Extra client-side filter by keyword if needed
  if (alert.nombre) {
    const kw = alert.nombre.toLowerCase()
    return lista.filter(l => (l.Nombre ?? '').toLowerCase().includes(kw))
  }
  return lista
}

export async function checkAllAlerts() {
  const alerts = readAlerts()
  if (alerts.length === 0) return

  console.log(`[checker] Verificando ${alerts.length} alerta(s)...`)

  const updated = [...alerts]

  for (let i = 0; i < updated.length; i++) {
    const alert = updated[i]
    if (!alert.email) {
      console.log(`[checker] Alerta ${alert.id} sin email, saltando.`)
      continue
    }

    try {
      const licitaciones = await fetchLicitacionesForAlert(alert)
      const notificados = new Set(alert.codigosNotificados ?? [])
      const nuevas = licitaciones.filter(l => !notificados.has(l.CodigoExterno))

      if (nuevas.length > 0) {
        console.log(`[checker] Alerta ${alert.id}: ${nuevas.length} nuevas, enviando email a ${alert.email}`)
        await sendAlertEmail(alert.email, alert, nuevas)
        nuevas.forEach(l => notificados.add(l.CodigoExterno))
      } else {
        console.log(`[checker] Alerta ${alert.id}: sin novedades`)
      }

      updated[i] = {
        ...alert,
        codigosNotificados: [...notificados],
        ultimaEjecucion: new Date().toISOString(),
      }
    } catch (err) {
      console.error(`[checker] Error en alerta ${alert.id}:`, err.message)
    }
  }

  writeAlerts(updated)
  console.log('[checker] Verificación completada.')
}
