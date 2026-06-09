import { useState } from 'react'
import { Search, Bell, X, Filter, MapPin, Download } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LicitacionCard from '../components/LicitacionCard'
import Spinner from '../components/Spinner'
import { fetchLicitacion, fetchLicitaciones } from '../utils/api'
import { saveAlert } from '../utils/storage'
import { saveAlertCloud } from '../utils/alertasCloud'
import { getPerfil } from '../utils/perfil'
import { isSupabaseEnabled } from '../utils/supabase'
import { REGIONES } from '../utils/regiones'
import { diasRestantes, formatFecha } from '../utils/formatters'

// Enriquece resultados de a BATCH_SIZE para no saturar la API
const BATCH_SIZE = 3
const BATCH_DELAY = 400 // ms entre batches

async function enrichBatched(listado, onProgress) {
  const enriched = [...listado]
  for (let i = 0; i < listado.length; i += BATCH_SIZE) {
    const slice = listado.slice(i, i + BATCH_SIZE)
    const details = await Promise.all(
      slice.map(async (l) => {
        try {
          const detalle = await fetchLicitacion(l.CodigoExterno)
          return detalle ?? l
        } catch {
          return l
        }
      })
    )
    details.forEach((d, j) => { enriched[i + j] = d })
    onProgress([...enriched])
    if (i + BATCH_SIZE < listado.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY))
    }
  }
  return enriched
}

const ESTADOS = [
  { value: 'activas',    label: 'Activas (plazo vigente)' },
  { value: 'publicada',  label: 'Publicadas' },
  { value: 'cerrada',    label: 'Cerradas' },
  { value: 'adjudicada', label: 'Adjudicadas' },
  { value: 'desierta',   label: 'Desiertas' },
  { value: 'suspendida', label: 'Suspendidas' },
  { value: 'revocada',   label: 'Revocadas' },
  { value: 'todos',      label: 'Todos los estados' },
]

const MONTOS = [
  { value: '',     label: 'Cualquier monto' },
  { value: '10',   label: 'Hasta $10M' },
  { value: '50',   label: 'Hasta $50M' },
  { value: '100',  label: 'Hasta $100M' },
  { value: '500',  label: 'Hasta $500M' },
]

const FECHAS_CIERRE = [
  { value: '',   label: 'Cualquier fecha' },
  { value: '7',  label: 'Próximos 7 días' },
  { value: '15', label: 'Próximos 15 días' },
  { value: '30', label: 'Próximos 30 días' },
]

const TIPOS = [
  { value: '',    label: 'Cualquier tipo' },
  { value: 'L1',  label: 'L1' },
  { value: 'LE',  label: 'LE' },
  { value: 'LP',  label: 'LP' },
  { value: 'TD',  label: 'Trato Directo' },
  { value: 'CO',  label: 'Convenio' },
]

function applyClientFilters(results, filters) {
  let filtered = [...results]

  if (filters.region) {
    filtered = filtered.filter(l => {
      const r = (l.Comprador?.RegionUnidad ?? l.Comprador?.Region ?? '').toLowerCase()
      return r.includes(filters.region.toLowerCase())
    })
  }

  if (filters.montoMax) {
    const maxCLP = Number(filters.montoMax) * 1_000_000
    filtered = filtered.filter(l => {
      const monto = l.MontoEstimado ?? 0
      return monto <= maxCLP
    })
  }

  if (filters.fechaCierre) {
    const dias = Number(filters.fechaCierre)
    filtered = filtered.filter(l => {
      const fechaStr = l.Fechas?.FechaCierre ?? l.FechaCierre
      const d = diasRestantes(fechaStr)
      return d !== null && d >= 0 && d <= dias
    })
  }

  if (filters.tipo) {
    const tipoUp = filters.tipo.toUpperCase()
    filtered = filtered.filter(l => {
      const t = (l.Tipo ?? '').toUpperCase()
      return t.startsWith(tipoUp)
    })
  }

  return filtered
}

