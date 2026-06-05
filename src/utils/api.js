const TICKET = import.meta.env.VITE_MERCADO_PUBLICO_TICKET
const BASE = 'https://api.mercadopublico.cl/servicios/v1/publico'

// Valid estados for licitaciones (server-side filter)
// activas | publicada | cerrada | desierta | adjudicada | revocada | suspendida | todos
export async function fetchLicitaciones({ nombre, estado, fecha, codigo, CodigoOrganismo } = {}) {
  const params = new URLSearchParams({ ticket: TICKET })
  if (estado) params.set('estado', estado)
  if (fecha) params.set('fecha', fecha)         // format: ddmmyyyy
  if (codigo) params.set('codigo', codigo)
  if (CodigoOrganismo) params.set('CodigoOrganismo', CodigoOrganismo)

  const res = await fetch(`${BASE}/licitaciones.json?${params}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  const data = await res.json()
  if (data.Codigo && data.Codigo !== 200) throw new Error(data.Mensaje ?? `Error ${data.Codigo}`)

  let listado = data.Listado ?? []

  // Client-side keyword filter (API ignores 'nombre' param)
  if (nombre) {
    const kw = nombre.toLowerCase()
    listado = listado.filter(l => l.Nombre?.toLowerCase().includes(kw))
  }

  return listado
}

export async function fetchLicitacion(codigo) {
  const params = new URLSearchParams({ ticket: TICKET, codigo })
  const res = await fetch(`${BASE}/licitaciones.json?${params}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  const data = await res.json()
  return (data.Listado ?? [])[0] ?? null
}

// Órdenes de Compra
// estados: enviadaproveedor | aceptada | cancelada | recepcionconforme | pendienterecepcion | todos
export async function fetchOrdenesDeCompra({ estado, fecha, codigo, CodigoOrganismo, CodigoProveedor } = {}) {
  const params = new URLSearchParams({ ticket: TICKET })
  if (estado) params.set('estado', estado)
  if (fecha) params.set('fecha', fecha)
  if (codigo) params.set('codigo', codigo)
  if (CodigoOrganismo) params.set('CodigoOrganismo', CodigoOrganismo)
  if (CodigoProveedor) params.set('CodigoProveedor', CodigoProveedor)

  const res = await fetch(`${BASE}/ordenesdecompra.json?${params}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  const data = await res.json()
  if (data.Codigo && data.Codigo !== 200) throw new Error(data.Mensaje ?? `Error ${data.Codigo}`)
  return data.Listado ?? []
}

export async function fetchOrdenDeCompra(codigo) {
  const params = new URLSearchParams({ ticket: TICKET, codigo })
  const res = await fetch(`${BASE}/ordenesdecompra.json?${params}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  const data = await res.json()
  return (data.Listado ?? [])[0] ?? null
}

// Lookup organismos compradores
export async function fetchOrganismos() {
  const params = new URLSearchParams({ ticket: TICKET })
  const res = await fetch(`${BASE}/Empresas/BuscarComprador?${params}`)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  const data = await res.json()
  return data.listaorganismos ?? data.Listado ?? []
}
