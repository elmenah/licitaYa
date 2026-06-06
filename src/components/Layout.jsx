import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar — solo desktop */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="min-h-screen p-4 pb-24 md:p-8 md:pb-8 md:ml-60">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Navegación inferior — solo móvil */}
      <BottomNav />
    </div>
  )
}
