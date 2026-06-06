import { useState, useEffect } from 'react'
import { Building2, User, MapPin, Mail, Briefcase, CheckCircle, AlertCircle, Server, Info, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'
import { getPerfil, savePerfil, savePerfilCloud, loadPerfilCloud } from '../utils/perfil'
import { REGIONES } from '../utils/regiones'
import { isSupabaseEnabled } from '../utils/supabase'
import { RUBROS } from '../utils/rubros'

const TAMANOS = [
  { value: 'pequeña',  label: 'Pequeña empresa (1–50 empleados)' },
  { value: 'mediana',  label: 'Mediana empresa (51–200 empleados)' },
  { value: 'grande',   label: 'Gran empresa (200+ empleados)' },
]

export default function Perfil() {
  const [form, setForm]               = useState(getPerfil())
  const [saving, setSaving]           = useState(false)
  const [saveStatus, setSaveStatus]   = useState(null)   // null | 'ok' | 'error'
  const [cloudStatus, setCloudStatus] = useState(null)   // null | 'ok' | 'error' | 'loading'
  const [serverStatus, setServerStatus] = useState(null) // null | 'active' | 'offline'
  const [loadingCloud, setLoadingCloud] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    checkServer()
    // Si hay email guardado localmente, intentar cargar desde Supabase
    const local = getPerfil()
    if (isSupabaseEnabled && local.email) {
      syncFromCloud(local.email)
    }
  }, [])

  async function syncFromCloud(email) {
    setLoadingCloud(true)
    try {
      const cloudData = await loadPerfilCloud(email)
      if (cloudData) {
        const merged = { ...cloudData, completado: true }
        savePerfil(merged)
        setForm(merged)
        setCloudStatus('ok')
      }
    } catch {
      // silently fail — local data is fine
    } finally {
      setLoadingCloud(false)
    }
  }

  async function checkServer() {
    try {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), 2000)
      const res = await fetch('/api/health', { signal: ctrl.signal })
      clearTimeout(timeout)
      setServerStatus(res.ok ? 'active' : 'offline')
    } catch {
      setServerStatus('offline')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSaveStatus(null)
    setCloudStatus(null)

    const updated = { ...form, completado: true }

    // 1. Guardar localmente (siempre)
    savePerfil(updated)

    // 2. Guardar en Supabase si está configurado
    if (isSupabaseEnabled && updated.email) {
      setCloudStatus('loading')
      const result = await savePerfilCloud(updated)
      setCloudStatus(result.ok ? 'ok' : 'error')
    }

    setSaveStatus('ok')
    setSaving(false)
    setTimeout(() => setSaveStatus(null), 4000)
  }

  return (
    <div>
      <PageHeader
        title="Mi Empresa"
        subtitle="Configura tu perfil para personalizar LicitaYa"
      />

      <div className="max-w-2xl space-y-6">

        {/* Cloud sync banner */}
        {isSupabaseEnabled && (
          <div className="flex items-center gap-2.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl">
            <Cloud size={14} className="shrink-0" />
            <span>
              <strong>Sincronización en la nube activa</strong> — tu perfil se guarda en Supabase y está disponible desde cualquier dispositivo.
            </span>
            {loadingCloud && <Spinner size="sm" />}
          </div>
        )}

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
                Nombre de la empresa <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  placeholder="Ej: Servicios Industriales SpA"
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Rubro <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    required
                    value={form.rubro}
                    onChange={e => set('rubro', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700 appearance-none"
                  >
                    <option value="">Selecciona tu rubro</option>
                    {RUBROS.map(r => (
                      <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tamaño de empresa</label>
                <select
                  value={form.tamano}
                  onChange={e => set('tamano', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 text-slate-700"
                >
                  <option value="">Selecciona</option>
                  {TAMANOS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Región */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Región donde operas</label>
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
                Email para notificaciones <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="contacto@empresa.cl"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent bg-slate-50 placeholder-slate-400"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Se usa para enviarte alertas y {isSupabaseEnabled ? 'como clave para sincronizar tu perfil en la nube' : 'notificaciones'}
              </p>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-200"
              >
                {saving ? <Spinner size="sm" /> : null}
                {saving ? 'Guardando...' : 'Guardar perfil'}
              </button>

              {saveStatus === 'ok' && !saving && (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-sm text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl">
                    <CheckCircle size={14} />
                    Guardado localmente
                  </span>
                  {isSupabaseEnabled && cloudStatus === 'ok' && (
                    <span className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold bg-blue-50 px-3 py-2 rounded-xl">
                      <Cloud size={14} />
                      Sincronizado en nube
                    </span>
                  )}
                  {isSupabaseEnabled && cloudStatus === 'error' && (
                    <span className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
                      <CloudOff size={14} />
                      Error al sincronizar
                    </span>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Cloud status */}
        {isSupabaseEnabled && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Cloud size={14} className="text-blue-500" />
                </div>
                <span className="text-sm font-bold text-slate-700">Sincronización Supabase</span>
              </div>
              <button
                onClick={() => form.email && syncFromCloud(form.email)}
                disabled={!form.email || loadingCloud}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 disabled:opacity-40 transition-colors"
              >
                <RefreshCw size={12} className={loadingCloud ? 'animate-spin' : ''} />
                Sincronizar
              </button>
            </div>
            {cloudStatus === 'ok' && (
              <p className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                ✓ Perfil sincronizado en Supabase
              </p>
            )}
            {!form.email && (
              <p className="text-xs text-slate-400">Ingresa tu email para activar la sincronización en nube.</p>
            )}
            {form.email && cloudStatus === null && !loadingCloud && (
              <p className="text-xs text-slate-400">Guarda el perfil para sincronizar con Supabase.</p>
            )}
          </div>
        )}

        {/* Server status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Server size={14} className="text-slate-500" />
            </div>
            <span className="text-sm font-bold text-slate-700">Servidor de alertas por email</span>
          </div>

          {serverStatus === null && <p className="text-sm text-slate-400">Verificando...</p>}
          {serverStatus === 'active' && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
              <CheckCircle size={15} className="shrink-0" />
              <span>Servidor activo — alertas por email habilitadas</span>
            </div>
          )}
          {serverStatus === 'offline' && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Servidor no disponible</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Ejecuta <code className="font-mono bg-amber-100 px-1 rounded">npm run dev:all</code> para activar alertas por email
                </p>
              </div>
            </div>
          )}
          <button onClick={checkServer} className="mt-3 text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors">
            Verificar de nuevo
          </button>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
              <Info size={14} className="text-orange-500" />
            </div>
            <span className="text-sm font-bold text-slate-700">Sobre LicitaYa</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong>LicitaYa</strong> conecta directamente con la API oficial de <strong>Mercado Público</strong> para mostrarte licitaciones en tiempo real, organizarlas por rubro y enviarte alertas automáticas cuando aparecen nuevas oportunidades para tu empresa.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-400">API Mercado Público conectada</span>
            {isSupabaseEnabled && (
              <>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-slate-400">Supabase conectado</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
