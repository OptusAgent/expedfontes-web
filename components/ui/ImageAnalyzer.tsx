'use client'

import { useState, useRef } from 'react'
import { Upload, Camera, Zap, CheckCircle, X, FileImage, AlertCircle } from 'lucide-react'
import { extrairDadosImagem, detectarTipoDocumento } from '@/lib/ai'
import { fileToBase64 } from '@/lib/utils'
import type { ExtracacaoImagem } from '@/types'

interface ImageAnalyzerProps {
  onExtracted: (dados: ExtracacaoImagem) => void
  hint?: 'danfe' | 'etiqueta' | 'produto'
  label?: string
}

const CAMPO_LABELS: Record<string, string> = {
  numero_nf: 'Número da NF',
  numero_pedido: 'Pedido',
  cliente: 'Cliente',
  destinatario: 'Destinatário',
  transportadora: 'Transportadora',
  codigo_rastreio: 'Código de Rastreio',
  valor: 'Valor',
  ean: 'EAN',
  produto: 'Produto',
  quantidade: 'Quantidade',
}

export default function ImageAnalyzer({ onExtracted, hint, label }: ImageAnalyzerProps) {
  const [stage, setStage] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [resultado, setResultado] = useState<ExtracacaoImagem | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setStage('error')
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)
    setStage('loading')

    try {
      const base64 = await fileToBase64(file)
      const tipoDetectado = hint ?? await detectarTipoDocumento(file.name)
      const dados = await extrairDadosImagem(base64, tipoDetectado)
      setResultado(dados)
      setStage('done')
    } catch {
      setStage('error')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function reset() {
    setStage('idle')
    setResultado(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function aplicar() {
    if (resultado) {
      onExtracted(resultado)
      reset()
    }
  }

  return (
    <div className="border border-dashed border-accent/40 rounded-xl p-4 bg-accent/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
          <Zap size={14} className="text-accent" />
        </div>
        <span className="text-sm font-semibold text-accent">
          {label ?? 'IA Vision — Preencher por Imagem'}
        </span>
      </div>

      {stage === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="flex flex-col items-center justify-center py-6 rounded-xl cursor-pointer hover:bg-accent/10 transition-all group"
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-all">
            <FileImage size={22} className="text-accent" />
          </div>
          <p className="text-sm font-medium text-primary">Solte uma imagem aqui ou clique para selecionar</p>
          <p className="text-xs text-text-muted mt-1">
            Suporta: foto de DANFE, etiqueta de rastreio, produto com EAN
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
              className="flex items-center gap-1.5 text-xs bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent-hover transition-all"
            >
              <Upload size={12} /> Escolher arquivo
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      )}

      {stage === 'loading' && (
        <div className="flex flex-col items-center py-6">
          {preview && (
            <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-xl mb-3 opacity-50" />
          )}
          <div className="ai-thinking mb-2"><span></span><span></span><span></span></div>
          <p className="text-sm font-medium text-accent">IA analisando o documento...</p>
          <p className="text-xs text-text-muted mt-1">Extraindo informações relevantes</p>
        </div>
      )}

      {stage === 'done' && resultado && (
        <div>
          <div className="flex items-start gap-3 mb-3">
            {preview && (
              <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-success" />
                <span className="text-sm font-semibold text-success">
                  {resultado.campos_detectados.length} campos detectados
                </span>
                <span className="text-xs text-text-muted">
                  · Confiança: {resultado.confianca}%
                </span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                {resultado.tipo_documento === 'danfe' ? '📄 DANFE' :
                 resultado.tipo_documento === 'etiqueta_rastreio' ? '🏷️ Etiqueta' :
                 resultado.tipo_documento === 'produto' ? '📦 Produto' : '❓ Desconhecido'}
              </span>
            </div>
            <button onClick={reset} className="text-text-muted hover:text-danger transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {resultado.campos_detectados.map(campo => {
              const valor = resultado[campo as keyof ExtracacaoImagem] as string
              if (!valor || campo === 'campos_detectados') return null
              return (
                <div key={campo} className="bg-white rounded-lg p-2 border border-border">
                  <div className="text-xs text-text-muted">{CAMPO_LABELS[campo] ?? campo}</div>
                  <div className="text-sm font-semibold text-primary truncate">{valor}</div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={aplicar}
              className="flex-1 bg-accent text-white text-sm font-medium py-2 rounded-xl hover:bg-accent-hover transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={14} /> Preencher formulário com estes dados
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-3 py-2 border border-border rounded-xl text-sm text-text-muted hover:text-danger hover:border-danger transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {stage === 'error' && (
        <div className="flex flex-col items-center py-4">
          <AlertCircle size={32} className="text-danger mb-2" />
          <p className="text-sm font-medium text-danger">Não foi possível analisar a imagem</p>
          <p className="text-xs text-text-muted mt-1">Tente uma imagem mais nítida ou use JPEG/PNG</p>
          <button onClick={reset} className="mt-3 text-xs text-accent hover:underline">Tentar novamente</button>
        </div>
      )}
    </div>
  )
}
