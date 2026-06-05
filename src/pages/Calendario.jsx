import { useState, useEffect } from 'react'
import { CalendarDays, Clock, Building2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import { fetchLicitaciones } from '../utils/api'
import { diasRestantes, formatFecha, isActiva } from '../utils/formatters'

const DIAS_OPCIONES = [
  { value: 7,  label: 'Próximos 7 días' },
  { value: 15, label: 'Próximos 15 días' },
  { value: 30, label: 'Próximos 30 días' },
]

function toDateKey(fechaStr) {
  if (!fechaStr) return null
  const d = new Date(fechaStr)
  if (isNaN(d)) return null
  return d.toISOString().slice(0, 10)
}

function formatDiaSemana(dateKey) {
  const d = new Date(dateKey + 'T12:00:00')
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}

function UrgencyChip({ dias }) {
  if (dias === null) return null
  const cls = dias <= 1
    ? 'bg-red-100 text-red-600'
    : dias <= 3
    ? 'bg-orange-100 text-orange-600'
    : dias <= 7
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-slate-100 text-slate-500'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${cls}`}>
      <Clock size={10} />
      {dias === 0 ? 'Hoy' : dias === 1 ? '1 día' : `${dias}d`}
    </span>
  )
}

export default function Calendario() {
  const navigate = useNavigate()
  const [licitaciones, setLicitaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [diasFiltro, setDiasFiltro] = useState(30)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchLicitaciones({ estado: 'activas' })
        if (!cancelled) setLicitaciones(data)
      } catch {
        if (!cancelled) setError('No se pudo conectar con Mercado Público.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Build grouped structure
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const limite = new Date(hoy)
  limite.setDate(limite.getDate() + diasFiltro)

  const activas = licitaciones.filter(isActiva)

  // Filter & group by close date
  const grouped = {}
  for (const l of activas) {
    const fechaCierre = l.Fechas?.FechaCierre ?? l.FechaCierre
    if (!fechaCierre) continue
    const cierre = new Date(fechaCierre)
    if (cierre < hoy || cierre > limite) continue
    const key = toDateKey(fechaCierre)
    if (!key) continue
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(l)
  }

  const sortedKeys = Object.keys(grouped).sort()

  return (
    <div>
      <PageHeader
        title="Calendario"
        subtitle="Próximos cierres de licitaciones"
      >
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {DIAS_OPCIONES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDiasFiltro(value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                diasFiltro === value
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </PageHeader>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-400">Cargando licitaciones...</p>
        </div>
      ) : sortedKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
          <CalendarDays size={52} className="text-slate-200 mb-4" />
          <p className="text-slate-500 font-semibold mb-1">Sin cierres en este período</p>
          <p className="text-slate-400 text-sm">No hay licitaciones con cierre en los próximos {diasFiltro} días</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedKeys.map(dateKey => {
            const items = grouped[dateKey]
            const label = formatDiaSemana(dateKey)
            return (
              <section key={dateKey}>
                {/* Day header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <CalendarDays size={15} className="text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 capitalize">{label}</h2>
                    <p className="text-xs text-slate-400">
                      {items.length} licitacion{items.length !== 1 ? 'es' : ''} cierran este día
                    </p>
                  </div>
                </div>

                {/* Licitaciones list */}
                <div className="space-y-2 pl-11">
                  {items.map(l => {
                    const fechaCierre = l.Fechas?.FechaCierre ?? l.FechaCierre
                    const dias = diasRestantes(fechaCierre)
                    const organismo = l.Comprador?.NombreOrganismo ?? l.Comprador?.NombreUnidad
                    return (
                      <div
                        key={l.CodigoExterno}
                        onClick={() => navigate(`/licitacion/${encodeURIComponent(l.CodigoExterno)}`)}
                        className="bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-orange-200 hover:shadow-md hover:shadow-orange-50/30 cursor-pointer transition-all flex items-start justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 line-clamp-1 hover:text-orange-600 transition-colors">
                            {l.Nombre}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] font-mono text-slate-400">{l.CodigoExterno}</span>
                            {organismo && (
                              <span className="flex items-center gap-1 text-xs text-slate-500 truncate">
                                <Building2 size={10} className="shrink-0" />
                                <span className="truncate">{organismo}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <UrgencyChip dias={dias} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
