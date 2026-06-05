import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Building2, MapPin, AlertTriangle, Plus, Check } from 'lucide-react'
import { formatFecha, formatUbicacion, getEstadoBadge, diasRestantes, isActiva } from '../utils/formatters'
import { addToSeguimiento, isEnSeguimiento } from '../utils/seguimiento'

export default function LicitacionCard({ licitacion }) {
  const navigate = useNavigate()
  const badge = getEstadoBadge(licitacion.CodigoEstado)
  const fechaCierre = licitacion.Fechas?.FechaCierre ?? licitacion.FechaCierre
  const dias = diasRestantes(fechaCierre)
  const activa = isActiva(licitacion)
  const organismo = licitacion.Comprador?.NombreOrganismo ?? licitacion.Comprador?.NombreUnidad
  const ubicacion = formatUbicacion({
    region: licitacion.Comprador?.RegionUnidad ?? licitacion.Comprador?.Region,
    comuna: licitacion.Comprador?.ComunaUnidad ?? licitacion.Comprador?.Comuna,
    direccion: licitacion.Comprador?.DireccionUnidad,
  })

  const urgencia = activa && dias !== null
    ? dias <= 1 ? 'critical' : dias <= 3 ? 'high' : dias <= 7 ? 'medium' : null
    : null

  const [enSeguimiento, setEnSeguimiento] = useState(() => isEnSeguimiento(licitacion.CodigoExterno))

  function handleSeguimiento(e) {
    e.stopPropagation()
    if (enSeguimiento) return
    addToSeguimiento(licitacion)
    setEnSeguimiento(true)
  }

  return (
    <div
      onClick={() => navigate(`/licitacion/${encodeURIComponent(licitacion.CodigoExterno)}`)}
      className={`bg-white rounded-2xl border transition-all cursor-pointer group overflow-hidden ${
        urgencia === 'critical'
          ? 'border-red-200 hover:border-red-300 hover:shadow-lg hover:shadow-red-50'
          : urgencia === 'high'
          ? 'border-orange-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-50'
          : 'border-slate-200 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50/30'
      }`}
    >
      {/* Urgency bar */}
      {urgencia && (
        <div className={`h-1 w-full ${
          urgencia === 'critical' ? 'bg-red-400' : urgencia === 'high' ? 'bg-orange-400' : 'bg-yellow-300'
        }`} />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug flex-1">
            {licitacion.Nombre}
          </h3>
          <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md ring-1 ${badge.bg}`}>
            {badge.label}
          </span>
        </div>

        {/* Code & tipo */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-mono text-slate-400">{licitacion.CodigoExterno}</span>
          {licitacion.Tipo && (
            <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
              {licitacion.Tipo}
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="space-y-1.5">
          {organismo && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 size={11} className="shrink-0 text-slate-400" />
              <span className="truncate">{organismo}</span>
            </div>
          )}
          {ubicacion && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{ubicacion}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={11} />
            <span>{formatFecha(fechaCierre) ?? '—'}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Seguimiento button */}
            <button
              onClick={handleSeguimiento}
              title={enSeguimiento ? 'En seguimiento' : 'Agregar a seguimiento'}
              className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all ${
                enSeguimiento
                  ? 'bg-green-100 text-green-600 cursor-default'
                  : 'bg-slate-100 text-slate-400 hover:bg-orange-100 hover:text-orange-500'
              }`}
            >
              {enSeguimiento ? <Check size={11} /> : <Plus size={11} />}
            </button>

            {dias !== null && activa ? (
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                urgencia === 'critical'
                  ? 'bg-red-100 text-red-600'
                  : urgencia === 'high'
                  ? 'bg-orange-100 text-orange-600'
                  : urgencia === 'medium'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {urgencia && <Clock size={10} />}
                {dias === 0 ? 'Hoy' : dias === 1 ? '1 día' : `${dias}d`}
              </span>
            ) : !activa && dias !== null && dias < 0 ? (
              <span className="text-xs text-slate-400">Vencida</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
