import { useState } from 'react'
import { Zap, X, ArrowRight, Check, Building2, Mail, Briefcase, MapPin } from 'lucide-react'
import { savePerfil, isPerfilCompleto } from '../utils/perfil'
import { REGIONES } from '../utils/regiones'

const SKIP_KEY = 'licitaya_onboarding_skip'

const RUBROS = [
  { value: 'ferreteria',   label: 'Ferretería y construcción' },
  { value: 'tics',         label: 'TICs y tecnología' },
  { value: 'aseo',         label: 'Aseo y limpieza' },
  { value: 'alimentacion', label: 'Alimentación' },
  { value: 'obras',        label: 'Obras' },
  { value: 'salud',        label: 'Salud' },
  { value: 'vestuario',    label: 'Vestuario' },
  { value: 'servicios',    label: 'Servicios profesionales' },
  { value: 'otro',         label: 'Otro' },
]

const STEPS = [
  { title: '¡Bienvenido a LicitaYa!', subtitle: 'El monitor de licitaciones del Estado chileno' },
  { title: 'Cuéntanos tu negocio', subtitle: 'Para personalizar tus resultados' },
  { title: 'Todo listo', subtitle: 'Así funciona LicitaYa' },
]

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({ nombre: '', email: '', rubro: '', region: '' })

  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  function skip() {
    localStorage.setItem(SKIP_KEY, '1')
    onClose()
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }

  function complete() {
    savePerfil({ ...data, completado: true })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={skip} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Top gradient */}
        <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{STEPS[step].title}</h2>
              <p className="text-xs text-slate-400">{STEPS[step].subtitle}</p>
            </div>
          </div>
          <button onClick={skip} className="text-slate-300 hover:text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 px-6 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-orange-500' : i < step ? 'w-4 bg-orange-300' : 'w-4 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Step 0 */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                LicitaYa te ayuda a encontrar licitaciones del Estado chileno relevantes para tu empresa y recibirlas por email.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nombre de la empresa
                </label>
                <div className="relative">
                  <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={data.nombre}
                    onChange={e => set('nombre', e.target.value)}
                    placeholder="Tu empresa SpA"
                    autoFocus
                    className="w-full pl-8 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 placeholder-slate-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Email para alertas
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={data.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="contacto@empresa.cl"
                    className="w-full pl-8 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rubro principal</label>
                <div className="relative">
                  <Briefcase size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={data.rubro}
                    onChange={e => set('rubro', e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700 appearance-none"
                  >
                    <option value="">Selecciona tu rubro</option>
                    {RUBROS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Región</label>
                <div className="relative">
                  <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={data.region}
                    onChange={e => set('region', e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700 appearance-none"
                  >
                    <option value="">Selecciona tu región</option>
                    {REGIONES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-3">
              {[
                { icon: '🔍', text: 'Explora miles de licitaciones del mercado público' },
                { icon: '🔔', text: 'Guarda alertas y recibe licitaciones nuevas por email' },
                { icon: '📋', text: 'Sigue tus postulaciones en un tablero Kanban' },
                { icon: '📅', text: 'Revisa los próximos cierres en el calendario' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl">
                  <span className="text-base">{icon}</span>
                  <p className="text-sm text-slate-700">{text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={skip}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Omitir por ahora
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-200"
              >
                Siguiente <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={complete}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-200"
              >
                <Check size={14} />
                Comenzar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrapper that decides whether to render
export function OnboardingGate() {
  const [show, setShow] = useState(() => {
    if (isPerfilCompleto()) return false
    if (localStorage.getItem('licitaya_onboarding_skip')) return false
    return true
  })

  if (!show) return null
  return <Onboarding onClose={() => setShow(false)} />
}
