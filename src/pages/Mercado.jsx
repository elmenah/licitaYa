import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { RefreshCw } from 'lucide-react'
import Header from '../components/Header'
import Spinner from '../components/Spinner'
import { fetchLicitaciones } from '../utils/api'
import { getEstadoBadge, isActiva } from '../utils/formatters'

const PIE_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#6366f1']

const ESTADO_LABELS = { 5: 'Publicada', 6: 'Cerrada', 7: 'Desierta', 8: 'Adjudicada', 9: 'Revocada', 18: 'Suspendida' }

export default function Mercado() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [error, setError] = useState(null)

  async function cargar() {
    setLoading(true)
    setError(null)
    try {
      const licitaciones = await fetchLicitaciones({ estado: 'activas' })
      setData(licitaciones)
    } catch {
      setError('Error al cargar datos del mercado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const filtrado = keyword
    ? data.filter(l => l.Nombre?.toLowerCase().includes(keyword.toLowerCase()))
    : data

  const activas = filtrado.filter(isActiva).length

  // Top estados
  const estadoMap = {}
  filtrado.forEach(l => {
    const label = ESTADO_LABELS[l.CodigoEstado] ?? `Estado ${l.CodigoEstado}`
    estadoMap[label] = (estadoMap[label] ?? 0) + 1
  })
  const estadoData = Object.entries(estadoMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  // Actividad por día de cierre (próximos 30 días)
  const hoy = new Date()
  const en30 = new Date(hoy); en30.setDate(hoy.getDate() + 30)
  // Use Map to preserve insertion order after sorting
  const porDiaMap = new Map()
  filtrado
    .filter(l => l.FechaCierre && new Date(l.FechaCierre) >= hoy && new Date(l.FechaCierre) <= en30)
    .sort((a, b) => new Date(a.FechaCierre) - new Date(b.FechaCierre))
    .forEach(l => {
      const fecha = new Date(l.FechaCierre)
      const key = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
      porDiaMap.set(key, (porDiaMap.get(key) ?? 0) + 1)
    })
  const cierreData = Array.from(porDiaMap.entries())
    .slice(0, 20)
    .map(([name, value]) => ({ name, value }))

  // Top palabras en nombres (simple word frequency)
  const wordFreq = {}
  const stopwords = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'y', 'en', 'con', 'de', 'a', 'por', 'un', 'una', 'al'])
  filtrado.forEach(l => {
    (l.Nombre ?? '').toLowerCase().split(/\s+/).forEach(w => {
      if (w.length < 4 || stopwords.has(w)) return
      wordFreq[w] = (wordFreq[w] ?? 0) + 1
    })
  })
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }))

  return (
    <div>
      <Header title="Mercado" subtitle="Inteligencia y análisis del mercado público">
        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-2 border border-slate-200 hover:border-orange-300 text-slate-600 hover:text-orange-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </Header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total licitaciones', value: loading ? '...' : filtrado.length },
          { label: 'Activas con plazo vigente', value: loading ? '...' : activas },
          { label: 'Con cierre próximo (30d)', value: loading ? '...' : cierreData.reduce((s, d) => s + d.value, 0) },
          { label: 'Estados distintos', value: loading ? '...' : estadoData.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filtro */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Filtrar por keyword..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Por estado */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Distribución por estado</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={estadoData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {estadoData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top keywords en nombres */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Palabras más frecuentes en licitaciones</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topWords} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip cursor={{ fill: '#fef3c7' }} />
                <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} name="Frecuencia" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cierres próximos */}
          {cierreData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 xl:col-span-2">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Cierres en los próximos 30 días</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={cierreData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#fef3c7' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Cierres" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
