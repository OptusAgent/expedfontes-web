'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, Plus, Minus, CheckCircle, AlertTriangle, Truck } from 'lucide-react'
import {
  nfsStorage, derrubadasStorage, clientesStorage, authStorage, rupturasStorage, alertasStorage
} from '@/lib/storage'
import { cn, statusNFLabel, statusNFCor, formatMoeda, uuid } from '@/lib/utils'
import type { NF, Derrubada, Ruptura, Alerta } from '@/types'

const TRANSPORTADORAS = ['Correios', 'Jadlog', 'Total Express', 'Mercado Envios', 'Loggi', 'DHL']

export default function NovaDerrubaPage() {
  const router = useRouter()
  const [clienteId, setClienteId] = useState('')
  const [transportadora, setTransportadora] = useState('')
  const [nfsDisponiveis, setNfsDisponiveis] = useState<NF[]>([])
  const [nfsSelecionadas, setNfsSelecionadas] = useState<string[]>([])
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroTransp, setFiltroTransp] = useState('')

  const usuario = authStorage.getUsuarioLogado()

  useEffect(() => {
    const c = clientesStorage.getAll().filter(c => c.ativo)
    setClientes(c.map(c => ({ id: c.id, nome: c.nome })))
  }, [])

  useEffect(() => {
    if (!clienteId) {
      setNfsDisponiveis([])
      return
    }
    const nfs = nfsStorage.getAll().filter(
      n => n.status === 'etiqueta_liberada' && n.cliente_id === clienteId
    )
    setNfsDisponiveis(nfs)
    setNfsSelecionadas([])
  }, [clienteId])

  const nfsFiltradas = filtroTransp
    ? nfsDisponiveis.filter(n => n.transportadora === filtroTransp)
    : nfsDisponiveis

  function toggleNF(id: string) {
    setNfsSelecionadas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function selecionarTodas() {
    setNfsSelecionadas(nfsFiltradas.map(n => n.id))
  }

  function deselecionarTodas() {
    setNfsSelecionadas([])
  }

  async function criar() {
    if (!clienteId || !transportadora || nfsSelecionadas.length === 0 || !usuario) return
    setLoading(true)

    const cliente = clientes.find(c => c.id === clienteId)!
    const derrubadas = derrubadasStorage.getAll()
    const codigo = `DRB-${165400 + derrubadas.length}`

    const novaDerrubada: Derrubada = {
      id: uuid(),
      codigo,
      cliente_id: clienteId,
      cliente_nome: cliente.nome,
      operador_id: usuario.id,
      operador_nome: usuario.nome,
      transportadora,
      status: 'preparando',
      nfs: nfsSelecionadas,
      qtd_nfs: nfsSelecionadas.length,
      qtd_pendentes: 0,
      data_criacao: new Date().toISOString(),
    }

    derrubadasStorage.create(novaDerrubada)

    // Atualiza status das NFs
    nfsSelecionadas.forEach(nfId => {
      nfsStorage.update(nfId, {
        status: 'em_derrubada',
        derrubada_id: novaDerrubada.id,
      })
    })

    // Cria alerta
    const alerta: Alerta = {
      id: uuid(),
      tipo: 'info',
      titulo: `Derrubada ${codigo} criada`,
      mensagem: `${codigo} criada por ${usuario.nome} para ${cliente.nome} com ${nfsSelecionadas.length} NFs.`,
      entidade_tipo: 'derrubada',
      entidade_id: novaDerrubada.id,
      lido: false,
      criado_em: new Date().toISOString(),
    }
    alertasStorage.create(alerta)

    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
    router.push(`/derrubadas/${novaDerrubada.id}`)
  }

  const valorTotal = nfsDisponiveis
    .filter(n => nfsSelecionadas.includes(n.id))
    .reduce((acc, n) => acc + n.valor_estimado, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-surface rounded-xl transition-all text-text-muted">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-primary">Nova Derrubada</h2>
          <p className="text-sm text-text-muted">Selecione as NFs para o lote de expedição</p>
        </div>
      </div>

      {/* Configuração */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
        <h3 className="font-semibold text-primary mb-4">Configuração do Lote</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Cliente / Marca *</label>
            <select
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">Selecione o cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Transportadora *</label>
            <select
              value={transportadora}
              onChange={e => setTransportadora(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">Selecione a transportadora</option>
              {TRANSPORTADORAS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Seleção de NFs */}
      {clienteId && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-primary">NFs Disponíveis</h3>
              <p className="text-xs text-text-muted mt-0.5">
                {nfsDisponiveis.length} NF{nfsDisponiveis.length !== 1 ? 's' : ''} com etiqueta liberada
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filtroTransp}
                onChange={e => setFiltroTransp(e.target.value)}
                className="px-3 py-1.5 border border-border rounded-lg text-xs focus:outline-none"
              >
                <option value="">Todas transportadoras</option>
                {[...new Set(nfsDisponiveis.map(n => n.transportadora))].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={selecionarTodas}
                className="text-xs text-accent hover:underline"
              >
                Selecionar todas ({nfsFiltradas.length})
              </button>
              {nfsSelecionadas.length > 0 && (
                <button onClick={deselecionarTodas} className="text-xs text-danger hover:underline">
                  Limpar
                </button>
              )}
            </div>
          </div>

          {nfsDisponiveis.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle size={32} className="text-warning mx-auto mb-2" />
              <p className="text-text-muted text-sm">Nenhuma NF disponível para este cliente</p>
              <p className="text-xs text-text-muted mt-1">Aguarde a liberação de etiquetas no Bling</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {nfsFiltradas.map(nf => {
                const selecionada = nfsSelecionadas.includes(nf.id)
                return (
                  <div
                    key={nf.id}
                    onClick={() => toggleNF(nf.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border',
                      selecionada
                        ? 'bg-accent/10 border-accent/30'
                        : 'bg-surface border-transparent hover:border-border'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      selecionada ? 'bg-accent border-accent' : 'border-border'
                    )}>
                      {selecionada && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-primary">NF {nf.numero_nf}</span>
                        <span className="text-xs text-text-muted">· {nf.numero_pedido}</span>
                      </div>
                      {nf.destinatario && (
                        <p className="text-xs text-text-muted mt-0.5">{nf.destinatario}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-primary">{formatMoeda(nf.valor_estimado)}</div>
                      <div className="text-xs text-text-muted">{nf.transportadora}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Resumo */}
      {nfsSelecionadas.length > 0 && (
        <div className="bg-primary rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Resumo da Derrubada</h3>
              <p className="text-slate-400 text-sm">Pronto para criar o lote</p>
            </div>
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <Truck size={22} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-2xl font-bold">{nfsSelecionadas.length}</div>
              <div className="text-xs text-slate-400">NFs selecionadas</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-2xl font-bold">{transportadora || '—'}</div>
              <div className="text-xs text-slate-400">Transportadora</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-2xl font-bold">{formatMoeda(valorTotal)}</div>
              <div className="text-xs text-slate-400">Valor total</div>
            </div>
          </div>
          <button
            onClick={criar}
            disabled={loading || !transportadora || nfsSelecionadas.length === 0}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Criando derrubada...</>
            ) : (
              <><Plus size={18} /> Criar Derrubada com {nfsSelecionadas.length} NFs</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
