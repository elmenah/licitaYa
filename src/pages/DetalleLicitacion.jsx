import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Calendar, ExternalLink, Clock, Building2,
  MapPin, AlertTriangle, Tag, Download, User, FileText,
} from 'lucide-react'
import Spinner from '../components/Spinner'
import ProbabilidadCard from '../components/ProbabilidadCard'
import PropostaIA from '../components/PropostaIA'
import { fetchLicitacion } from '../utils/api'
import { formatMonto, formatFechaHora, formatUbicacion, getEstadoBadge, diasRestantes, isActiva } from '../utils/formatters'

const MERCADO_PUBLICO_MENU_URL = 'https://www.mercadopublico.cl/Portal/Modules/Menu/Menu.aspx'

const GUIA_SIGLAS = {
  tipos: [
    ['L1', 'Licitación Pública menor a 100 UTM'],
    ['LE', 'Licitación Pública entre 100 y 1000 UTM'],
    ['LP', 'Licitación Pública mayor a 1000 UTM'],
    ['LS', 'Licitación Pública de servicios personales especializados'],
    ['A1', 'Licitación Privada por licitación pública anterior sin oferentes'],
    ['B1', 'Licitación Privada por otras causales excluidas de la ley de compras'],
    ['J1', 'Licitación Privada por servicios de naturaleza confidencial'],
    ['F1', 'Licitación Privada por convenios con personas jurídicas extranjeras'],
    ['E1', 'Licitación Privada por remanente de contrato anterior'],
    ['B2', 'Licitación Privada entre 100 y 1000 UTM'],
    ['A2', 'Licitación Privada mayor a 1000 UTM'],
    ['D1', 'Trato Directo por proveedor único'],
    ['C2', 'Trato Directo por cotización'],
    ['C1', 'Compra Directa u orden de compra'],
    ['F2', 'Trato Directo por cotización'],
    ['F3', 'Compra Directa u orden de compra'],
    ['G2', 'Directo por cotización'],
    ['G1', 'Compra Directa u orden de compra'],
    ['R1', 'Orden de compra menor a 3 UTM'],
    ['CA', 'Orden de compra sin resolución'],
    ['SE', 'Orden de compra proveniente de adquisición sin emisión automática'],
  ],
  monedas: [
    ['CLP', 'Peso chileno'],
    ['CLF', 'Unidad de Fomento'],
    ['USD', 'Dólar americano'],
    ['UTM', 'Unidad Tributaria Mensual'],
    ['EUR', 'Euro'],
  ],
  montos: [
    ['1', 'Presupuesto disponible'],
    ['2', 'Precio referencial'],
  ],
  pagos: [
    ['1', 'Pago a 30 días'],
    ['2', 'Pago a 30, 60 y 90 días'],
    ['3', 'Pago al día'],
    ['4', 'Pago anual'],
    ['5', 'Pago a 60 días'],
    ['6', 'Pagos mensuales'],
    ['7', 'Pago contra entrega conforme'],
    ['8', 'Pago bimensual'],
    ['9', 'Pago por estado de avance'],
    ['10', 'Pago trimestral'],
  ],
  tiempos: [
    ['1', 'Horas'],
    ['2', 'Días'],
    ['3', 'Semanas'],
    ['4', 'Meses'],
    ['5', 'Años'],
  ],
  actos: [
    ['1', 'Autorización'],
    ['2', 'Resolución'],
    ['3', 'Otros'],
    ['4', 'Acuerdo'],
    ['5', 'Decreto'],
  ],
  binarios: [
    ['Informada', '1 = Sí, 0 = No'],
    ['CodigoTipo', '1 = Pública, 2 = Privada'],
    ['TomaRazon', '1 = Sí, 0 = No'],
    ['EstadoPublicidadOfertas', '1 = Sí, 0 = No'],
    ['Contrato', '1 = Sí, 0 = No'],
    ['Obras', '2 = Sí, 1 = No'],
    ['VisibilidadMonto', '1 = Sí, 0 = No'],
    ['SubContratacion', '1 = Sí, 0 = No'],
    ['ExtensionPlazo', '1 = Extiende, 0 = No extiende'],
    ['EsBaseTipo', '1 = Sí, 0 = No'],
    ['EsRenovable', '1 = Sí, 0 = No'],
  ],
}

function InfoRow({ icon: Icon, label, value, mono = false }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-slate-500" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</h2>
      {children}
    </div>
  )
}

