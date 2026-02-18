'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, XCircle, MessageSquare, Truck, Package } from 'lucide-react'
import { servicosStorage } from '@/lib/storage'
import { formatDate, formatMoeda, tipoServicoLabel, tipoServicoIcon, uuid } from '@/lib/utils'
import type { ServicoExtra } from '@/types'

export default function AprovacaoPage() {
  const { token } = useParams<{ token: string }>()
  const [servico, setServico] = useState<ServicoExtra | null>(null)
  const [estado, setEstado] = useState<'loading' | 'pendente' | 'aprovado' | 'recusado' | 'ja_respondido' | 'nao_encontrado'>('loading')
  const [obs, setObs] = useState('')

  useEffect(() => {
    const s = servicosStorage.getByToken(token)
    if (!s) {
      setEstado('nao_encontrado')
      return
    }
    setServico(s)
    if (s.status === 'aprovado' || s.status === 'em_andamento' || s.status === 'finalizado') {
      setEstado('ja_respondido')
    } else if (s.status === 'recusado') {
      setEstado('recusado')
    } else {
      setEstado('pendente')
    }
  }, [token])

  function aprovar() {
    if (!servico) return
    servicosStorage.update(servico.id, {
      status: 'aprovado',
      aprovacao_data: new Date().toISOString(),
      aprovacao_ip: '189.120.45.32', // simulado
    })
    setEstado('aprovado')
  }

  function recusar() {
    if (!servico) return
    servicosStorage.update(servico.id, {
      status: 'recusado',
      obs: obs ? `Recusado pelo cliente. Motivo: ${obs}` : 'Recusado pelo cliente.',
    })
    setEstado('recusado')
  }

  if (estado === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="ai-thinking"><span></span><span></span><span></span></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header da empresa */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-3">
            <Truck size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-primary">ExpedFontes</h1>
          <p className="text-sm text-text-muted">Portal de Aprovação de Serviços</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-border p-6">
          {estado === 'nao_encontrado' && (
            <div className="text-center py-8">
              <XCircle size={48} className="text-danger mx-auto mb-3" />
              <h3 className="font-bold text-primary mb-2">Link não encontrado</h3>
              <p className="text-sm text-text-muted">Este link de aprovação é inválido ou expirou.</p>
            </div>
          )}

          {estado === 'ja_respondido' && servico && (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-success mx-auto mb-3" />
              <h3 className="font-bold text-primary mb-2">Serviço já aprovado</h3>
              <p className="text-sm text-text-muted">
                O serviço {servico.codigo} já foi aprovado em {servico.aprovacao_data ? formatDate(servico.aprovacao_data) : '—'}.
              </p>
            </div>
          )}

          {estado === 'aprovado' && servico && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-success" />
              </div>
              <h3 className="text-xl font-bold text-success mb-2">Serviço Aprovado!</h3>
              <p className="text-sm text-text-muted mb-4">
                Sua aprovação foi registrada com sucesso.
                A equipe ExpedFontes iniciará o serviço conforme o prazo combinado.
              </p>
              <div className="bg-green-50 rounded-xl p-3 text-left">
                <p className="text-xs text-text-muted">Registro de aprovação</p>
                <p className="text-sm font-medium text-primary mt-1">
                  {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })} · {new Date().toLocaleTimeString('pt-BR', { timeStyle: 'short' })}
                </p>
              </div>
            </div>
          )}

          {estado === 'recusado' && (
            <div className="text-center py-8">
              <XCircle size={48} className="text-danger mx-auto mb-3" />
              <h3 className="font-bold text-primary mb-2">Serviço Recusado</h3>
              <p className="text-sm text-text-muted">
                A recusa foi registrada. Nossa equipe entrará em contato para entender melhor sua necessidade.
              </p>
            </div>
          )}

          {estado === 'pendente' && servico && (
            <>
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
                <div className="text-3xl">{tipoServicoIcon(servico.tipo)}</div>
                <div>
                  <p className="font-bold text-primary">{servico.codigo}</p>
                  <p className="text-sm text-text-muted">{tipoServicoLabel(servico.tipo)}</p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  { label: 'Cliente', valor: servico.cliente_nome },
                  { label: 'Responsável', valor: servico.responsavel_nome },
                  { label: 'Quantidade', valor: `${servico.quantidade.toLocaleString('pt-BR')} ${servico.unidade}` },
                  { label: 'Prazo estimado', valor: servico.prazo ? formatDate(servico.prazo) : 'A definir' },
                  { label: 'Valor estimado', valor: formatMoeda(servico.valor_total) },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-text-muted">{item.label}</span>
                    <span className="font-semibold text-primary">{item.valor}</span>
                  </div>
                ))}
              </div>

              <div className="bg-surface rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-primary mb-2">Descrição do Serviço</p>
                <p className="text-sm text-text-primary leading-relaxed">{servico.descricao}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-primary mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={obs}
                  onChange={e => setObs(e.target.value)}
                  placeholder="Adicione observações ou ajustes necessários..."
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={recusar}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border border-danger/30 text-danger rounded-xl font-medium hover:bg-red-50 transition-all"
                >
                  <XCircle size={18} /> Recusar
                </button>
                <button
                  onClick={aprovar}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-success text-white rounded-xl font-semibold hover:bg-green-600 transition-all"
                >
                  <CheckCircle size={18} /> Aprovar Serviço
                </button>
              </div>

              <p className="text-xs text-text-light text-center mt-3">
                Ao aprovar, você concorda com a execução do serviço pelos valores e prazos informados.
                Registro com timestamp e IP para fins contratuais.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
