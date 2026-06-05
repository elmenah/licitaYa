import { useState } from 'react'
import { KanbanSquare, Trash2, ChevronLeft, ChevronRight, Clock, Calendar, StickyNote } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getSeguimiento, moveSeguimiento, deleteSeguimiento, updateNotasSeguimiento, COLUMNAS } from '../utils/seguimiento'
import { formatFecha, diasRestantes } from '../utils/formatters'

const COL_STYLES = {
  slate:  { header: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', border: 'border-slate-200' },
  blue:   { header: 'bg-blue-50 text-blue-700',   dot: 'bg-blue-400',   border: 'border-blue-200' },
  orange: { header: 'bg-orange-50 text-orange-700', dot: 'bg-orange-400', border: 'border-orange-200' },
  green:  { header: 'bg-green-50 text-green-700',  dot: 'bg-green-400',  border: 'border-green-200' },
  red:    { header: 'bg-red-50 text-red-700',      dot: 'bg-red-400',    border: 'border-red-200' },
}

function UrgencyBadge({ fechaCierre }) {
  if (!fechaCierre) return null
  const dias = diasRestantes(fechaCierre)
  if (dias === null || dias < 0) return <span className="text-xs text-slate-400">Vencida</span>
  const cls = dias <= 1
    ? 'bg-red-100 text-red-600'
    : dias <= 3
    ? 'bg-orange-100 text-orange-600'
    : dias <= 7
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-slate-100 text-slate-500'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${cls}`}>
      <Clock size={10} />
      {dias === 0 ? 'Hoy' : dias === 1 ? '1 día' : `${dias}d`}
    </span>
  )
}

function KanbanCard({ item, colIndex, totalCols, onMove, onDelete, onNota }) {
  const [editNota, setEditNota] = useState(false)
  const [nota, setNota] = useState(item.notas || '')

  function saveNota() {
    onNota(item.id, nota)
    setEditNota(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug flex-1">
          {item.nombre}
        </p>
        <button
          onClick={() => onDelete(item.id)}
          className="text-slate-300 hover:text-red-400 transition-colors p-0.5 shrink-0"
          title="Eliminar"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <p className="text-[11px] font-mono text-slate-400">{item.codigo}</p>

      {item.organismo && (
        <p className="text-xs text-slate-500 truncate">{item.organismo}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar size={10} />
          {formatFecha(item.fechaCierre) ?? '—'}
        </div>
        <UrgencyBadge fechaCierre={item.fechaCierre} />
      </div>

      {/* Notes */}
      {editNota ? (
        <div className="space-y-1.5">
          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            rows={3}
            placeholder="Agregar nota..."
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none bg-slate-50"
          />
          <div className="flex gap-1.5">
            <button onClick={saveNota} className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg transition-colors">Guardar</button>
            <button onClick={() => { setNota(item.notas || ''); setEditNota(false) }} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg transition-colors">Cancelar</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditNota(true)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-500 transition-colors"
        >
          <StickyNote size={11} />
          {item.notas ? <span className="truncate max-w-36">{item.notas}</span> : 'Agregar nota'}
        </button>
      )}

      {/* Move buttons */}
      <div className="flex gap-1.5 pt-1">
        {colIndex > 0 && (
          <button
            onClick={() => onMove(item.id, COLUMNAS[colIndex - 1].id)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-2 py-1 rounded-lg transition-all"
          >
            <ChevronLeft size={11} />
            {COLUMNAS[colIndex - 1].label}
          </button>
        )}
        {colIndex < totalCols - 1 && (
          <button
            onClick={() => onMove(item.id, COLUMNAS[colIndex + 1].id)}
            className="flex items-center gap-1 text-xs bg-slate-50 hover:bg-orange-50 text-slate-500 hover:text-orange-600 border border-slate-200 hover:border-orange-200 px-2 py-1 rounded-lg transition-all ml-auto"
          >
            {COLUMNAS[colIndex + 1].label}
            <ChevronRight size={11} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Seguimiento() {
  const [items, setItems] = useState(getSeguimiento())

  function reload() {
    setItems(getSeguimiento())
  }

  function handleMove(id, columna) {
    moveSeguimiento(id, columna)
    reload()
  }

  function handleDelete(id) {
    deleteSeguimiento(id)
    reload()
  }

  function handleNota(id, notas) {
    updateNotasSeguimiento(id, notas)
    reload()
  }

  const total = items.length

  return (
    <div>
      <PageHeader
        title="Seguimiento"
        subtitle={total > 0 ? `${total} licitacion${total !== 1 ? 'es' : ''} en seguimiento` : 'Tablero de postulaciones'}
      />

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
          <KanbanSquare size={52} className="text-slate-200 mb-4" />
          <p className="text-slate-500 font-semibold mb-1">Sin licitaciones en seguimiento</p>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            Abre una licitación y haz clic en "Agregar a seguimiento" para empezar a trackear tus postulaciones
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto">
          {COLUMNAS.map((col, colIndex) => {
            const colItems = items.filter(i => i.columna === col.id)
            const styles = COL_STYLES[col.color]
            return (
              <div key={col.id} className="min-w-52">
                {/* Column header */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 ${styles.header}`}>
                  <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
                  <span className="text-xs font-bold">{col.label}</span>
                  <span className="ml-auto text-xs font-semibold opacity-70">{colItems.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {colItems.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 text-center">
                      <p className="text-xs text-slate-300">Vacío</p>
                    </div>
                  ) : (
                    colItems.map(item => (
                      <KanbanCard
                        key={item.id}
                        item={item}
                        colIndex={colIndex}
                        totalCols={COLUMNAS.length}
                        onMove={handleMove}
                        onDelete={handleDelete}
                        onNota={handleNota}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
