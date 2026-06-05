import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, TrendingUp, Bell, Clock, ArrowRight, Zap, ShoppingCart, AlertTriangle, KanbanSquare } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatsCard from '../components/StatsCard'
import LicitacionCard from '../components/LicitacionCard'
import Spinner from '../components/Spinner'
import { fetchLicitaciones } from '../utils/api'
import { isActiva, diasRestantes } from '../utils/formatters'
import { getAlerts } from '../utils/storage'
import { getPerfil, isPerfilCompleto } from '../utils/perfil'
import { getSeguimiento } from '../utils/seguimiento'

export default function Dashboard() {
  const navigate = useNavigate()
  const [licitaciones, setLicitaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const alertas = getAlerts().length
  const seguimiento = getSeguimiento().length
  const perfil = getPerfil()
  const perfilCompleto = isPerfilCompleto()

  const hoy = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const subtitleBase = `${hoy.charAt(0).toUpperCase() + hoy.slice(1)}`
  const subtitleFull = perfilCompleto && perfil.nombre
    ? `Bienvenido, ${perfil.nombre}`
    : subtitleBase

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchLicitaciones({ estado: 'activas' })
        if (!cancelled) setLicitaciones(data)
      } catch (e) {
        if (!cancelled) setError('No se pudo conectar con Mercado Público.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const activas = licitaciones.filter(isActiva)
  const porVencer = activas
    .filter(l => {
      const d = diasRestantes(l.Fechas?.FechaCierre ?? l.FechaCierre)
      return d !== null && d >= 0 && d <= 5
    })
    .sort((a, b) => {
      const da = diasRestantes(a.Fechas?.FechaCierre ?? a.FechaCierre) ?? 99
      const db = diasRestantes(b.Fechas?.FechaCierre ?? b.FechaCierre) ?? 99
      return da - db
    })

  const porVencerCodigos = new Set(porVencer.map(l => l.CodigoExterno))
  const recientes = licitaciones.filter(l => !porVencerCodigos.has(l.CodigoExterno)).slice(0, 6)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={subtitleFull}
      >
        <button
          onClick={() => navigate('/explorar')}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-200"
        >
          <Search size={15} />
          Explorar licitaciones
        </button>
      </PageHeader>

      {/* Onboarding banner */}
      {!perfilCompleto && (
        <button
          onClick={() => navigate('/perfil')}
          className="w-full flex items-center justify-between gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3.5 mb-6 hover:bg-orange-100 transition-colors group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
              <Zap size={15} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-700">Configura tu empresa para personalizar LicitaYa</p>
              <p className="text-xs text-orange-500 mt-0.5">Agrega tu rubro, región y email para recibir alertas relevantes</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-orange-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon={TrendingUp}
          label="Licitaciones activas"
          value={loading ? '—' : activas.length.toLocaleString('es-CL')}
          sub="con plazo vigente"
          color="orange"
        />
        <StatsCard
          icon={Clock}
          label="Por vencer (≤5 días)"
          value={loading ? '—' : porVencer.length}
          sub="requieren atención urgente"
          color="red"
        />
        <StatsCard
          icon={Bell}
          label="Mis alertas"
          value={alertas}
          sub="búsquedas guardadas"
          color="purple"
        />
        <StatsCard
          icon={KanbanSquare}
          label="Seguimiento"
          value={seguimiento}
          sub="postulaciones activas"
          color="blue"
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Por vencer */}
      {!loading && porVencer.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                <Zap size={13} className="text-red-500" />
              </div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Por vencer pronto</h2>
              <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                {porVencer.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/explorar')}
              className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1"
            >
              Ver todas <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {porVencer.slice(0, 3).map(l => (
              <LicitacionCard key={l.CodigoExterno} licitacion={l} />
            ))}
          </div>
        </section>
      )}

      {/* Recientes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
              <TrendingUp size={13} className="text-slate-500" />
            </div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Licitaciones activas recientes</h2>
          </div>
          <button
            onClick={() => navigate('/explorar')}
            className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1"
          >
            Ver todas <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-slate-400">Cargando licitaciones activas...</p>
          </div>
        ) : recientes.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No se encontraron licitaciones</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {recientes.map(l => (
              <LicitacionCard key={l.CodigoExterno} licitacion={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
