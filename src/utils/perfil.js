import { supabase } from './supabase'

const KEY = 'licitaya_perfil'

const DEFAULT_PERFIL = {
  nombre: '',
  rut: '',
  rubro: '',
  region: '',
  email: '',
  tamano: 'pequeña',
  completado: false,
}

// ─── Local (síncrono) ──────────────────────────────────────────────────────────

export function getPerfil() {
  try {
    return { ...DEFAULT_PERFIL, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { ...DEFAULT_PERFIL }
  }
}

export function savePerfil(data) {
  const perfil = { ...DEFAULT_PERFIL, ...getPerfil(), ...data }
  localStorage.setItem(KEY, JSON.stringify(perfil))
  return perfil
}

export function isPerfilCompleto() {
  const p = getPerfil()
  return !!(p.nombre && p.rubro && p.email)
}

// ─── Cloud (Supabase, asíncrono) ───────────────────────────────────────────────

/**
 * Guarda el perfil en Supabase (upsert por email).
 * Devuelve { ok: true } o { ok: false, error }
 */
export async function savePerfilCloud(data) {
  if (!supabase || !data.email) return { ok: false, error: 'Sin Supabase o sin email' }
  const { error } = await supabase.from('perfiles').upsert(
    {
      email:   data.email,
      nombre:  data.nombre  || null,
      rut:     data.rut     || null,
      rubro:   data.rubro   || null,
      region:  data.region  || null,
      tamano:  data.tamano  || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  )
  if (error) {
    console.warn('[perfil] Error Supabase:', error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

/**
 * Carga el perfil desde Supabase por email.
 * Devuelve el objeto perfil o null si no existe / hay error.
 */
export async function loadPerfilCloud(email) {
  if (!supabase || !email) return null
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('email', email)
    .single()
  if (error || !data) return null
  return {
    nombre:    data.nombre  ?? '',
    rut:       data.rut     ?? '',
    rubro:     data.rubro   ?? '',
    region:    data.region  ?? '',
    email:     data.email   ?? '',
    tamano:    data.tamano  ?? 'pequeña',
    completado: !!(data.nombre && data.rubro && data.email),
  }
}
