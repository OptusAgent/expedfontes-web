'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Clock, MessageSquare, CheckCircle, AlertTriangle,
  Zap, Send, RefreshCw, ChevronRight
} from 'lucide-react'
import { rupturasStorage, nfsStorage, authStorage } from '@/lib/storage'
import {
  classificarOBS, calcularScoreUrgencia, gerarMensagemCliente
} from '@/lib/ai'
import {
  cn, nivelUrgenciaCor, nivelUrgenciaLabel, formatDateTime,
  formatTimeAgo, uuid
} from '@/lib/utils'
import type { Ruptura, AcaoRuptura } from '@/types'
import ImageAnalyzer from '@/components/ui/ImageAnalyzer'

const motivoLabels: Record<string, string> = {
  sem_etiqueta: 'Sem Etiqueta de Rastreio',
  cancelada: 'Pedido Cancelado',
  aguardando_liberacao: 'Aguardando Liberação',
  erro_bling: 'Erro no Bling',
  produto_avariado: 'Produto Avariado',
}

export default function RupturaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [ruptura, setRuptura] = useState<Ruptura | null>(null)
  const [novaAcao, setNovaAcao] = useState('')
  const [tipoAcao, setTipoAcao] = useState<AcaoRuptura['tipo']>('contato_cliente')
  const [loadingOBS, setLoadingOBS] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [msgGerada, setMsgGerada] = useState('')
  const [classificacaoOBS, setClassificacaoOBS] = useState<any>(null)
  const [loadingResolucao, setLoadingResolucao] = useState(false)

  const usuario = authStorage.getUsuarioLogado()

  useEffect(() => {
    const r = rupturasStorage.getById(id)
    if (!r) { router.push('/rupturas'); return }
    setRuptura(r)
  }, [id, router])

  function reload() {
    const r = rupturasStorage.getById(id)
    if (r) setRuptura(r)
  }

  async function analisarOBS() {
    if (!ruptura?.obs) return
    setLoadingOBS(true)
    const resultado = await classificarOBS(ruptura.obs)
    setClassificacaoOBS(resultado)
    setLoadingOBS(false)
  }

  async function gerarMensagem() {
    if (!ruptura) return
    setLoadingMsg(true)
    const msg = await gerarMensagemCliente({
      cliente: ruptura.cliente_nome,
      numero_nf: ruptura.numero_nf,
      dias_pendente: ruptura.dias_pendente,
      transportadora: ruptura.transportadora,
    })
    setMsgGerada(msg)
    setLoadingMsg(false)
  }

  function registrarAcao() {
    if (!novaAcao.trim() || !usuario || !ruptura) return

    const acao: AcaoRuptura = {
      id: uuid(),
      ruptura_id: ruptura.id,
      usuario_id: usuario.id,
      usuario_nome: usuario.nome,
      tipo: tipoAcao,
      descricao: novaAcao.trim(),
      criado_em: new Date().toISOString(),
    }

    rupturasStorage.update(ruptura.id, {
      acoes: [...ruptura.acoes, acao],
    })

    setNovaAcao('')
    reload()
  }

  async function resolver() {
    if (!ruptura || !usuario) return
    setLoadingResolucao(true)

    // Atualiza a NF para etiqueta liberada
    nfsStorage.update(ruptura.nf_id, {
      status: 'etiqueta_liberada',
      data_resolucao: new Date().toISOString(),
    })

    rupturasStorage.update(ruptura.id, {
      resolvida: true,
      data_resolucao: new Date().toISOString(),
      acoes: [...ruptura.acoes, {
        id: uuid(),
        ruptura_id: ruptura.id,
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        tipo: 'atualizacao_status',
        descricao: 'Ruptura resolvida manualmente. NF liberada para derrubada.',
        criado_em: new Date().toISOString(),
      }],
    })

    await new Promise(r => setTimeout(r, 800))
    setLoadingResolucao(false)
    router.push('/rupturas')
  }

  if (!ruptura) return (
    <div className="flex items-center justify-center h-64">
      <div className="ai-thinking"><span></span><span></span><span></span></div>
    </div>
  )

  const tipoAcaoLabels: Record<string, string> = {
    contato_cliente: '📞 Contato com Cliente',
    atualizacao_status: '🔄 Atualização de Status',
    escalonamento: '⬆️ Escalonamento',
    observacao: '📝 Observação',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-surface rounded-xl transition-all text-text-muted hover:text-primary"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-primary">NF {ruptura.numero_nf}</h2>
            <span className={cn('text-sm px-3 py-1 rounded-full font-medium', nivelUrgenciaCor(ruptura.nivel_urgencia))}>
              {nivelUrgenciaLabel(ruptura.nivel_urgencia)}
            </span>
            {ruptura.resolvida && (
              <span className="text-sm px-3 py-1 rounded-full font-medium bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle size={14} /> Resolvida
              </span>
            )}
          </div>
          <p className="text-text-muted text-sm mt-1">
            {ruptura.cliente_nome} · {ruptura.transportadora} · Aberta em {formatDateTime(ruptura.data_abertura)}
          </p>
        </div>

        {!ruptura.resolvida && (
          <button
            onClick={resolver}
            disabled={loadingResolucao}
            className="flex items-center gap-2 bg-success text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-green-600 transition-all disabled:opacity-70"
          >
            {loadingResolucao ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />}
            Resolver Ruptura
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Detalhes */}
        <div className="xl:col-span-2 space-y-6">
          {/* Info da NF */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-danger" /> Informações da Ruptura
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Número da NF', valor: ruptura.numero_nf },
                { label: 'Cliente', valor: ruptura.cliente_nome },
                { label: 'Transportadora', valor: ruptura.transportadora },
                { label: 'Motivo', valor: motivoLabels[ruptura.motivo] ?? ruptura.motivo },
                { label: 'Dias Pendente', valor: `${ruptura.dias_pendente} dias` },
                { label: 'Score de Urgência', valor: `${ruptura.score_urgencia}/100` },
              ].map(item => (
                <div key={item.label} className="bg-surface rounded-xl p-3">
                  <div className="text-xs text-text-muted">{item.label}</div>
                  <div className="font-semibold text-primary mt-0.5 text-sm">{item.valor}</div>
                </div>
              ))}
            </div>

            {/* Barra de urgência */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Score de Urgência (IA)</span>
                <span className="font-semibold">{ruptura.score_urgencia}/100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    ruptura.nivel_urgencia === 'critico' ? 'bg-danger' :
                    ruptura.nivel_urgencia === 'urgente' ? 'bg-orange-500' :
                    ruptura.nivel_urgencia === 'atencao' ? 'bg-warning' : 'bg-info'
                  )}
                  style={{ width: `${ruptura.score_urgencia}%` }}
                />
              </div>
            </div>
          </div>

          {/* Histórico de ações */}
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <Clock size={18} className="text-accent" /> Histórico de Ações
            </h3>

            {ruptura.acoes.length === 0 ? (
              <div className="text-center py-6 text-text-muted text-sm">
                Nenhuma ação registrada ainda
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {[...ruptura.acoes].reverse().map((acao, i) => (
                    <div key={acao.id} className="flex gap-4 pl-8 relative">
                      <div className="absolute left-2 w-3 h-3 rounded-full bg-accent border-2 border-white top-1.5" />
                      <div className="flex-1 bg-surface rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-primary">{acao.usuario_nome}</span>
                          <span className="text-xs text-text-light">{formatTimeAgo(acao.criado_em)}</span>
                        </div>
                        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-md">
                          {tipoAcaoLabels[acao.tipo] ?? acao.tipo}
                        </span>
                        <p className="text-sm text-text-primary mt-2">{acao.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registrar nova ação */}
            {!ruptura.resolvida && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-semibold text-primary mb-3">Registrar Nova Ação</p>
                <div className="flex gap-2 mb-3">
                  {Object.entries(tipoAcaoLabels).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setTipoAcao(val as AcaoRuptura['tipo'])}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg transition-all',
                        tipoAcao === val ? 'bg-accent text-white' : 'bg-surface text-text-muted hover:text-primary'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={novaAcao}
                    onChange={e => setNovaAcao(e.target.value)}
                    placeholder="Descreva a ação realizada..."
                    rows={2}
                    className="flex-1 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                  />
                  <button
                    onClick={registrarAcao}
                    disabled={!novaAcao.trim()}
                    className="px-4 bg-accent text-white rounded-xl hover:bg-accent-hover transition-all disabled:opacity-50 flex items-center"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar com IA */}
        <div className="space-y-4">
          {/* Score de urgência */}
          <div className="bg-white rounded-2xl p-5 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-accent" />
              <h3 className="font-semibold text-primary text-sm">Análise de Urgência (IA)</h3>
            </div>
            <div className={cn('text-center py-4 rounded-xl mb-3', nivelUrgenciaCor(ruptura.nivel_urgencia))}>
              <div className="text-4xl font-bold">{ruptura.score_urgencia}</div>
              <div className="text-sm font-medium mt-1">{nivelUrgenciaLabel(ruptura.nivel_urgencia)}</div>
            </div>
            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex justify-between">
                <span>Dias pendente</span>
                <span className="font-semibold text-primary">+{Math.min(ruptura.dias_pendente * 7, 50)} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Transportadora ({ruptura.transportadora})</span>
                <span className="font-semibold text-primary">+{ruptura.transportadora === 'Correios' ? 20 : 12} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Histórico do cliente</span>
                <span className="font-semibold text-primary">+{['BM Beauty','GUDAY','SONOCOMSONO'].some(c => ruptura.cliente_nome.includes(c)) ? 15 : 0} pts</span>
              </div>
            </div>
          </div>

          {/* Análise do OBS */}
          {ruptura.obs && (
            <div className="bg-white rounded-2xl p-5 shadow-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-accent" />
                  <h3 className="font-semibold text-primary text-sm">IA — Análise do OBS</h3>
                </div>
                <button
                  onClick={analisarOBS}
                  disabled={loadingOBS}
                  className="text-xs text-accent hover:underline disabled:opacity-50"
                >
                  {loadingOBS ? 'Analisando...' : 'Analisar'}
                </button>
              </div>

              <div className="bg-surface rounded-lg p-3 mb-3">
                <p className="text-xs text-text-muted italic">"{ruptura.obs}"</p>
              </div>

              {loadingOBS && (
                <div className="ai-thinking py-2"><span></span><span></span><span></span></div>
              )}

              {classificacaoOBS && !loadingOBS && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Intenção detectada</span>
                    <span className="font-semibold text-primary">{classificacaoOBS.intent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Confiança</span>
                    <span className="font-semibold text-primary">{classificacaoOBS.confianca}%</span>
                  </div>
                  <div className="mt-2 p-2 bg-accent/10 rounded-lg">
                    <p className="text-accent font-medium">💡 {classificacaoOBS.proximo_passo}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gerar mensagem para cliente */}
          {!ruptura.resolvida && (
            <div className="bg-white rounded-2xl p-5 shadow-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-accent" />
                  <h3 className="font-semibold text-primary text-sm">Mensagem para Cliente (IA)</h3>
                </div>
                <button
                  onClick={gerarMensagem}
                  disabled={loadingMsg}
                  className="text-xs text-accent hover:underline disabled:opacity-50 flex items-center gap-1"
                >
                  {loadingMsg ? <div className="w-3 h-3 border border-accent/30 border-t-accent rounded-full animate-spin" /> : <RefreshCw size={11} />}
                  Gerar
                </button>
              </div>

              {loadingMsg && (
                <div className="ai-thinking py-2"><span></span><span></span><span></span></div>
              )}

              {msgGerada && !loadingMsg && (
                <div>
                  <div className="bg-surface rounded-xl p-3 text-sm text-text-primary leading-relaxed">
                    {msgGerada}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(msgGerada)
                      alert('Mensagem copiada! ✅')
                    }}
                    className="mt-2 w-full text-xs text-accent border border-accent/20 rounded-lg py-1.5 hover:bg-accent/5 transition-all"
                  >
                    📋 Copiar mensagem
                  </button>
                </div>
              )}

              {!msgGerada && !loadingMsg && (
                <p className="text-xs text-text-muted">
                  A IA gera uma mensagem profissional personalizada baseada no histórico e contexto desta ruptura.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
