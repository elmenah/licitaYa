// Win probability algorithm for a Mantenimiento Industrial company

const KEYWORDS_ALTO = [
  'mantenimiento', 'mantención', 'mantencion', 'mantener',
  'industrial', 'industria', 'planta', 'maquinaria',
  'reparación', 'reparacion', 'reparar',
  'mantención preventiva', 'mantención correctiva',
  'overhaul', 'servicio técnico', 'servicio tecnico',
]

const KEYWORDS_MEDIO = [
  'eléctrico', 'electrico', 'mecánico', 'mecanico',
  'infraestructura', 'equipos', 'instalación', 'instalacion',
  'gasfitería', 'gasfiteria', 'plomería', 'plomeria',
  'calefacción', 'calefaccion', 'climatización', 'climatizacion',
  'generador', 'tablero', 'motores', 'bombas', 'compresores',
  'soldadura', 'pintura industrial', 'andamiaje',
  'servicio', 'arriendo', 'suministro',
]

const KEYWORDS_BAJO = [
  'obras', 'obra', 'construcción', 'construccion',
  'aseo', 'limpieza', 'jardinería', 'jardineria',
  'vigilancia', 'seguridad',
]

function calcKeywordScore(nombre = '', descripcion = '') {
  const text = `${nombre} ${descripcion}`.toLowerCase()
  if (KEYWORDS_ALTO.some(k => text.includes(k))) return 40
  if (KEYWORDS_MEDIO.some(k => text.includes(k))) return 22
  if (KEYWORDS_BAJO.some(k => text.includes(k))) return 10
  return 0
}

function calcMontoScore(monto) {
  if (!monto) return 8 // unknown: neutral
  if (monto >= 3_000_000 && monto <= 80_000_000) return 20   // sweet spot
  if (monto >= 80_000_001 && monto <= 300_000_000) return 14
  if (monto < 3_000_000) return 8
  return 5 // >300M: muy grande
}

function calcReclamosScore(reclamos = 0) {
  if (reclamos === 0) return 20
  if (reclamos <= 10) return 16
  if (reclamos <= 30) return 12
  if (reclamos <= 100) return 6
  return 2 // organismo muy conflictivo
}

function calcTiempoScore(fechaCierre) {
  if (!fechaCierre) return 8
  const dias = Math.ceil((new Date(fechaCierre) - new Date()) / 86400000)
  if (dias < 0) return 0
  if (dias < 2) return 2  // demasiado urgente
  if (dias <= 5) return 10
  if (dias <= 15) return 20  // ideal
  if (dias <= 30) return 18
  if (dias <= 60) return 12
  return 8 // muy lejano
}

function calcRegionScore(region = '') {
  // Si no tiene región, neutral
  if (!region) return 10
  // Regiones más activas industrialmente
  const regionesActivas = ['biobío', 'biobio', 'metropolitana', 'antofagasta', "o'higgins", 'valparaíso', 'valparaiso', 'maule', 'atacama']
  const r = region.toLowerCase()
  if (regionesActivas.some(ra => r.includes(ra))) return 10
  return 6
}

export function calcProbabilidad(licitacion) {
  const nombre = licitacion.Nombre ?? ''
  const descripcion = licitacion.Descripcion ?? ''
  const monto = licitacion.MontoEstimado
  const reclamos = licitacion.CantidadReclamos ?? 0
  const fechaCierre = licitacion.Fechas?.FechaCierre ?? licitacion.FechaCierre
  const region = licitacion.Comprador?.RegionUnidad ?? ''

  const keyword = calcKeywordScore(nombre, descripcion)
  const montoScore = calcMontoScore(monto)
  const reclamos_ = calcReclamosScore(reclamos)
  const tiempo = calcTiempoScore(fechaCierre)
  const regionScore = calcRegionScore(region)

  const total = keyword + montoScore + reclamos_ + tiempo + regionScore // max ~110
  const pct = Math.min(Math.round((total / 110) * 100), 98)

  const nivel = pct >= 70 ? 'alta' : pct >= 45 ? 'media' : 'baja'
  const detalles = { keyword, monto: montoScore, reclamos: reclamos_, tiempo, region: regionScore }

  return { pct, nivel, detalles }
}

export const NIVEL_CONFIG = {
  alta:  { label: 'Alta probabilidad',  color: 'text-green-700',  bg: 'bg-green-50',  ring: 'ring-green-200',  bar: 'bg-green-500' },
  media: { label: 'Probabilidad media', color: 'text-amber-700',  bg: 'bg-amber-50',  ring: 'ring-amber-200',  bar: 'bg-amber-400' },
  baja:  { label: 'Baja probabilidad',  color: 'text-red-600',    bg: 'bg-red-50',    ring: 'ring-red-200',    bar: 'bg-red-400'   },
}
