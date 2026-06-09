/**
 * LicitaYa — Alertas en Supabase
 *
 * Tabla `alertas` en Supabase (ver SQL en README o docs):
 *   id                bigserial primary key
 *   email             text not null
 *   nombre            text
 *   estado            text
 *   activa            boolean default true
 *   codigos_notificados text[] default '{}'
 *   ultima_ejecucion  timestamptz
 *   creado_en         timestamptz default now()
 */

import { supabase, isSupabaseEnabled } from './supabase'

// Convierte fila de Supabase → formato interno
function mapRow(a) {
  return {
    id:                  a.id,
    nombre:              a.nombre              ?? '',
    estado:              a.estado              ?? '',
    email:               a.email,
    activa:              a.activa              ?? true,
    creadoEn:            a.creado_en,
    ultimaEjecucion:     a.ultima_ejecucion    ?? null,
    codigosNotificados:  a.codigos_notificados ?? [],
  }
}

/** Carga todas las alertas del usuario desde Supabase. Devuelve null si no hay acceso. */
export async function getAlertsCloud(email) {
  if (!isSupabaseEnabled || !email) return null
  const { data, error } = await supabase
    .from('alertas')
    .select('*')
    .eq('email', email)
    .eq('activa', true)
    .order('creado_en', { ascending: false })

  if (error) {
    console.warn('[alertasCloud] getAlertsCloud error:', error.message)
    return null
  }
  return data.map(mapRow)
}

/** Guarda una nueva alerta en Supabase. Devuelve la alerta creada o null. */
export async function saveAlertCloud(alert, email) {
  if (!isSupabaseEnabled || !email) return null
  const { data, error } = await supabase
    .from('alertas')
    .insert({
      email,
      nombre:             alert.nombre  || null,
      estado:             alert.estado  || null,
      activa:             true,
      codigos_notificados: [],
      creado_en:          new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.warn('[alertasCloud] saveAlertCloud error:', error.message)
    return null
  }
  return mapRow(data)
}

/** Soft-delete (activa = false) de una alerta. Devuelve true si ok. */
export async function deleteAlertCloud(id) {
  if (!isSupabaseEnabled) return false
  const { error } = await supabase
    .from('alertas')
    .update({ activa: false })
    .eq('id', id)

  if (error) {
    console.warn('[alertasCloud] deleteAlertCloud error:', error.message)
    return false
  }
  return true
}
