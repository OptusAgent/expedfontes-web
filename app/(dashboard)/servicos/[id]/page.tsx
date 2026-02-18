'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Copy, ExternalLink, Play, Flag } from 'lucide-react'
import { servicosStorage, authStorage, alertasStorage } from '@/lib/storage'
import {
  cn, statusServicosLabel, statusServicosCor, tipoServicoLabel, tipoServicoIcon,
  formatDateTime, formatDate, formatMoeda, uuid
} from '@/lib/utils'
import type { ServicoExtra, Alerta } from '@/types'

export default function ServicoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [servico, setServico] = useState<ServicoExtra | null>(null)
  const [loading, setLoading] = useState(false)
  const usuario = authStorage.getUsuarioLogado()

  useEffect(() => {
    const s = servicosStorage.getById(id)
    if (!s) { router.push('/servicos'); return }
    setServico(s)
  }, [id, router])

  function reload() {
    const s = servicosStorage.getById(id)
    if (s) setServico(s)
  }

  async function atualizarStatus(novoStatus: ServicoExtra['status']) {
    if (!servico || !usuario) return
    setLoading(true)

    const patch: Partial<ServicoExtra> = { status: novoStatus }
    if (novoStatus === 'em_andamento') patch.data_inicio = new Date().toISOString()
    if (novoStatus === 'finalizado') patch.data_finalizacao = new Date().toISOString()

    servicosStorage.update(servico.id, patch)

    const alerta: Alerta = {
      id: uuid(),
      tipo: novoStatus === 'finalizado' ? 'sucesso' : 'info',
      titulo: `OS ${servico.codigo} — ${statusServicosLabel(novoStatus)}`,
      mensagem: `Status atualizado por ${usuario.nome}.`,
      entidade_tipo: 'servico',
      entidade_id: servico.id,
      lido: false,
      criado_em: new Date().toISOString(),
    }
    alertasStorage.create(alerta)

    await new Promise(r => setTimeout(r, 400))
    setLoading(false)
    reload()
  }

  if (!servico) return (
    <div className="flex items-center justify-center h-64">
      <div className="ai-thinking"><span></span><span></span><span></span></div>
    </div>
  )

  const linkAprovacao = servico.aprovacao_token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/aprovar/${servico.aprovacao_token}`
    : null

  const proximoStatus: Record<string, ServicoExtra['status']> = {
    aprovado: 'em_andamento',
    em_andamento: 'finalizado',
  }
  const proximo = proximoStatus[servico.status]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-surface rounded-xl transition-all text-text-muted">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-primary">
              {tipoServicoIcon(servico.tipo)} {servico.codigo}
            </h2>
            <span className={cn('text-xs px-2 py-1 rounded-full font-medium', statusServicosCor(servico.status))}>
              {statusServicosLabel(servico.status)}
            </span>
          </div>
          <p className="text-text-muted text-sm mt-1">
            {servico.cliente_nome} · {tipoServicoLabel(servico.tipo)} · {servico.responsavel_nome}
          </p>
        </div>
        {proximo && (
          <button
            onClick={() => atualizarStatus(proximo)}
            disabled={loading}
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-accent-hover transition-all disabled:opacity-70"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : proximo === 'em_andamento' ? <Play size={16} /> : <Flag size={16} />
            }
            {proximo === 'em_andamento' ? 'Iniciar Execução' : 'Finalizar OS'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Dados principais */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-semibold text-primary mb-4">Detalhes da OS</h3>
          <div className="space-y-3">
            {[
              { label: 'Código', valor: servico.codigo },
              { label: 'Tipo', valor: `${tipoServicoIcon(servico.tipo)} ${tipoServicoLabel(servico.tipo)}` },
              { label: 'Cliente', valor: servico.cliente_nome },
              { label: 'Responsável', valor: servico.responsavel_nome },
              { label: 'Quantidade', valor: `${servico.quantidade.toLocaleString('pt-BR')} ${servico.unidade}` },
              { label: 'Qtd Real', valor: servico.quantidade_real ? `${servico.quantidade_real.toLocaleString('pt-BR')} ${servico.unidade}` : '—' },
              { label: 'Valor Unitário', valor: formatMoeda(servico.valor_unitario) },
              { label: 'Valor Total', valor: formatMoeda(servico.valor_total) },
              { label: 'Mês de Referência', valor: servico.mes_referencia },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                <span className="text-text-muted">{item.label}</span>
                <span className="font-medium text-primary">{item.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Datas e aprovação */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-primary mb-4">Timeline</h3>
            <div className="space-y-3">
              {[
                { label: 'Solicitação', data: servico.data_solicitacao, icone: '📋' },
                { label: 'Aprovação', data: servico.aprovacao_data, icone: '✅' },
                { label: 'Início', data: servico.data_inicio, icone: '▶️' },
                { label: 'Prazo', data: servico.prazo, icone: '⏰' },
                { label: 'Finalização', data: servico.data_finalizacao, icone: '🏁' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 text-sm">
                  <span className="text-base">{item.icone}</span>
                  <span className="text-text-muted w-24 flex-shrink-0">{item.label}</span>
                  <span className={cn('font-medium', item.data ? 'text-primary' : 'text-text-light')}>
                    {item.data ? formatDate(item.data) : 'Pendente'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Link de aprovação */}
          {linkAprovacao && (
            <div className="bg-white rounded-2xl p-5 shadow-card border border-border">
              <h3 className="font-semibold text-primary mb-3 text-sm">Link de Aprovação</h3>
              {servico.aprovacao_data ? (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle size={16} />
                  <span>Aprovado em {formatDate(servico.aprovacao_data)}</span>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-text-muted mb-3">Aguardando aprovação do cliente</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(linkAprovacao); alert('Copiado! ✅') }}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-border py-2 rounded-lg hover:bg-surface transition-all"
                    >
                      <Copy size={12} /> Copiar link
                    </button>
                    <button
                      onClick={() => window.open(linkAprovacao, '_blank')}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-accent text-white py-2 rounded-lg hover:bg-accent-hover transition-all"
                    >
                      <ExternalLink size={12} /> Visualizar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Descrição */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
        <h3 className="font-semibold text-primary mb-3">Descrição do Serviço</h3>
        <p className="text-sm text-text-primary leading-relaxed">{servico.descricao}</p>
        {servico.obs && (
          <div className="mt-3 bg-yellow-50 rounded-xl p-3 border border-yellow-100">
            <p className="text-xs font-semibold text-yellow-800 mb-1">Observação</p>
            <p className="text-sm text-yellow-700">{servico.obs}</p>
          </div>
        )}
      </div>
    </div>
  )
}
