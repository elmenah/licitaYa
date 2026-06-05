import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import cron from 'node-cron'
import { checkAllAlerts } from './checker.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ALERTS_PATH = join(__dirname, 'data', 'alerts.json')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

// Helpers
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

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.get('/api/alerts', (_req, res) => {
  res.json(readAlerts())
})

app.post('/api/alerts', (req, res) => {
  const alerts = readAlerts()
  const newAlert = {
    ...req.body,
    id: Date.now(),
    creadoEn: new Date().toISOString(),
    codigosNotificados: [],
    ultimaEjecucion: null,
  }
  writeAlerts([newAlert, ...alerts])
  res.status(201).json(newAlert)
})

app.delete('/api/alerts/:id', (req, res) => {
  const id = Number(req.params.id)
  const alerts = readAlerts().filter(a => a.id !== id)
  writeAlerts(alerts)
  res.json({ ok: true })
})

app.post('/api/alerts/check-now', async (_req, res) => {
  try {
    await checkAllAlerts()
    res.json({ ok: true, timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// Cron: every hour
cron.schedule('0 * * * *', () => {
  console.log('[cron] Ejecutando checkAllAlerts...')
  checkAllAlerts().catch(err => console.error('[cron] Error:', err.message))
})

app.listen(PORT, () => {
  console.log(`🚀 LicitaYa Server en puerto ${PORT}`)
})
