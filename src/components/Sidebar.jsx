import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Bell,
  BarChart2,
  ShoppingCart,
  ChevronRight,
  Zap,
  Target,
  KanbanSquare,
  CalendarDays,
  Settings,
} from 'lucide-react'
import { getPerfil } from '../utils/perfil'

const mainNav = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mi-rubro',  icon: Target,          label: 'Mi Rubro' },
  { to: '/explorar',  icon: Search,          label: 'Explorar' },
  { to: '/ordenes',   icon: ShoppingCart,    label: 'Órdenes de Compra' },
  { to: '/alertas',   icon: Bell,            label: 'Mis Alertas' },
  { to: '/mercado',   icon: BarChart2,       label: 'Mercado' },
  { to: '/seguimiento', icon: KanbanSquare,  label: 'Seguimiento' },
  { to: '/calendario',  icon: CalendarDays,  label: 'Calendario' },
]

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-orange-50 text-orange-600 shadow-sm'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            isActive ? 'bg-orange-100' : 'bg-slate-100'
          }`}>
            <Icon size={15} className={isActive ? 'text-orange-500' : 'text-slate-400'} />
          </div>
          <span className="flex-1 leading-none">{label}</span>
          {isActive && <ChevronRight size={13} className="text-orange-400 shrink-0" />}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const perfil = getPerfil()

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-100 flex flex-col z-20 shadow-sm">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-orange-500 leading-none">Licita</span>
            <span className="text-lg font-bold text-slate-800 leading-none">Ya</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">Menú</p>
        {mainNav.map(item => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* Separator */}
        <div className="border-t border-slate-100 my-2 mx-1" />

        <NavItem to="/perfil" icon={Settings} label="Mi Empresa" />
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-100">
        {perfil.completado && perfil.nombre ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-orange-600">
                {perfil.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium truncate">{perfil.nombre}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-slate-400">
              API <span className="font-semibold text-slate-500">Mercado Público</span>
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
