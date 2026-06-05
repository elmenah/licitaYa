import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, X, ExternalLink, Calendar, DollarSign, Building2, Filter } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import { fetchOrdenesDeCompra } from '../utils/api'
import { formatMonto, formatFechaHora, getOcEstadoBadge } from '../utils/formatters'

const ESTADOS_OC = [
  { value: 'todos',                label: 'Todos los estados' },
  { value: 'enviadaproveedor',     label: 'Enviada a proveedor' },
  { value: 'aceptada',             label: 'Aceptada' },
  { value: 'recepcionconforme',    label: 'Recepción conforme' },
  { value: 'pendienterecepcion',   label: 'Pendiente recepción' },
  { value: 'cancelada',            label: 'Cancelada' },
]

function OcCard({ oc, onClick }) {
  const badge = getOcEstadoBadge(oc.CodigoEstado)
  const monto = formatMonto(oc.Total, oc.TipoMoneda)
  const organismo = oc.Comprador?.NombreOrganismo ?? oc.Comprador?.NombreUnidad
  const proveedor = oc.Proveedor?.NombreProveedor ?? oc.Proveedor?.Nombre

  return (
    <div
      onClick={() => onClick(oc.Codigo)}
      className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50/30 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug flex-1">
          {oc.Nombre}
        </h3>
        <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md ${badge.bg}`}>
          {badge.label}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-mono text-slate-400">{oc.Codigo}</span>
        {oc.Tipo && (
          <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{oc.Tipo}</span>
        )}
      </div>

      <div className="space-y-1.5 mb-4">
        {organismo && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Building2 size={11} className="shrink-0 text-slate-400" />
            <span className="truncate">{organismo}</span>
          </div>
        )}
        {proveedor && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShoppingCart size={11} className="shrink-0" />
            <span className="truncate">{proveedor}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar size={11} />
          <span>{formatFechaHora(oc.Fechas?.FechaCreacion) ?? '—'}</span>
        </div>
        {monto && (
          <span className="text-sm font-bold text-slate-800">{monto}</span>
        )}
      </div>
    </div>
  )
}

export default function OrdenesDeCompra() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', estado: 'todos' })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function buscar(e) {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const data = await fetchOrdenesDeCompra({ estado: form.estado || 'todos' })
      const filtrado = form.nombre.trim()
        ? data.filter(oc => oc.Nombre?.toLowerCase().includes(form.nombre.toLowerCase()))
        : data
      setResults(filtrado.slice(0, 100))
    } catch {
      setError('Error al conectar con Mercado Público.')
    } finally {
      setLoading(false)
    }
  }

  function limpiar() {
    setForm({ nombre: '', estado: 'todos' })
    setResults([])
    setSearched(false)
    setError(null)
  }

  function verDetalle(codigo) {
    window.open(
      `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=${codigo}`,
      '_blank'
    )
  }

  return (
    <div>
      <PageHeader
        title="Órdenes de Compra"
        subtitle="Consulta órdenes de compra emitidas en Mercado Público"
      />

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <Filter size={14} className="text-blue-500" />
          </div>
          <span className="text-sm font-bold text-slate-700">Filtros</span>
        </div>

        <form onSubmit={buscar}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Código de OC</label>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ej: nombre del producto..."
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Estado</label>
              <select
                value={form.estado}
                onChange={e => set('estado', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50 text-slate-700"
              >
                {ESTADOS_OC.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              {loading ? <Spinner size="sm" /> : <ShoppingCart size={15} />}
              Consultar
            </button>

            {searched && (
              <button type="button" onClick={limpiar}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 ml-auto"
              >
                <X size={14} /> Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-400">Consultando órdenes de compra...</p>
        </div>
      )}

      {!loading && searched && (
        <>
          <p className="text-sm font-semibold text-slate-700 mb-5">
            {results.length === 0
              ? 'Sin resultados'
              : `${results.length.toLocaleString('es-CL')} órdenes encontradas`}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <ShoppingCart size={44} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">Sin resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map(oc => (
                <OcCard key={oc.Codigo} oc={oc} onClick={verDetalle} />
              ))}
            </div>
          )}
        </>
      )}

      {!searched && !loading && (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
          <ShoppingCart size={52} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-semibold mb-1">Consulta órdenes de compra</p>
          <p className="text-slate-400 text-sm">Selecciona un estado y haz clic en Consultar</p>
        </div>
      )}
    </div>
  )
}
