'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Printer, X, Package, Truck } from 'lucide-react'
import {
  derrubadasStorage, nfsStorage, rupturasStorage, authStorage, alertasStorage
} from '@/lib/storage'
import { cn, statusDerrubadasLabel, statusDerrubadasCor, statusNFLabel, statusNFCor, formatDateTime, formatMoeda, uuid } from '@/lib/utils'
import type { Derrubada, NF, Ruptura, Alerta } from '@/types'

const PROXIMOS_STATUS: Record<string, string> = {
  preparando: 'aguardando_impressao',
  aguardando_impressao: 'expedida',
}
const PROXIMOS_LABEL: Record<string, string> = {
  preparando: '🖨️ Marcar como Aguardando Impressão',
  aguardando_impressao: '🚚 Confirmar Expedição',
}

export default function DerrubaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [derrubada, setDerrubada] = useState<Derrubada | null>(null)
  const [nfs, setNfs] = useState<NF[]>([])
  const [loading, setLoading] = useState(false)
  const [showRemover, setShowRemover] = useState<string | null>(null)
  const [motivoRemocao, setMotivoRemocao] = useState('')
  const usuario = authStorage.getUsuarioLogado()

  useEffect(() => { reload() }, [id])

  function reload() {
    const d = derrubadasStorage.getById(id)
    if (!d) { router.push('/derrubadas'); return }
    setDerrubada(d)
    const todasNfs = nfsStorage.getAll()
    setNfs(d.nfs.map(nfId => todasNfs.find(n => n.id === nfId)).filter(Boolean) as NF[])
  }

  async function avancarStatus() {
    if (!derrubada || !usuario) return
    const proximo = PROXIMOS_STATUS[derrubada.status]
    if (!proximo) return
    setLoading(true)

    const patch: Partial<Derrubada> = { status: proximo as Derrubada['status'] }
    if (proximo === 'expedida') {
      patch.data_expedicao = new Date().toISOString()
      // Atualiza todas as NFs para expedida
      derrubada.nfs.forEach(nfId => {
        nfsStorage.update(nfId, { status: 'expedida', data_resolucao: new Date().toISOString() })
      })
    }

    derrubadasStorage.update(derrubada.id, patch)

    const alerta: Alerta = {
      id: uuid(),
      tipo: proximo === 'expedida' ? 'sucesso' : 'info',
      titulo: proximo === 'expedida' ? `Derrubada ${derrubada.codigo} expedida!` : `${derrubada.codigo} aguardando impressão`,
      mensagem: `Status da derrubada ${derrubada.codigo} atualizado por ${usuario.nome}.`,
      entidade_tipo: 'derrubada',
      entidade_id: derrubada.id,
      lido: false,
      criado_em: new Date().toISOString(),
    }
    alertasStorage.create(alerta)

    await new Promise(r => setTimeout(r, 500))
    setLoading(false)
    reload()
  }

  function removerNF(nfId: string) {
    if (!derrubada || !motivoRemocao.trim() || !usuario) return

    // Volta NF para ruptura
    const nf = nfs.find(n => n.id === nfId)
    if (!nf) return

    nfsStorage.update(nfId, { status: 'aguardando_etiqueta', derrubada_id: undefined })

    const ruptura: Ruptura = {
      id: uuid(),
      nf_id: nfId,
      numero_nf: nf.numero_nf,
      cliente_id: nf.cliente_id,
      cliente_nome: nf.cliente_nome,
      transportadora: nf.transportadora,
      motivo: 'sem_etiqueta',
      obs: `Removida da derrubada ${derrubada.codigo}. Motivo: ${motivoRemocao}`,
      dias_pendente: 0,
      score_urgencia: 10,
      nivel_urgencia: 'normal',
      data_abertura: new Date().toISOString(),
      resolvida: false,
      acoes: [{
        id: uuid(),
        ruptura_id: '',
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        tipo: 'observacao',
        descricao: `NF removida da derrubada ${derrubada.codigo}. ${motivoRemocao}`,
        criado_em: new Date().toISOString(),
      }],
    }
    rupturasStorage.create(ruptura)

    const novasNfs = derrubada.nfs.filter(id => id !== nfId)
    derrubadasStorage.update(derrubada.id, {
      nfs: novasNfs,
      qtd_nfs: novasNfs.length,
      qtd_pendentes: derrubada.qtd_pendentes + 1,
    })

    setShowRemover(null)
    setMotivoRemocao('')
    reload()
  }

  if (!derrubada) return (
    <div className="flex items-center justify-center h-64">
      <div className="ai-thinking"><span></span><span></span><span></span></div>
    </div>
  )

  const proximo = PROXIMOS_STATUS[derrubada.status]
  const valorTotal = nfs.reduce((acc, n) => acc + n.valor_estimado, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-surface rounded-xl transition-all text-text-muted">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-primary">{derrubada.codigo}</h2>
            <span className={cn('text-xs px-2 py-1 rounded-full font-medium', statusDerrubadasCor(derrubada.status))}>
              {statusDerrubadasLabel(derrubada.status)}
            </span>
          </div>
          <p className="text-text-muted text-sm mt-1">
            {derrubada.cliente_nome} · {derrubada.transportadora} · Criada por {derrubada.operador_nome}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm text-text-muted hover:text-primary hover:bg-surface transition-all"
          >
            <Printer size={16} /> Imprimir
          </button>
          {proximo && (
            <button
              onClick={avancarStatus}
              disabled={loading}
              className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-accent-hover transition-all disabled:opacity-70"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />}
              {PROXIMOS_LABEL[derrubada.status]}
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total de NFs', valor: derrubada.qtd_nfs },
          { label: 'NFs Pendentes', valor: derrubada.qtd_pendentes },
          { label: 'Transportadora', valor: derrubada.transportadora },
          { label: 'Valor Total', valor: formatMoeda(valorTotal) },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-2xl p-4 shadow-card border border-border">
            <div className="text-xs text-text-muted">{item.label}</div>
            <div className="text-lg font-bold text-primary mt-1">{item.valor}</div>
          </div>
        ))}
      </div>

      {/* NFs */}
      <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-primary">Notas Fiscais do Lote</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['NF', 'Pedido', 'Destinatário', 'Transportadora', 'Valor', 'Status', 'Ação'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nfs.map(nf => (
                <tr key={nf.id} className="border-b border-border/50 hover:bg-surface transition-all">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-sm text-primary">{nf.numero_nf}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-muted">{nf.numero_pedido}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-primary">{nf.destinatario ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-muted">{nf.transportadora}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-primary">{formatMoeda(nf.valor_estimado)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-1 rounded-full', statusNFCor(nf.status))}>
                      {statusNFLabel(nf.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {derrubada.status !== 'expedida' && (
                      <button
                        onClick={() => setShowRemover(nf.id)}
                        className="text-xs text-danger hover:underline flex items-center gap-1"
                      >
                        <X size={12} /> Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal remover NF */}
      {showRemover && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-dropdown">
            <h3 className="font-bold text-primary mb-1">Remover NF da Derrubada</h3>
            <p className="text-sm text-text-muted mb-4">
              A NF será removida e uma ruptura será criada automaticamente.
            </p>
            <textarea
              value={motivoRemocao}
              onChange={e => setMotivoRemocao(e.target.value)}
              placeholder="Informe o motivo da remoção..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRemover(null); setMotivoRemocao('') }}
                className="flex-1 py-2 border border-border rounded-xl text-sm text-text-muted hover:text-primary hover:bg-surface transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => removerNF(showRemover)}
                disabled={!motivoRemocao.trim()}
                className="flex-1 py-2 bg-danger text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all disabled:opacity-50"
              >
                Remover NF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
