import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Play, Trash2, Search, Plus, CheckCircle, AlertCircle, Upload } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import { getAlerts, deleteAlert, updateAlert } from '../utils/storage'
import { getPerfil } from '../utils/perfil'
import { fetchLicitaciones } from '../utils/api'

function AlertCard({ alert, onDelete, onRun, running, perfilEmail, serverActive, onRegister, registeredIds }) {
  const estadoLabel = alert.estado
    ? alert.estado.charAt(0).toUpperCase() + alert.estado.slice(1)
    : 'Todos'

  const isRegistered = registeredIds.has(String(alert.id))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-slate-800 text-sm">
            {alert.nombre || <span className="text-slate-400 italic">Sin keyword</span>}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{estadoLabel}</span>
            {alert.ultimosResultados !== undefined && (
              <span className="text-xs text-slate-400">{alert.ultimosResultados} resultados</span>
            )}
            {perfilEmail && (
              <span className="text-xs text-slate-400 truncate max-w-32">{perfilEmail}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(alert.id)}
          className="text-slate-300 hover:text-red-400 transition-colors p-1"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Creada el {new Date(alert.creadoEn).toLocaleDateString('es-CL')}
        {alert.ultimaEjecucion && ` · Última ejecución: ${new Date(alert.ultimaEjecucion).toLocaleDateString('es-CL')}`}
      </p>

      <div className="space-y-2">
        <button
          onClick={() => onRun(alert)}
          disabled={running}
          className="w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {running ? <Spinner size="sm" /> : <Play size={14} />}
          Ejecutar alerta
        </button>

        {serverActive && perfilEmail && (
          isRegistered ? (
            <div className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-600 text-xs font-semibold py-2 rounded-lg">
              <CheckCircle size={12} />
              Notificaciones activas
            </div>
          ) : (
            <button
              onClick={() => onRegister(alert)}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-orange-200 hover:bg-orange-50 text-slate-500 hover:text-orange-600 text-xs font-medium py-2 rounded-lg transition-all"
            >
              <Upload size={12} />
              Registrar en servidor
            </button>
          )
        )}
      </div>
    </div>
  )
}

export default function MisAlertas() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState(getAlerts())
  const [running, setRunning] = useState(null)
  const [runResults, setRunResults] = useState(null)
  const [runError, setRunError] = useState(null)
  const [serverActive, setServerActive] = useState(null) // null | true | false
  const [serverAlerts, setServerAlerts] = useState([])
  const perfil = getPerfil()

  useEffect(() => {
    checkServer()
  }, [])

  async function checkServer() {
    try {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), 2000)
      const res = await fetch('/api/health', { signal: ctrl.signal })
      clearTimeout(timeout)
      if (res.ok) {
        setServerActive(true)
        fetchServerAlerts()
      } else {
        setServerActive(false)
      }
    } catch {
      setServerActive(false)
    }
  }

  async function fetchServerAlerts() {
    try {
      const res = await fetch('/api/alerts')
      if (res.ok) {
        const data = await res.json()
        setServerAlerts(data)
      }
    } catch {
      // ignore
    }
  }

  const registeredIds = new Set(serverAlerts.map(a => String(a.id)))

  function reload() {
    setAlerts(getAlerts())
  }

  function handleDelete(id) {
    deleteAlert(id)
    reload()
    if (runResults?.alertId === id) setRunResults(null)
  }

  async function handleRun(alert) {
    setRunning(alert.id)
    setRunError(null)
    setRunResults(null)
    try {
      const data = await fetchLicitaciones({
        nombre: alert.nombre || undefined,
        estado: alert.estado || undefined,
      })
      updateAlert(alert.id, { ultimaEjecucion: new Date().toISOString(), ultimosResultados: data.length })
      reload()
      setRunResults({ alertId: alert.id, keyword: alert.nombre, data })
    } catch {
      setRunError('Error al ejecutar la alerta. Intenta nuevamente.')
    } finally {
      setRunning(null)
    }
  }

  async function handleRegister(alert) {
    if (!perfil.email) return
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...alert,
          email: perfil.email,
        }),
      })
      if (res.ok) {
        await fetchServerAlerts()
      }
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <PageHeader title="Mis Alertas" subtitle="Búsquedas guardadas que puedes ejecutar en cualquier momento">
        <button
          onClick={() => navigate('/explorar')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} />
          Nueva alerta
        </button>
      </PageHeader>

      {/* Server status banner */}
      {serverActive === false && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">El servidor de notificaciones no está corriendo</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Ejecuta <code className="font-mono bg-amber-100 px-1 rounded">npm run server</code> para activar alertas por email.
            </p>
          </div>
        </div>
      )}
      {serverActive === true && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-6">
          <CheckCircle size={15} className="shrink-0" />
          Servidor activo — notificaciones por email habilitadas
        </div>
      )}

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
              perfilEmail={perfil.email || null}
              serverActive={serverActive === true}
              onRegister={handleRegister}
              registeredIds={registeredIds}
            />
          ))}
        </div>
      )}

      {/* Run results */}
      {runError && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {runError}
        </div>
      )}

      {runResults && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Resultados de "{runResults.keyword || 'Sin keyword'}" — {runResults.data.length} encontradas
          </h2>
          {runResults.data.length === 0 ? (
            <p className="text-sm text-slate-400">Sin resultados para esta alerta.</p>
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