export default function DetalleLicitacion() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  const [lic, setLic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchLicitacion(decodeURIComponent(codigo))
        if (!cancelled) setLic(data)
      } catch {
        if (!cancelled) setError('No se pudo cargar esta licitación.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [codigo])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400">Cargando detalle...</p>
      </div>
    )
  }

  if (error || !lic) {
    return (
      <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
        <AlertTriangle size={40} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-600 font-medium mb-4">{error ?? 'Licitación no encontrada'}</p>
        <button onClick={() => navigate(-1)} className="text-orange-500 hover:text-orange-600 text-sm font-semibold">
          ← Volver
        </button>
      </div>
    )
  }

  const badge = getEstadoBadge(lic.CodigoEstado)
  const fechaCierre = lic.Fechas?.FechaCierre ?? lic.FechaCierre
  const dias = diasRestantes(fechaCierre)
  const activa = isActiva(lic)
  const monto = lic.VisibilidadMonto === 1 ? null : formatMonto(lic.MontoEstimado, lic.Moneda)
  const ubicacion = formatUbicacion({
    region: lic.Comprador?.RegionUnidad ?? lic.Comprador?.Region,
    comuna: lic.Comprador?.ComunaUnidad ?? lic.Comprador?.Comuna,
    direccion: lic.Comprador?.DireccionUnidad,
  })

  const urgencia = activa && dias !== null
    ? dias <= 1 ? 'critical' : dias <= 3 ? 'high' : dias <= 7 ? 'medium' : null
    : null

  return (
    <div>
      {/* Back + Acciones */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          <ArrowLeft size={15} />
          Volver
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <Download size={14} />
          Descargar ficha
        </button>
      </div>

      {/* Encabezado visible al imprimir */}
      <div className="hidden print:block mb-6 pb-4 border-b border-slate-300">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={16} className="text-orange-500" />
          <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">LicitaYa · Ficha de licitación</span>
        </div>
        <p className="text-xs text-slate-400">Generado el {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Hero card */}
      <div className={`bg-white rounded-2xl border p-6 mb-6 ${
        urgencia === 'critical' ? 'border-red-300' : urgencia === 'high' ? 'border-orange-300' : 'border-slate-200'
      }`}>
        {urgencia && (
          <div className={`flex items-center gap-2 text-xs font-bold mb-4 px-3 py-2 rounded-xl w-fit ${
            urgencia === 'critical' ? 'bg-red-50 text-red-600' :
            urgencia === 'high' ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-700'
          }`}>
            <Clock size={13} />
            {dias === 0 ? 'CIERRA HOY' : dias === 1 ? 'CIERRA MAÑANA' : `CIERRA EN ${dias} DÍAS`}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 leading-snug mb-2">{lic.Nombre}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400">{lic.CodigoExterno}</span>
              {lic.Tipo && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">{lic.Tipo}</span>
              )}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ring-1 ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
          </div>
          {monto && (
            <div className="sm:shrink-0 sm:text-right">
              <p className="text-xs text-slate-500 mb-0.5">Monto estimado</p>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{monto}</p>
            </div>
          )}
        </div>

        {/* Quick stats */}
        {lic.CantidadReclamos > 0 && (
          <div className="flex items-center gap-1.5 mt-4 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl w-fit">
            <AlertTriangle size={12} />
            {lic.CantidadReclamos} reclamo{lic.CantidadReclamos !== 1 ? 's' : ''} registrado{lic.CantidadReclamos !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Organismo */}
        <Section title="Organismo comprador">
          <InfoRow icon={Building2} label="Organismo" value={lic.Comprador?.NombreOrganismo} />
          <InfoRow icon={Building2} label="Unidad" value={lic.Comprador?.NombreUnidad} />
          <InfoRow icon={MapPin} label="Ubicación" value={ubicacion} />
          <InfoRow icon={User} label="Responsable" value={lic.Comprador?.NombreUsuario} />
          <InfoRow icon={Tag} label="Cargo" value={lic.Comprador?.CargoUsuario} />
        </Section>

        {/* Fechas */}
        <Section title="Fechas clave">
          <InfoRow icon={Calendar} label="Publicación" value={formatFechaHora(lic.Fechas?.FechaPublicacion)} />
          <InfoRow icon={Calendar} label="Cierre de ofertas" value={formatFechaHora(lic.Fechas?.FechaCierre)} />
          <InfoRow icon={Calendar} label="Apertura técnica" value={formatFechaHora(lic.Fechas?.FechaActoAperturaTecnica)} />
          <InfoRow icon={Calendar} label="Apertura económica" value={formatFechaHora(lic.Fechas?.FechaActoAperturaEconomica)} />
          <InfoRow icon={Calendar} label="Adjudicación estimada" value={formatFechaHora(lic.Fechas?.FechaEstimadaAdjudicacion)} />
          {lic.Fechas?.FechaVisitaTerreno && (
            <InfoRow icon={MapPin} label="Visita a terreno" value={formatFechaHora(lic.Fechas.FechaVisitaTerreno)} />
          )}
        </Section>
      </div>

      {/* Descripción */}
      {lic.Descripcion && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Descripción</h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{lic.Descripcion}</p>
        </div>
      )}

      {/* Items */}
      {lic.Items?.Listado?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Ítems requeridos ({lic.Items.Listado.length})
          </h2>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-96">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500">#</th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500">Descripción</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500">Cantidad</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {lic.Items.Listado.map((item, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 text-xs text-slate-400 pr-3">{i + 1}</td>
                    <td className="py-2.5 text-slate-700">{item.NombreEspanol ?? item.Descripcion ?? '—'}</td>
                    <td className="py-2.5 text-right text-slate-600 font-medium">{item.Cantidad?.toLocaleString('es-CL')}</td>
                    <td className="py-2.5 text-right text-slate-400 text-xs">{item.UnidadMedida ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guía */}
      <div className="print-hide-ai bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Guía de siglas</h2>
        <p className="text-sm text-slate-500 mb-4">
          Estas siglas explican el tipo de licitación y otros campos técnicos que aparecen en Mercado Público.
        </p>

        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Tipo de licitación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {GUIA_SIGLAS.tipos.map(([codigo, descripcion]) => (
                <div key={codigo} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="inline-flex shrink-0 font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">{codigo}</span>
                  <span className="text-xs text-slate-600 text-right">{descripcion}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Unidad monetaria</h3>
              <div className="space-y-2">
                {GUIA_SIGLAS.monedas.map(([codigo, descripcion]) => (
                  <div key={codigo} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{codigo}</span>
                    <span className="text-xs text-slate-500">{descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Monto estimado</h3>
              <div className="space-y-2">
                {GUIA_SIGLAS.montos.map(([codigo, descripcion]) => (
                  <div key={codigo} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{codigo}</span>
                    <span className="text-xs text-slate-500">{descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Modalidad de pago</h3>
              <div className="space-y-2">
                {GUIA_SIGLAS.pagos.map(([codigo, descripcion]) => (
                  <div key={codigo} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{codigo}</span>
                    <span className="text-xs text-slate-500">{descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Unidad de tiempo</h3>
              <div className="space-y-2">
                {GUIA_SIGLAS.tiempos.map(([codigo, descripcion]) => (
                  <div key={codigo} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{codigo}</span>
                    <span className="text-xs text-slate-500">{descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Acto administrativo</h3>
              <div className="space-y-2">
                {GUIA_SIGLAS.actos.map(([codigo, descripcion]) => (
                  <div key={codigo} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{codigo}</span>
                    <span className="text-xs text-slate-500">{descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Valores binarios frecuentes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {GUIA_SIGLAS.binarios.map(([campo, descripcion]) => (
                <div key={campo} className="rounded-xl border border-slate-100 px-3 py-2 bg-slate-50">
                  <p className="text-xs font-bold text-slate-700 mb-0.5">{campo}</p>
                  <p className="text-xs text-slate-500">{descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Probabilidad + IA */}
      <div className="print-hide-ai grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ProbabilidadCard licitacion={lic} />
        <PropostaIA licitacion={lic} />
      </div>

      {/* CTA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-0 print:hidden">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ofertar en Mercado Público</p>

        {/* Paso a paso */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-0.5">Copia el código de la licitación</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm font-bold text-slate-800">{lic.CodigoExterno}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(lic.CodigoExterno)
                  }}
                  className="text-xs text-orange-500 hover:text-orange-600 font-semibold border border-orange-200 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Copiar
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-slate-700">
              Ingresa a Mercado Público con tu <strong>cuenta de proveedor</strong> y ve al apartado{' '}
              <strong className="text-orange-600">"Búsqueda de Licitaciones para Ofertar"</strong>
            </p>
          </div>

          <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-slate-700">Pega el código en el buscador y haz clic en <strong>Buscar</strong></p>
          </div>
        </div>

        <a
          href={MERCADO_PUBLICO_MENU_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-200"
        >
          <ExternalLink size={14} />
          Ir a Mercado Público → Búsqueda de Licitaciones para Ofertar
        </a>
      </div>
      <div className="flex items-center gap-3 mt-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-700 font-medium px-4 py-2.5"
        >
          ← Volver
        </button>
      </div>
    </div>
  )
}
