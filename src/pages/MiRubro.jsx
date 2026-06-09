import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search, Bell, BellOff, CheckCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LicitacionCard from '../components/LicitacionCard'
import Spinner from '../components/Spinner'
import { fetchLicitaciones, fetchLicitacion } from '../utils/api'
import { RUBROS, filterByRubro } from '../utils/rubros'
import { getPerfil } from '../utils/perfil'
import { isSupabaseEnabled } from '../utils/supabase'
import { getRubroAlerts, saveRubroAlert, deleteRubroAlert } from '../utils/alertasCloud'

const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble',
  'Biobío', 'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
]

export default function MiRubro() {
  const navigate  = useNavigate()
  const perfil    = getPerfil()
  const cloudOn   = isSupabaseEnabled && !!perfil.email

  const [rubroId, setRubroId] = useState(null)
  const [region, setRegion] = useState('')
  const [licitaciones, setLicitaciones] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingRegion, setLoadingRegion] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [withDetails, setWithDetails] = useState([])

  // alertas de tipo rubro activas: Set de rubroIds
  const [activeRubros, setActiveRubros] = useState(new Set())
  const [alertLoading, setAlertLoading] = useState(false)
  const [alertFeedback, setAlertFeedback] = useState(null) // 'on' | 'off' | null

  // Cargar licitaciones
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchLicitaciones({ estado: 'activas' })
        if (!cancelled) { setLicitaciones(data); setLoaded(true) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Cargar alertas de rubro activas
  useEffect(() => {
    if (!cloudOn) return
    getRubroAlerts(perfil.email).then(list => {
      setActiveRubros(new Set(list.map(r => r.rubroId)))
    })
  }, [cloudOn]) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleAlert(rId) {
    if (!perfil.email) { setAlertFeedback('noEmail'); setTimeout(() => setAlertFeedback(null), 4000); return }
    if (!cloudOn)      { setAlertFeedback('noCloud'); setTimeout(() => setAlertFeedback(null), 4000); return }
    setAlertLoading(true)
    setAlertFeedback(null)
    if (activeRubros.has(rId)) {
      await deleteRubroAlert(rId, perfil.email)
      setActiveRubros(prev => { const s = new Set(prev); s.delete(rId); return s })
      setAlertFeedback('off')
    } else {
      await saveRubroAlert(rId, perfil.email)
      setActiveRubros(prev => new Set([...prev, rId]))
      setAlertFeedback('on')
    }
    setAlertLoading(false)
    setTimeout(() => setAlertFeedback(null), 3000)
  }

  const rubroFiltered = rubroId ? filterByRubro(licitaciones, rubroId) : licitaciones

  // When rubro changes, load details (for region filter) if ≤60 results
  useEffect(() => {
    if (!loaded || !rubroId) { setWithDetails([]); return }
    const subset = rubroFiltered.slice(0, 60)
    if (subset.length === 0) return
    let cancelled = false
    async function loadDetails() {
      setLoadingRegion(true)
      const details = await Promise.allSettled(
        subset.map(l => fetchLicitacion(l.CodigoExterno))
      )
      if (!cancelled) {
        setWithDetails(details.map((r, i) => r.status === 'fulfilled' && r.value ? r.value : subset[i]))
      }
      if (!cancelled) setLoadingRegion(false)
    }
    loadDetails()
    return () => { cancelled = true }
  }, [rubroId, loaded])

  // Apply region filter on withDetails if available, otherwise on rubroFiltered
  const source = region && withDetails.length > 0 ? withDetails : rubroFiltered
  const results = region
    ? source.filter(l => {
        const r = (l.Comprador?.RegionUnidad ?? l.Comprador?.ComunaUnidad ?? '').toLowerCase()
        return r.includes(region.toLowerCase())
      })
    : source.slice(0, 60)

  const rubroActual = RUBROS.find(r => r.id === rubroId)

  return (
    <div>
      <PageHeader
        title="Mi Rubro"
        subtitle="Licitaciones filtradas para tu tipo de negocio"
      />

      {/* Rubro grid */}
      <div className="mb-6">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">¿En qué rubro compites?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RUBROS.map(rubro => (
            <button
              key={rubro.id}
              onClick={() => { setRubroId(prev => prev === rubro.id ? null : rubro.id); setRegion('') }}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                rubroId === rubro.id ? rubro.colorActive : `${rubro.color} hover:shadow-md`
              }`}
            >
              {activeRubros.has(rubro.id) && (
                <span className="absolute top-2 right-2 text-orange-500" title="Alerta activa">
                  <Bell size={11} fill="currentColor" />
                </span>
              )}
              <span className="text-3xl">{rubro.emoji}</span>
              <span className="text-xs font-bold leading-tight text-center">{rubro.label}</span>
              <span className={`text-[10px] leading-tight text-center line-clamp-2 ${rubroId === rubro.id ? 'opacity-80' : 'opacity-60'}`}>
                {rubro.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Region filter — only show when rubro selected and details available */}
      {rubroId && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-600 shrink-0">Filtrar por región:</label>
          {loadingRegion ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Spinner size="sm" /> Cargando datos de región...
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 flex-1">
                {REGIONES.map(r => (
                  <button
                    key={r}
                    onClick={() => setRegion(prev => prev === r ? '' : r)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      region === r
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {region && (
                <button onClick={() => setRegion('')} className="text-xs text-slate-400 hover:text-slate-600 shrink-0">
                  ✕ Quitar región
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-400">Cargando licitaciones activas...</p>
        </div>
      ) : !rubroId ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <span className="text-5xl block mb-4">🎯</span>
          <p className="text-slate-600 font-semibold mb-1">Selecciona tu rubro</p>
          <p className="text-slate-400 text-sm">Elige una categoría arriba para ver las oportunidades de tu industria</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{rubroActual?.emoji}</span>
              <p className="text-sm font-bold text-slate-700">
                {results.length === 0
                  ? 'Sin resultados'
                  : `${results.length} licitacion${results.length !== 1 ? 'es' : ''}`}
              </p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${rubroActual?.color}`}>
                {rubroActual?.label}
              </span>
              {region && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                  {region}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Botón alerta */}
              {alertFeedback === 'on' ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle size={12} /> ¡Alerta activada!
                </span>
              ) : alertFeedback === 'off' ? (
                <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                  <BellOff size={12} /> Alerta desactivada
                </span>
              ) : alertFeedback === 'noEmail' ? (
                <button
                  onClick={() => navigate('/perfil')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Bell size={12} /> Agrega tu email en Mi Empresa →
                </button>
              ) : alertFeedback === 'noCloud' ? (
                <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <Bell size={12} /> Configura Supabase para activar alertas
                </span>
              ) : (
                <button
                  onClick={() => toggleAlert(rubroId)}
                  disabled={alertLoading}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                    activeRubros.has(rubroId)
                      ? 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {alertLoading
                    ? <Spinner size="sm" />
                    : activeRubros.has(rubroId)
                      ? <><Bell size={12} /> Alerta activa</>
                      : <><Bell size={12} /> Activar alerta</>
                  }
                </button>
              )}

              <button
                onClick={() => navigate('/explorar')}
                className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1"
              >
                Búsqueda avanzada <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Search size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">Sin resultados para este rubro{region ? ` en ${region}` : ''}</p>
              {region && (
                <button onClick={() => setRegion('')} className="mt-2 text-sm text-orange-500 hover:text-orange-600">
                  Ver sin filtro de región
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map(l => (
                <LicitacionCard key={l.CodigoExterno} licitacion={l} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
