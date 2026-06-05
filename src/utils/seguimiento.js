const KEY = 'licitaya_seguimiento'

export const COLUMNAS = [
  { id: 'viendo',     label: 'Viendo',     color: 'slate' },
  { id: 'preparando', label: 'Preparando', color: 'blue' },
  { id: 'enviada',    label: 'Enviada',    color: 'orange' },
  { id: 'adjudicada', label: 'Adjudicada', color: 'green' },
  { id: 'perdida',    label: 'Perdida',    color: 'red' },
]

export function getSeguimiento() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function addToSeguimiento(licitacion) {
  const items = getSeguimiento()
  const codigo = licitacion.CodigoExterno
  if (items.some(i => i.codigo === codigo)) return false

  const fechaCierre = licitacion.Fechas?.FechaCierre ?? licitacion.FechaCierre ?? null
  const organismo =
    licitacion.Comprador?.NombreOrganismo ??
    licitacion.Comprador?.NombreUnidad ??
    ''

  const newItem = {
    id: Date.now(),
    codigo,
    nombre: licitacion.Nombre ?? '',
    organismo,
    monto: licitacion.MontoEstimado ?? null,
    moneda: licitacion.Moneda ?? 'CLP',
    fechaCierre,
    columna: 'viendo',
    notas: '',
    agregadoEn: new Date().toISOString(),
  }

  localStorage.setItem(KEY, JSON.stringify([newItem, ...items]))
  return true
}

export function isEnSeguimiento(codigo) {
  return getSeguimiento().some(i => i.codigo === codigo)
}

export function moveSeguimiento(id, columna) {
  const items = getSeguimiento().map(i => i.id === id ? { ...i, columna } : i)
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function updateNotasSeguimiento(id, notas) {
  const items = getSeguimiento().map(i => i.id === id ? { ...i, notas } : i)
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function deleteSeguimiento(id) {
  const items = getSeguimiento().filter(i => i.id !== id)
  localStorage.setItem(KEY, JSON.stringify(items))
}
