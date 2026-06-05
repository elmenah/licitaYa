// Categorías de negocio con keywords para filtrar licitaciones relevantes
// Similar al enfoque de LicitaBien
export const RUBROS = [
  {
    id: 'ferreteria',
    label: 'Ferretería y Materiales',
    emoji: '🔧',
    description: 'Materiales de construcción, herramientas, pinturas, plomería',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    colorActive: 'bg-amber-500 text-white border-amber-500',
    keywords: ['ferretería', 'ferreteria', 'materiales construcción', 'materiales construccion',
      'pinturas', 'herramientas', 'plomería', 'plomeria', 'electricidad', 'tornillos',
      'adhesivos', 'clavos', 'tuberías', 'tuberia', 'cables', 'fittings', 'gasfitería',
      'gasfiteria', 'silicona', 'sellador', 'lija', 'cemento', 'áridos', 'aridos'],
  },
  {
    id: 'tics',
    label: 'TI y Tecnología',
    emoji: '💻',
    description: 'Computadores, software, telecomunicaciones, servicios TI',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    colorActive: 'bg-blue-500 text-white border-blue-500',
    keywords: ['computador', 'laptop', 'notebook', 'tablet', 'software', 'licencia',
      'telecomunicaciones', 'servicio TI', 'servicio ti', 'infraestructura tecnológica',
      'infraestructura tecnologica', 'servidor', 'red', 'switch', 'router', 'firewall',
      'ciberseguridad', 'desarrollo software', 'aplicación', 'aplicacion', 'sistemas',
      'soporte técnico', 'soporte tecnico', 'monitor', 'impresora', 'tóner', 'toner'],
  },
  {
    id: 'aseo',
    label: 'Aseo y Limpieza',
    emoji: '🧹',
    description: 'Servicios de aseo, productos de limpieza, desinfección',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    colorActive: 'bg-cyan-500 text-white border-cyan-500',
    keywords: ['aseo', 'limpieza', 'desinfección', 'desinfeccion', 'sanitización',
      'sanitizacion', 'productos higiene', 'jabón', 'jabon', 'detergente', 'cloro',
      'escoba', 'trapeador', 'paño', 'pano', 'servicio aseo', 'higiene ambiental'],
  },
  {
    id: 'alimentacion',
    label: 'Alimentación',
    emoji: '🍽️',
    description: 'Catering, colaciones, alimentos, víveres',
    color: 'bg-green-50 border-green-200 text-green-700',
    colorActive: 'bg-green-500 text-white border-green-500',
    keywords: ['alimentación', 'alimentacion', 'colación', 'colacion', 'catering',
      'almuerzo', 'desayuno', 'cena', 'víveres', 'viveres', 'abarrotes', 'alimentos',
      'café', 'cafe', 'té', 'te', 'fruta', 'verdura', 'pan', 'lácteos', 'lacteos'],
  },
  {
    id: 'obras',
    label: 'Obras y Mantención',
    emoji: '🏗️',
    description: 'Obras menores, mantención de infraestructura, reparaciones',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    colorActive: 'bg-orange-500 text-white border-orange-500',
    keywords: ['obra menor', 'obras menores', 'mantención', 'mantencion', 'reparación',
      'reparacion', 'manteni', 'infraestructura', 'techado', 'cubierta', 'piso',
      'revestimiento', 'tabique', 'ventana', 'puerta', 'instalación', 'instalacion',
      'eléctrica', 'electrica', 'sanitaria', 'pintura exterior', 'carpintería', 'carpinteria'],
  },
  {
    id: 'salud',
    label: 'Salud e Insumos',
    emoji: '🏥',
    description: 'Insumos médicos, medicamentos, equipos clínicos',
    color: 'bg-red-50 border-red-200 text-red-700',
    colorActive: 'bg-red-500 text-white border-red-500',
    keywords: ['insumo médico', 'insumo medico', 'medicamento', 'fármaco', 'farmaco',
      'clínico', 'clinico', 'hospital', 'laboratorio', 'diagnóstico', 'diagnostico',
      'jeringa', 'guante', 'mascarilla', 'equipo médico', 'equipo medico',
      'dental', 'odontológico', 'odontologico', 'quirúrgico', 'quirurgico'],
  },
  {
    id: 'vestuario',
    label: 'Vestuario y EPP',
    emoji: '👷',
    description: 'Ropa de trabajo, equipos de protección personal, uniformes',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    colorActive: 'bg-purple-500 text-white border-purple-500',
    keywords: ['vestuario', 'uniforme', 'ropa trabajo', 'EPP', 'protección personal',
      'proteccion personal', 'casco', 'guantes', 'chaleco', 'zapatos seguridad',
      'calzado seguridad', 'arnés', 'arnes', 'lentes seguridad', 'overol'],
  },
  {
    id: 'servicios',
    label: 'Servicios Profesionales',
    emoji: '📋',
    description: 'Consultoría, capacitación, asesoría, servicios especializados',
    color: 'bg-slate-50 border-slate-200 text-slate-700',
    colorActive: 'bg-slate-600 text-white border-slate-600',
    keywords: ['consultoría', 'consultoria', 'capacitación', 'capacitacion', 'asesoría',
      'asesoria', 'auditoría', 'auditoria', 'estudio', 'levantamiento', 'diagnóstico',
      'diagnostico', 'evaluación', 'evaluacion', 'formación', 'formacion', 'taller',
      'charla', 'servicio profesional', 'arriendo'],
  },
]

export function filterByRubro(licitaciones, rubroId) {
  const rubro = RUBROS.find(r => r.id === rubroId)
  if (!rubro) return licitaciones
  return licitaciones.filter(l => {
    const nombre = (l.Nombre ?? '').toLowerCase()
    return rubro.keywords.some(kw => nombre.includes(kw.toLowerCase()))
  })
}
