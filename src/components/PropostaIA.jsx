import { useState } from 'react'
import { Sparkles, X, Key, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import Spinner from './Spinner'

const API_KEY_STORAGE = 'licitaya_claude_key'
const OPENAI_MODEL = 'gpt-4.1-mini'

function getKey() { return localStorage.getItem(API_KEY_STORAGE) ?? '' }
function saveKey(k) { localStorage.setItem(API_KEY_STORAGE, k) }

function buildPrompt(lic) {
  return `Eres un experto en licitaciones públicas chilenas y asesor de empresas de Mantenimiento Industrial.

La empresa que asesoras se llama "Mantenimiento Industrial" y ofrece servicios de mantención, reparación, instalación eléctrica/mecánica y mantención preventiva/correctiva de equipos industriales.

Analiza esta licitación y ayuda a preparar la postulación:

**LICITACIÓN:**
- Código: ${lic.CodigoExterno}
- Nombre: ${lic.Nombre}
- Organismo: ${lic.Comprador?.NombreOrganismo ?? '—'}
- Región: ${lic.Comprador?.RegionUnidad ?? '—'}
- Monto estimado: ${lic.MontoEstimado ? `$${lic.MontoEstimado.toLocaleString('es-CL')} CLP` : 'No informado'}
- Fecha cierre: ${lic.Fechas?.FechaCierre ?? '—'}
- Descripción: ${lic.Descripcion ?? 'No disponible'}
- Ítems: ${lic.Items?.Listado?.map(i => `${i.NombreEspanol ?? i.Descripcion} (cant: ${i.Cantidad})`).join(', ') ?? 'No disponible'}

Genera un análisis estructurado con estas secciones en Markdown:

## 1. ¿Vale la pena postular?
Análisis rápido de si la licitación es viable para la empresa (sí/no/condicionado y por qué).

## 2. Documentos requeridos
Lista los documentos típicos para este tipo de licitación en Chile (certificados, antecedentes legales, técnicos, económicos). Incluye los que generalmente pide ChileCompra.

## 3. Estructura de propuesta técnica
Cómo organizar la propuesta: secciones, contenido clave, qué destacar de la empresa.

## 4. Fortalezas a destacar
Qué ventajas específicas debe resaltar una empresa de Mantenimiento Industrial para esta licitación.

## 5. Preguntas para el foro de aclaraciones
3-5 preguntas estratégicas para hacer en el foro de preguntas de la licitación.

## 6. Estimación de precio referencial
Rango de precios sugerido y cómo estructurar la oferta económica.

Responde de forma práctica y concisa. Usa formato Markdown.`
}

function renderMarkdown(text) {
  return text
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-slate-800 mt-4 mb-1.5">{line.slice(3)}</h3>
      if (line.startsWith('### ')) return <h4 key={i} className="text-xs font-bold text-slate-700 mt-3 mb-1">{line.slice(4)}</h4>
      if (line.startsWith('- ') || line.startsWith('* ')) return (
        <div key={i} className="flex gap-2 text-xs text-slate-600 mb-0.5">
          <span className="text-orange-400 shrink-0">•</span>
          <span>{line.slice(2)}</span>
        </div>
      )
      if (line.match(/^\d+\./)) return <div key={i} className="text-xs text-slate-600 mb-0.5 pl-1">{line}</div>
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-xs font-bold text-slate-700 mt-2">{line.slice(2, -2)}</p>
      if (!line.trim()) return <div key={i} className="h-1" />
      // Handle inline bold
      const parts = line.split(/\*\*(.*?)\*\*/)
      return (
        <p key={i} className="text-xs text-slate-600 mb-0.5 leading-relaxed">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        </p>
      )
    })
}

export default function PropostaIA({ licitacion }) {
  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState(getKey)
  const [editKey, setEditKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  async function generate() {
    if (!apiKey.trim()) { setEditKey(true); return }
    saveKey(apiKey.trim())
    setLoading(true)
    setError(null)
    setResult('')

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.3,
          max_tokens: 2000,
          messages: [
            { role: 'user', content: buildPrompt(licitacion) },
          ],
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      setResult(data.choices?.[0]?.message?.content ?? '')
    } catch (e) {
      setError(e.message ?? 'Error al conectar con OpenAI')
    } finally {
      setLoading(false)
    }
  }

  function copyResult() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-sm font-bold py-3 px-5 rounded-2xl transition-all shadow-lg shadow-purple-200 active:scale-95"
      >
        <Sparkles size={16} />
        Preparar propuesta con IA
      </button>
    )
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-purple-900">Asistente IA de Propuesta</p>
            <p className="text-[11px] text-purple-600">OpenAI · Mantenimiento Industrial</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditKey(e => !e)} className="text-purple-400 hover:text-purple-600 p-1">
            <Key size={14} />
          </button>
          <button onClick={() => setOpen(false)} className="text-purple-400 hover:text-purple-600 p-1">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* API Key config */}
      {(editKey || !apiKey) && (
        <div className="mb-4 bg-white rounded-xl border border-purple-200 p-3">
          <label className="block text-xs font-semibold text-purple-700 mb-1.5 flex items-center gap-1">
            <Key size={11} /> OpenAI API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 text-xs px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <button
              onClick={() => { saveKey(apiKey); setEditKey(false) }}
              className="text-xs bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600"
            >
              Guardar
            </button>
          </div>
          <p className="text-[10px] text-purple-400 mt-1">Se guarda localmente en tu navegador. Obtén tu key en platform.openai.com</p>
        </div>
      )}

      {/* Generate button */}
      {!result && !loading && (
        <button
          onClick={generate}
          disabled={!apiKey}
          className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 px-5 rounded-xl transition-colors mb-3"
        >
          <Sparkles size={15} />
          Analizar y generar propuesta
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-purple-600 font-medium">OpenAI está analizando la licitación...</p>
          <p className="text-xs text-purple-400">Esto puede tomar 15-30 segundos</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl mb-3">
          {error}
          {error.includes('401') && ' — Verifica tu API Key de OpenAI.'}
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-purple-700">Análisis generado por OpenAI</p>
            <div className="flex items-center gap-2">
              <button onClick={copyResult} className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 font-medium">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button onClick={() => setCollapsed(c => !c)} className="text-purple-400 hover:text-purple-600">
                {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
          </div>

          {!collapsed && (
            <div className="bg-white rounded-xl border border-purple-100 p-4 max-h-96 overflow-y-auto">
              {renderMarkdown(result)}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={generate}
              className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 px-3 py-1.5 rounded-lg transition-all"
            >
              <Sparkles size={11} /> Regenerar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
