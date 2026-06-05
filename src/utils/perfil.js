const KEY = 'licitaya_perfil'

const DEFAULT_PERFIL = {
  nombre: '',
  rut: '',
  rubro: '',
  region: '',
  email: '',
  tamano: '',
  completado: false,
}

export function getPerfil() {
  try {
    return { ...DEFAULT_PERFIL, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { ...DEFAULT_PERFIL }
  }
}

export function savePerfil(data) {
  const perfil = { ...DEFAULT_PERFIL, ...data }
  localStorage.setItem(KEY, JSON.stringify(perfil))
  return perfil
}

export function isPerfilCompleto() {
  const perfil = getPerfil()
  return perfil.completado === true
}
