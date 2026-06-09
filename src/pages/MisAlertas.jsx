import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Play, Trash2, Search, Plus, CheckCircle, AlertCircle, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import { getAlerts, deleteAlert, updateAlert } from '../utils/storage'
import { getAlertsCloud, deleteAlertCloud } from '../utils/alertasCloud'
import { getPerfil } from '../utils/perfil'
import { isSupabaseEnabled } from '../utils/supabase'
import { fetchLicitaciones } from '../utils/api'
import { RUBROS } from '../utils/rubros'

// ─── AlertCard ────────────────────────────────────────────────────────────────

function AlertCard({ alert, onDelete, onRun, running, cloudEnabled }) {
  const esRubro  = alert.tipo === 'rubro'
  const rubroMeta = esRubro ? RUBROS.find(r => r.id === alert.nombre) : null
  const titulo   = esRubro
    ? (rubroMeta ? `${rubroMeta.emoji} ${rubroMeta.label}` : alert.nombre)
    : (alert.nombre || <span className="text-slate-400 italic">Sin keyword</span>)
  const estadoLabel = alert.estado
    ? alert.estado.charAt(0).toUpperCase() + alert.estado.slice(1)
    : 'Todos'

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{titulo}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {esRubro ? (
              <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-full font-medium">
                🔔 Automático · por rubro
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{estadoLabel}</span>
            )}
            {alert.ultimosResultados !== undefined && (
              <span className="text-xs text-slate-400">{alert.ultimosResultados} resultados</span>
            )}
            {alert.email && (
              <span className="text-xs text-slate-400 truncate max-w-36">{alert.email}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(alert.id)}
          className="text-slate-300 hover:text-red-400 transition-colors p-1 shrink-0"
          aria-label="Eliminar alerta"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Creada el {new Date(alert.creadoEn).toLocaleDateString('es-CL')}
        {alert.ultimaEjecucion && ` · Revisada ${new Date(alert.ultimaEjecucion).toLocaleDateString('es-CL')}`}
      </p>

      <div className="space-y-2 mt-auto">
        {/* Solo keyword-alerts tienen "Ejecutar ahora" */}
        {!esRubro && (
          <button
            onClick={() => onRun(alert)}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {running ? <Spinner size="sm" /> : <Play size={14} />}
            Ejecutar ahora
          </button>
        )}

        {/* Estado de notificación automática */}
        {cloudEnabled ? (
          <div className="w-full flex items-center justify-center gap-1.5 bg-green-50 text-green-600 text-xs font-semibold py-2 rounded-lg">
            <CheckCircle size={12} />
            {esRubro ? 'Email automático cada hora' : 'Notificaciones automáticas activas'}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-1.5 bg-slate-50 text-slate-400 text-xs py-2 rounded-lg">
            <AlertCircle size={12} />
            Sin notificaciones — configura Supabase
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function MisAlertas() {
  const navigate    = useNavigate()
  const perfil      = getPerfil()

  const [alerts,      setAlerts]      = useState(getAlerts())
  const [running,     setRunning]     = useState(null)
  const [runResults,  setRunResults]  = useState(null)
  const [runError,    setRunError]    = useState(null)
  const [syncing,     setSyncing]     = useState(false)
  const [lastSync,    setLastSync]    = useState(null)   // 'ok' | 'error' | null

  const cloudActive = isSupabaseEnabled && !!perfil.email

  // Al montar: sincronizar desde Supabase si está disponible
  useEffect(() => {
    if (cloudActive) syncFromCloud()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function syncFromCloud() {
    setSyncing(true)
    setLastSync(null)
    try {
      const cloudAlerts = await getAlertsCloud(perfil.email)
      if (cloudAlerts) {
        // Combinar: cloud tiene prioridad; locales que no están en cloud se ignoran
        setAlerts(cloudAlerts)
        setLastSync('ok')
      } else {
        setLastSync('error')
      }
    } catch {
      setLastSync('error')
    } finally {
      setSyncing(false)
    }
  }

  function reload() {
    if (cloudActive) {
      syncFromCloud()
    } else {
      setAlerts(getAlerts())
    }
  }

  async function handleDelete(id) {
    // Borrar localmente
    deleteAlert(id)
    // Soft-delete en Supabase
    if (cloudActive) await deleteAlertCloud(id)
    reload()
    if (runResults?.alertId === id) setRunResults(null)
  }

  async function handleRun(alert) {
    setRunning(alert.id)
    setRunError(null)
    setRunResults(null)
    try {
      const data = await fetchLicitaciones({
        nombre: alert.nombre  || undefined,
        estado: alert.estado  || undefined,
      })
      updateAlert(alert.id, {
        ultimaEjecucion:   new Date().toISOString(),
        ultimosResultados: data.length,
      })
      reload()
      setRunResults({ alertId: alert.id, keyword: alert.nombre, data })
    } catch {
      setRunError('Error al ejecutar la alerta. Intenta nuevamente.')
    } finally {
      setRunning(null)
    }
  }

  return (
    <div>
      <PageHeader title="Mis Alertas" subtitle="Búsquedas guardadas con notificaciones automáticas por email">
        <button
          onClick={() => navigate('/explorar')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} />
          Nueva alerta
        </button>
      </PageHeader>

      {/* Banner: estado de Supabase */}
      {cloudActive ? (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-6">
          <Cloud size={15} className="shrink-0" />
          <span className="flex-1">
            <strong>Notificaciones activas</strong> — LicitaYa revisará automáticamente cada hora y te enviará un email cuando aparezcan nuevas licitaciones.
          </span>
          <button
            onClick={syncFromCloud}
            disabled={syncing}
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 disabled:opacity-50 transition-colors shrink-0"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : lastSync === 'ok' ? '✓ Al día' : 'Sincronizar'}
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
          <CloudOff size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Notificaciones desactivadas</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {!perfil.email
                ? 'Agrega tu email en Mi Empresa para activar alertas.'
                : 'Configura Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY) para activar alertas por email.'}
            </p>
          </div>
          {!perfil.email && (
            <button
              onClick={() => navigate('/perfil')}
              className="ml-auto text-xs font-semibold text-amber-700 underline underline-offset-2 shrink-0"
            >
              Ir a Mi Empresa
            </button>
          )}
        </div>
      )}

      {/* Lista de alertas */}
      {alerts.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium mb-1">No tienes alertas guardadas</p>
          <p className="text-sm text-slate-400 mb-4">
            Ve a Explorar, busca algo y guárdalo como alerta
          </p>
          <button
            onClick={() => navigate('/explorar')}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <Search size={15} />
            Ir a Explorar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDelete={handleDelete}
              onRun={handleRun}
              running={running === alert.id}
              cloudEnabled={cloudActive}
            />
          ))}
        </div>
      )}

      {/* Error de ejecución */}
      {runError && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {runError}
        </div>
      )}

      {/* Resultados de ejecución manual */}
      {runResults && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Resultados de "{runResults.keyword || 'Sin keyword'}" — {runResults.data.length} encontradas
          </h2>
          {runResults.data.length === 0 ? (
            <p className="text-sm text-slate-400">Sin resultados para esta alerta en este momento.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {runResults.data.map(l => (
                <div
                  key={l.CodigoExterno}
                  onClick={() => navigate(`/licitacion/${encodeURIComponent(l.CodigoExterno)}`)}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer"
                >
                  <p className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1">{l.Nombre}</p>
                  <p className="text-xs font-mono text-slate-400">{l.CodigoExterno}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