function exportCSV(results) {
  const header = ['Código', 'Nombre', 'Estado', 'Organismo', 'Región', 'Monto (CLP)', 'Fecha Cierre']
  const rows = results.map(l => [
    l.CodigoExterno ?? '',
    `"${(l.Nombre ?? '').replace(/"/g, '""')}"`,
    l.CodigoEstado ?? '',
    `"${(l.Comprador?.NombreOrganismo ?? l.Comprador?.NombreUnidad ?? '').replace(/"/g, '""')}"`,
    `"${(l.Comprador?.RegionUnidad ?? l.Comprador?.Region ?? '').replace(/"/g, '""')}"`,
    l.MontoEstimado ?? '',
    formatFecha(l.Fechas?.FechaCierre ?? l.FechaCierre) ?? '',
  ])

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `licitaciones_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Explorar() {
  const [form, setForm]         = useState({ nombre: '', estado: 'activas' })
  const [filters, setFilters]   = useState({ region: '', montoMax: '', fechaCierre: '', tipo: '' })
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [error, setError]       = useState(null)
  const [searched, setSearched] = useState(false)
  const [alertSaved, setAlertSaved] = useState(false)
  const [enrichDone, setEnrichDone] = useState(0)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  async function buscar(e) {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    setSearched(true)
    setAlertSaved(false)
    setEnrichDone(0)
    try {
      const data = await fetchLicitaciones({
        nombre: form.nombre.trim() || undefined,
        estado: form.estado || undefined,
      })
      setResults(data)
      setLoading(false)

      if (data.length > 0) {
        setEnriching(true)
        let done = 0
        await enrichBatched(data, enriched => {
          done = enriched.filter(l => !!l.Comprador).length
          setEnrichDone(done)
          setResults([...enriched])
        })
        setEnriching(false)
        setEnrichDone(data.length)
      }
    } catch {
      setError('Error al conectar con Mercado Público. Intenta nuevamente.')
      setLoading(false)
      setEnriching(false)
    }
  }

  function guardarAlerta() {
    saveAlert({ nombre: form.nombre, estado: form.estado, resultados: results.length })
    setAlertSaved(true)
    // Guardar también en Supabase si está configurado y hay email
    if (isSupabaseEnabled) {
      const perfil = getPerfil()
      if (perfil.email) {
        saveAlertCloud({ nombre: form.nombre, estado: form.estado }, perfil.email)
          .catch(err => console.warn('[Explorar] Cloud alert save failed:', err))
      }
    }
  }

  function limpiar() {
    setForm({ nombre: '', estado: 'activas' })
    setFilters({ region: '', montoMax: '', fechaCierre: '', tipo: '' })
    setResults([])
    setSearched(false)
    setError(null)
    setAlertSaved(false)
  }

  const filteredResults = searched ? applyClientFilters(results, filters) : []

  return (
    <div>
      <PageHeader title="Explorar" subtitle="Busca y filtra licitaciones del mercado público chileno" />

      {/* Search form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
            <Filter size={14} className="text-orange-500" />
          </div>
          <span className="text-sm font-bold text-slate-700">Filtros de búsqueda</span>
        </div>

        <form onSubmit={buscar}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Keyword */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Palabra clave</label>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ej: computadores, consultoría, obras..."
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent bg-slate-50 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Estado</label>
              <select
                value={form.estado}
                onChange={e => set('estado', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700"
              >
                {ESTADOS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Client-side filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Región</label>
              <select
                value={filters.region}
                onChange={e => setFilter('region', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700"
              >
                <option value="">Todas las regiones</option>
                {REGIONES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Monto máximo</label>
              <select
                value={filters.montoMax}
                onChange={e => setFilter('montoMax', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700"
              >
                {MONTOS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fecha cierre</label>
              <select
                value={filters.fechaCierre}
                onChange={e => setFilter('fechaCierre', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700"
              >
                {FECHAS_CIERRE.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipo</label>
              <select
                value={filters.tipo}
                onChange={e => setFilter('tipo', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700"
              >
                {TIPOS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-200"
            >
              {loading ? <Spinner size="sm" /> : <Search size={15} />}
              Buscar
            </button>

            {searched && results.length > 0 && !alertSaved && (
              <button
                type="button"
                onClick={guardarAlerta}
                className="flex items-center gap-2 border border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
              >
                <Bell size={14} />
                Guardar alerta
              </button>
            )}

            {alertSaved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl">
                ✓ Alerta guardada
              </span>
            )}

            {searched && (
              <button
                type="button"
                onClick={limpiar}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 ml-auto transition-colors"
              >
                <X size={14} /> Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-400">Buscando en Mercado Público...</p>
        </div>
      )}

      {!loading && searched && (
        <>
          {/* Results header */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <p className="text-sm font-semibold text-slate-700">
              {filteredResults.length === 0
                ? 'Sin resultados'
                : <>{filteredResults.length.toLocaleString('es-CL')} licitacion{filteredResults.length !== 1 ? 'es' : ''} encontrada{filteredResults.length !== 1 ? 's' : ''}</>}
              {filteredResults.length !== results.length && (
                <span className="ml-1.5 text-slate-400 font-normal text-xs">(de {results.length} totales)</span>
              )}
            </p>
            {form.nombre && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">
                "{form.nombre}"
              </span>
            )}
            {enriching && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                <Spinner size="sm" />
                <MapPin size={10} />
                Cargando ubicaciones {enrichDone}/{results.length}
              </span>
            )}
            {filteredResults.length > 0 && (
              <button
                onClick={() => exportCSV(filteredResults)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-600 border border-slate-200 hover:border-orange-200 bg-white hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-all ml-auto"
              >
                <Download size={12} />
                Exportar CSV
              </button>
            )}
          </div>

          {filteredResults.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <Search size={44} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium mb-1">Sin resultados para esta búsqueda</p>
              <p className="text-slate-400 text-sm">Prueba con otro término o ajusta los filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredResults.map(l => (
                <LicitacionCard key={l.CodigoExterno} licitacion={l} />
              ))}
            </div>
          )}
        </>
      )}

      {!searched && !loading && (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
          <Search size={52} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-semibold mb-1">Comienza tu búsqueda</p>
          <p className="text-slate-400 text-sm">Usa los filtros de arriba para encontrar oportunidades</p>
        </div>
      )}
    </div>
  )
}
