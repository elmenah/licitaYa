/**
 * LicitaYa — Alertas en Supabase
 *
 * Tabla `alertas` en Supabase:
 *   id                  bigserial primary key
 *   email               text not null
 *   nombre              text          -- keyword libre O rubroId (p.ej. "aseo")
 *   estado              text          -- solo para tipo 'keyword'
 *   tipo                text          -- 'keyword' | 'rubro'  (default 'keyword')
 *   activa              boolean default true
 *   codigos_notificados text[] default '{}'
 *   ultima_ejecucion    timestamptz
 *   creado_en           timestamptz default now()
 *
 * SQL para agregar columna tipo (ejecutar una vez en Supabase):
 *   ALTER TABLE alertas ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'keyword';
 */

import { supabase, isSupabaseEnabled } from './supabase'

// Convierte fila de Supabase → formato interno
function mapRow(a) {
  return {
    id:                  a.id,
    nombre:              a.nombre              ?? '',
    estado:              a.estado              ?? '',
    tipo:                a.tipo                ?? 'keyword',
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

// ─── Alertas por RUBRO ─────────────────────────────────────────────────────────

/**
 * Devuelve los rubroIds con alerta activa para un email.
 * Resultado: [{ id, rubroId }]
 */
export async function getRubroAlerts(email) {
  if (!isSupabaseEnabled || !email) return []
  const { data, error } = await supabase
    .from('alertas')
    .select('id, nombre')
    .eq('email', email)
    .eq('tipo', 'rubro')
    .eq('activa', true)
  if (error) {
    console.warn('[alertasCloud] getRubroAlerts error:', error.message)
    return []
  }
  return data.map(r => ({ id: r.id, rubroId: r.nombre }))
}

/**
 * Activa una alerta de rubro. Si ya existe activa para ese rubro+email, no duplica.
 * Devuelve la alerta creada/existente o null.
 */
export async function saveRubroAlert(rubroId, email) {
  if (!isSupabaseEnabled || !email || !rubroId) return null

  // Evitar duplicados
  const { data: existing } = await supabase
    .from('alertas')
    .select('id, nombre')
    .eq('email', email)
    .eq('nombre', rubroId)
    .eq('tipo', 'rubro')
    .eq('activa', true)
    .maybeSingle()

  if (existing) return { id: existing.id, rubroId: existing.nombre }

  const { data, error } = await supabase
    .from('alertas')
    .insert({
      email,
      nombre:              rubroId,
      tipo:                'rubro',
      activa:              true,
      codigos_notificados: [],
      creado_en:           new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.warn('[alertasCloud] saveRubroAlert error:', error.message)
    return null
  }
  return { id: data.id, rubroId: data.nombre }
}

/**
 * Desactiva la alerta de un rubro específico.
 */
export async function deleteRubroAlert(rubroId, email) {
  if (!isSupabaseEnabled || !email || !rubroId) return false
  const { error } = await supabase
    .from('alertas')
    .update({ activa: false })
    .eq('email', email)
    .eq('nombre', rubroId)
    .eq('tipo', 'rubro')
  if (error) {
    console.warn('[alertasCloud] deleteRubroAlert error:', error.message)
    return false
  }
  return true
}
