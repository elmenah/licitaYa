import { calcProbabilidad, NIVEL_CONFIG } from '../utils/probabilidad'
import { TrendingUp, Clock, Star, AlertTriangle, MapPin } from 'lucide-react'

function FactorBar({ label, icon: Icon, score, max }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <Icon size={13} className="shrink-0 text-slate-400" />
      <span className="text-xs text-slate-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-green-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-300'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-600 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function ProbabilidadCard({ licitacion }) {
  const { pct, nivel, detalles } = calcProbabilidad(licitacion)
  const cfg = NIVEL_CONFIG[nivel]

  return (
    <div className={`rounded-2xl border p-5 ring-1 ${cfg.bg} ${cfg.ring}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
            Tu probabilidad de éxito
          </p>
          <p className={`text-xs font-semibold ${cfg.color}`}>{cfg.label} — Mantenimiento Industrial</p>
        </div>
        {/* Gauge */}
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke={nivel === 'alta' ? '#22c55e' : nivel === 'media' ? '#f59e0b' : '#f87171'}
              strokeWidth="3"
              strokeDasharray={`${pct * 0.942} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-lg font-extrabold ${cfg.color}`}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Factor bars */}
      <div className="space-y-2">
        <FactorBar icon={Star}          label="Rubro"      score={detalles.keyword}    max={40} />
        <FactorBar icon={TrendingUp}    label="Monto"      score={detalles.monto}      max={20} />
        <FactorBar icon={AlertTriangle} label="Organismo"  score={detalles.reclamos}   max={20} />
        <FactorBar icon={Clock}         label="Tiempo"     score={detalles.tiempo}     max={20} />
        <FactorBar icon={MapPin}        label="Región"     score={detalles.region}     max={10} />
      </div>

      <p className="text-[10px] text-slate-400 mt-3">
        Estimación para empresa de Mantenimiento Industrial · Solo orientativo
      </p>
    </div>
  )
}
