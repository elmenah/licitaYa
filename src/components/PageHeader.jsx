export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 md:mb-7">
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5 leading-snug">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">{children}</div>
      )}
    </div>
  )
}
