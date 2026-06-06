export default function StatsCard({ icon: Icon, label, value, sub, trend, color = 'orange' }) {
  const palette = {
    orange: { icon: 'bg-orange-500', ring: 'ring-orange-100', text: 'text-orange-500' },
    blue:   { icon: 'bg-blue-500',   ring: 'ring-blue-100',   text: 'text-blue-500' },
    green:  { icon: 'bg-green-500',  ring: 'ring-green-100',  text: 'text-green-600' },
    purple: { icon: 'bg-purple-500', ring: 'ring-purple-100', text: 'text-purple-500' },
    red:    { icon: 'bg-red-500',    ring: 'ring-red-100',    text: 'text-red-500' },
  }
  const c = palette[color] ?? palette.orange

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200 p-3 md:p-5 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className={`w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl ${c.icon} ring-2 md:ring-4 ${c.ring} flex items-center justify-center shrink-0`}>
        <Icon size={17} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] md:text-xs font-medium text-slate-500 mb-0.5 leading-tight line-clamp-1">{label}</p>
        <p className="text-lg md:text-2xl font-bold text-slate-900 leading-none">{value}</p>
        {sub && <p className="text-[10px] md:text-xs text-slate-400 mt-0.5 leading-tight line-clamp-1">{sub}</p>}
      </div>
      {trend != null && (
        <div className={`text-xs font-semibold px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg shrink-0 hidden sm:block ${
          trend > 0 ? 'bg-green-50 text-green-600' : trend < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
        }`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}
