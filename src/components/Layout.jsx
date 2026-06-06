import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar — solo desktop */}
      <Sidebar />

      {/* Contenido principal
          pb-24    = fallback estático (96px) para navegadores sin soporte env()
          pb-nav-safe = con safe area support: 5rem + env(safe-area-inset-bottom)
          md:pb-8  = desktop no necesita compensar la barra inferior */}
      <main className="min-h-screen p-4 pb-24 pb-nav-safe md:p-8 md:pb-8 md:ml-60">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Navegación inferior — solo móvil */}
      <BottomNav />
    </div>
  )
}
