import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 p-8 min-h-screen" style={{ marginLeft: '15rem' }}>
        {children}
      </main>
    </div>
  )
}
