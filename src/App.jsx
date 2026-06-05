import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Explorar from './pages/Explorar'
import OrdenesDeCompra from './pages/OrdenesDeCompra'
import MiRubro from './pages/MiRubro'
import MisAlertas from './pages/MisAlertas'
import Mercado from './pages/Mercado'
import DetalleLicitacion from './pages/DetalleLicitacion'
import Perfil from './pages/Perfil'
import Seguimiento from './pages/Seguimiento'
import Calendario from './pages/Calendario'
import { OnboardingGate } from './components/Onboarding'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <OnboardingGate />
        <Routes>
          <Route path="/"                   element={<Dashboard />} />
          <Route path="/mi-rubro"           element={<MiRubro />} />
          <Route path="/explorar"           element={<Explorar />} />
          <Route path="/ordenes"            element={<OrdenesDeCompra />} />
          <Route path="/alertas"            element={<MisAlertas />} />
          <Route path="/mercado"            element={<Mercado />} />
          <Route path="/licitacion/:codigo" element={<DetalleLicitacion />} />
          <Route path="/perfil"             element={<Perfil />} />
          <Route path="/seguimiento"        element={<Seguimiento />} />
          <Route path="/calendario"         element={<Calendario />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
