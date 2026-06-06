import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Search, Target, Bell, MoreHorizontal,
  X, ShoppingCart, BarChart2, KanbanSquare, CalendarDays,
  Settings, Zap,
} from 'lucide-react'
import { getPerfil } from '../utils/perfil'

// 5 ítems principales en la barra inferior
const MAIN = [
  { to: '/',         icon: LayoutDashboard, label: 'Inicio' },
  { to: '/explorar', icon: Search,          label: 'Explorar' },
  { to: '/mi-rubro', icon: Target,          label: 'Mi Rubro' },
  { to: '/alertas',  icon: Bell,            label: 'Alertas' },
]

// Resto en el menú "Más"
const MORE = [
  { to: '/seguimiento', icon: KanbanSquare,  label: 'Seguimiento' },
  { to: '/calendario',  icon: CalendarDays,  label: 'Calendario' },
  { to: '/ordenes',     icon: ShoppingCart,  label: 'Órdenes' },
  { to: '/mercado',     icon: BarChart2,     label: 'Mercado' },
  { to: '/perfil',      icon: Settings,      label: 'Mi Empresa' },
]

export default function BottomNav() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const perfil = getPerfil()

  function goTo(path) {
    setOpen(false)
    navigate(path)
  }

  return (
    <>
      {/* Overlay del menú "Más" */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          {/* Fondo oscuro */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Sheet deslizante desde abajo */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl pb-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Logo */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Zap size={14} className="text-white" />
                </div>
                <span className="font-bold text-slate-800">
                  <span className="text-orange-500">Licita</span>Ya
                </span>
                {perfil.nombre && (
                  <span className="text-xs text-slate-400 ml-1">· {perfil.nombre}</span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X size={14} className="text-slate-500" />
              </button>
            </div>

            {/* Items */}
            <div className="px-4 pt-3 grid grid-cols-3 gap-2">
              {MORE.map(({ to, icon: Icon, label }) => (
                <button
                  key={to}
                  onClick={() => goTo(to)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Icon size={18} className="text-slate-600" />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Barra inferior fija */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex md:hidden safe-bottom">
        {MAIN.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                isActive ? 'text-orange-500' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-orange-50' : ''
                }`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-semibold leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Botón Más */}
        <button
          onClick={() => setOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
            open ? 'text-orange-500' : 'text-slate-400'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${open ? 'bg-orange-50' : ''}`}>
            <MoreHorizontal size={18} strokeWidth={1.8} />
          </div>
          <span className="text-[10px] font-semibold leading-none">Más</span>
        </button>
      </nav>
    </>
  )
}
