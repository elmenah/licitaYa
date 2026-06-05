export function formatMonto(monto, moneda = 'CLP') {
  if (monto == null || monto === 0) return null
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: moneda === 'USD' ? 'USD' : 'CLP',
    maximumFractionDigits: 0,
  }).format(monto)
}

export function formatFecha(fechaStr) {
  if (!fechaStr) return null
  return new Date(fechaStr).toLocaleDateString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function formatFechaHora(fechaStr) {
  if (!fechaStr) return null
  return new Date(fechaStr).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function cleanLocationValue(value) {
  if (!value || typeof value !== 'string') return ''
  return value
    .replace(/^Regi[oó]n de\s+/i, '')
    .replace(/^Regi[oó]n del\s+/i, '')
    .trim()
}

export function formatUbicacion({ region, comuna, direccion } = {}) {
  const parts = []
  const cleanRegion = cleanLocationValue(region)
  const cleanComuna = cleanLocationValue(comuna)
  const cleanDireccion = cleanLocationValue(direccion)

  if (cleanComuna) parts.push(cleanComuna)
  if (cleanRegion && cleanRegion.toLowerCase() !== cleanComuna.toLowerCase()) parts.push(cleanRegion)
  if (cleanDireccion && cleanDireccion.toLowerCase() !== cleanComuna.toLowerCase()) parts.push(cleanDireccion)

  return parts.length > 0 ? parts.join(' · ') : null
}

export function diasRestantes(fechaStr) {
  if (!fechaStr) return null
  const diff = Math.ceil((new Date(fechaStr) - new Date()) / 86400000)
  return diff
}

// CodigoEstado → display
export const ESTADO_BADGE = {
  5: { label: 'Publicada', bg: 'bg-blue-100 text-blue-700 ring-blue-200' },
  6: { label: 'Cerrada',   bg: 'bg-slate-100 text-slate-600 ring-slate-200' },
  7: { label: 'Desierta',  bg: 'bg-red-100 text-red-700 ring-red-200' },
  8: { label: 'Adjudicada',bg: 'bg-purple-100 text-purple-700 ring-purple-200' },
  9: { label: 'Revocada',  bg: 'bg-orange-100 text-orange-700 ring-orange-200' },
  18: { label: 'Suspendida',bg: 'bg-yellow-100 text-yellow-700 ring-yellow-200'},
}

export const OC_ESTADO_BADGE = {
  4:  { label: 'Enviada proveedor', bg: 'bg-blue-100 text-blue-700' },
  5:  { label: 'Pend. recepción',   bg: 'bg-yellow-100 text-yellow-700' },
  6:  { label: 'Aceptada',          bg: 'bg-green-100 text-green-700' },
  9:  { label: 'Cancelada',         bg: 'bg-red-100 text-red-700' },
  12: { label: 'Recep. conforme',   bg: 'bg-purple-100 text-purple-700' },
}

export function getEstadoBadge(codigoEstado) {
  return ESTADO_BADGE[codigoEstado] ?? { label: `Estado ${codigoEstado}`, bg: 'bg-gray-100 text-gray-600 ring-gray-200' }
}

export function getOcEstadoBadge(codigoEstado) {
  return OC_ESTADO_BADGE[codigoEstado] ?? { label: `Estado ${codigoEstado}`, bg: 'bg-gray-100 text-gray-600' }
}

export function isActiva(licitacion) {
  if (licitacion.CodigoEstado !== 5) return false
  const fechaCierre = licitacion.Fechas?.FechaCierre ?? licitacion.FechaCierre
  if (!fechaCierre) return true
  return new Date(fechaCierre) > new Date()
}

// LICITACION TIPO codes
export const TIPO_LABEL = {
  1: 'LE — Licitación Pública',
  2: 'L1 — Licitación Pública',
  3: 'LP — Licitación Pública',
  4: 'LQ — Licitación Pública',
  5: 'LR — Licitación Pública',
  6: 'LS — Licitación Pública',
  7: 'CO — Convenio',
  8: 'SE — Suministro de Equipos',
  22: 'CA — Compra Ágil',
}
