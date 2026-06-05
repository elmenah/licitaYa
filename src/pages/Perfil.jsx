import { useState, useEffect } from 'react'
import { Building2, User, MapPin, Mail, Briefcase, CheckCircle, AlertCircle, Server, Info } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { getPerfil, savePerfil } from '../utils/perfil'
import { REGIONES } from '../utils/regiones'

const RUBROS = [
  { value: 'ferreteria',  label: 'Ferretería y construcción' },
  { value: 'tics',        label: 'TICs y tecnología' },
  { value: 'aseo',        label: 'Aseo y limpieza' },
  { value: 'alimentacion',label: 'Alimentación' },
  { value: 'obras',       label: 'Obras y construcción' },
  { value: 'salud',       label: 'Salud y equipamiento médico' },
  { value: 'vestuario',   label: 'Vestuario y calzado' },
  { value: 'servicios',   label: 'Servicios profesionales' },
  { value: 'otro',        label: 'Otro' },
]

const TAMANOS = [
  { value: 'pequeña',  label: 'Pequeña empresa' },
  { value: 'mediana',  label: 'Mediana empresa' },
  { value: 'grande',   label: 'Gran empresa' },
]

export default function Perfil() {
  const [form, setForm] = useState(getPerfil())
  const [saved, setSaved] = useState(false)
  const [serverStatus, setServerStatus] = useState(null) // null | 'active' | 'offline'

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    checkServer()
  }, [])

  async function checkServer() {
    try {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), 2000)
      const res = await fetch('/api/health', { signal: ctrl.signal })
      clearTimeout(timeout)
      if (res.ok) setServerStatus('active')
      else setServerStatus('offline')
    } catch {
      setServerStatus('offline')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    savePerfil({ ...form, completado: true })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <PageHeader
        title="Mi Empresa"
        subtitle="Configura tu perfil para personalizar LicitaYa"
      />

      <div className="max-w-2xl space-y-6">
        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
              <Building2 size={14} className="text-orange-500" />
            </div>
            <span className="text-sm font-bold text-slate-700">Datos de la empresa</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nombre de la empresa
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  placeholder="Ej: Soluciones Tecnológicas SpA"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent bg-slate-50 placeholder-slate-400"
                />
              </div>
            </div>

            {/* RUT */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">RUT</label>
              <input
                type="text"
                value={form.rut}
                onChange={e => set('rut', e.target.value)}
                placeholder="76.123.456-7"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent bg-slate-50 placeholder-slate-400"
              />
            </div>

            {/* Rubro + Tamaño */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rubro</label>
                <div className="relative">
                  <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={form.rubro}
                    onChange={e => set('rubro', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700 appearance-none"
                  >
                    <option value="">Selecciona tu rubro</option>
                    {RUBROS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tamaño</label>
                <select
                  value={form.tamano}
                  onChange={e => set('tamano', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700"
                >
                  <option value="">Selecciona tamaño</option>
                  {TAMANOS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Región */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Región</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={form.region}
                  onChange={e => set('region', e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700 appearance-none"
                >
                  <option value="">Selecciona tu región</option>
                  {REGIONES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email para notificaciones
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="contacto@empresa.cl"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent bg-slate-50 placeholder-slate-400"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Se usará para enviarte alertas de nuevas licitaciones</p>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-200"
              >
                Guardar perfil
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl">
                  <CheckCircle size={14} />
                  Guardado correctamente
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Server status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Server size={14} className="text-slate-500" />
            </div>
            <span className="text-sm font-bold text-slate-700">Estado de notificaciones</span>
          </div>

          {serverStatus === null && (
            <p className="text-sm text-slate-400">Verificando servidor...</p>
          )}
          {serverStatus === 'active' && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
              <CheckCircle size={15} className="shrink-0" />
              <span>Servidor activo — notificaciones por email habilitadas</span>
            </div>
          )}
          {serverStatus === 'offline' && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Servidor no disponible</p>
                <p className="text-xs text-amber-600 mt-0.5">Ejecuta <code className="font-mono bg-amber-100 px-1 rounded">npm run server</code> para activar alertas por email</p>
              </div>
            </div>
          )}

          <button
            onClick={checkServer}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
          >
            Verificar de nuevo
          </button>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
              <Info size={14} className="text-orange-500" />
            </div>
            <span className="text-sm font-bold text-slate-700">Sobre LicitaYa</span>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              <strong>LicitaYa</strong> es un monitor de licitaciones del mercado público chileno que te ayuda a encontrar oportunidades de negocio con el Estado.
            </p>
            <p>
              Conecta directamente con la API oficial de <strong>Mercado Público</strong> para mostrarte licitaciones en tiempo real, organizarlas por rubro y enviarte alertas automáticas.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-400">API Mercado Público conectada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
