'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Zap, Copy, Send } from 'lucide-react'
import {
  clientesStorage, servicosStorage, authStorage, usuariosStorage, alertasStorage
} from '@/lib/storage'
import { cn, tipoServicoLabel, tipoServicoIcon, formatMoeda, uuid } from '@/lib/utils'
import type { ServicoExtra, Alerta } from '@/types'
import ImageAnalyzer from '@/components/ui/ImageAnalyzer'

const TABELA_PRECOS: Record<string, number> = {
  etiquetagem: 1.50,
  montagem_kit: 4.00,
  rebatimento_palete: 4.50,
  outros: 2.00,
}

export default function NovaOSPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    cliente_id: '',
    responsavel_id: '',
    tipo: 'etiquetagem',
    descricao: '',
    quantidade: '',
    unidade: 'unidades',
    prazo: '',
    obs: '',
  })
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([])
  const [operadores, setOperadores] = useState<{ id: string; nome: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [linkAprovacao, setLinkAprovacao] = useState('')
  const [criada, setCriada] = useState(false)
  const usuario = authStorage.getUsuarioLogado()

  useEffect(() => {
    setClientes(clientesStorage.getAll().filter(c => c.ativo).map(c => ({ id: c.id, nome: c.nome })))
    setOperadores(
      usuariosStorage.getAll()
        .filter(u => ['operador', 'admin', 'gestor'].includes(u.nivel_acesso) && u.ativo)
        .map(u => ({ id: u.id, nome: u.nome }))
    )
    if (usuario) {
      setForm(f => ({ ...f, responsavel_id: usuario.id }))
    }
  }, [])

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const valorUnitario = TABELA_PRECOS[form.tipo] ?? 2.00
  const quantidade = parseInt(form.quantidade) || 0
  const valorTotal = quantidade * valorUnitario

  function handleImageExtracted(dados: any) {
    if (dados.quantidade) set('quantidade', dados.quantidade)
    if (dados.produto) set('descricao', `Serviço em produto: ${dados.produto}`)
    if (dados.ean) set('obs', `EAN detectado: ${dados.ean}`)
  }

  async function criar() {
    if (!form.cliente_id || !form.responsavel_id || !form.descricao || !form.quantidade) return
    setLoading(true)

    const cliente = clientes.find(c => c.id === form.cliente_id)!
    const responsavel = operadores.find(o => o.id === form.responsavel_id)!
    const servicos = servicosStorage.getAll()
    const proxNum = servicos.length + 1
    const codigo = `OS-2026-${String(proxNum).padStart(3, '0')}`
    const token = `tok-${uuid().slice(0, 8)}`
    const mesRef = new Date().toISOString().slice(0, 7)

    const novoServico: ServicoExtra = {
      id: uuid(),
      codigo,
      cliente_id: form.cliente_id,
      cliente_nome: cliente.nome,
      responsavel_id: form.responsavel_id,
      responsavel_nome: responsavel.nome,
      tipo: form.tipo as ServicoExtra['tipo'],
      descricao: form.descricao,
      quantidade,
      unidade: form.unidade,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      status: 'aguardando_aprovacao',
      data_solicitacao: new Date().toISOString(),
      prazo: form.prazo ? new Date(form.prazo).toISOString() : undefined,
      aprovacao_token: token,
      mes_referencia: mesRef,
      obs: form.obs || undefined,
    }

    servicosStorage.create(novoServico)

    const alerta: Alerta = {
      id: uuid(),
      tipo: 'info',
      titulo: `Nova OS ${codigo} aguardando aprovação`,
      mensagem: `${codigo} criada para ${cliente.nome}. Link enviado para aprovação.`,
      entidade_tipo: 'servico',
      entidade_id: novoServico.id,
      lido: false,
      criado_em: new Date().toISOString(),
    }
    alertasStorage.create(alerta)

    const link = `${window.location.origin}/aprovar/${token}`
    setLinkAprovacao(link)

    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
    setCriada(true)
  }

  if (criada) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-card border border-border text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">OS Criada com Sucesso!</h3>
          <p className="text-text-muted text-sm mb-6">
            O link de aprovação foi gerado. Envie para o cliente via e-mail ou WhatsApp.
          </p>

          <div className="bg-surface rounded-xl p-4 mb-4 text-left">
            <p className="text-xs text-text-muted mb-2">🔗 Link de Aprovação Digital</p>
            <p className="text-sm font-mono break-all text-primary">{linkAprovacao}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { navigator.clipboard.writeText(linkAprovacao); alert('Link copiado! ✅') }}
              className="flex-1 flex items-center justify-center gap-2 border border-border py-2.5 rounded-xl text-sm hover:bg-surface transition-all"
            >
              <Copy size={16} /> Copiar Link
            </button>
            <button
              onClick={() => router.push('/servicos')}
              className="flex-1 bg-accent text-white py-2.5 rounded-xl text-sm font-medium hover:bg-accent-hover transition-all"
            >
              Ver OS
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-surface rounded-xl transition-all text-text-muted">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-primary">Nova Ordem de Serviço</h2>
          <p className="text-sm text-text-muted">Preencha os dados — link de aprovação gerado automaticamente</p>
        </div>
      </div>

      {/* IA Vision — preencher por imagem */}
      <ImageAnalyzer
        onExtracted={handleImageExtracted}
        hint="produto"
        label="IA Vision — Fotografe o produto para preencher quantidade e EAN automaticamente"
      />

      <div className="bg-white rounded-2xl p-6 shadow-card border border-border space-y-4">
        <h3 className="font-semibold text-primary mb-2">Dados da OS</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Cliente *</label>
            <select value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
              <option value="">Selecione o cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Responsável *</label>
            <select value={form.responsavel_id} onChange={e => set('responsavel_id', e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
              <option value="">Selecione o responsável</option>
              {operadores.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
        </div>

        {/* Tipo de serviço */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">Tipo de Serviço *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['etiquetagem', 'montagem_kit', 'rebatimento_palete', 'outros'].map(tipo => (
              <button
                key={tipo}
                type="button"
                onClick={() => set('tipo', tipo)}
                className={cn(
                  'py-3 rounded-xl text-sm font-medium border transition-all text-center',
                  form.tipo === tipo
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-border text-text-muted hover:border-accent/40'
                )}
              >
                <div className="text-xl mb-1">{tipoServicoIcon(tipo)}</div>
                <div className="text-xs">{tipoServicoLabel(tipo)}</div>
                <div className="text-xs font-bold mt-0.5">
                  {formatMoeda(TABELA_PRECOS[tipo] ?? 2)}/un
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Descrição do Serviço *</label>
          <textarea
            value={form.descricao}
            onChange={e => set('descricao', e.target.value)}
            placeholder="Descreva o serviço a ser realizado..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Quantidade *</label>
            <input
              type="number"
              value={form.quantidade}
              onChange={e => set('quantidade', e.target.value)}
              placeholder="0"
              min="1"
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Unidade</label>
            <select value={form.unidade} onChange={e => set('unidade', e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
              {['unidades', 'kits', 'volumes', 'paletes', 'horas'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Prazo</label>
            <input
              type="date"
              value={form.prazo}
              onChange={e => set('prazo', e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">Observações</label>
          <input
            value={form.obs}
            onChange={e => set('obs', e.target.value)}
            placeholder="Informações adicionais, urgência, etc."
            className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
      </div>

      {/* Resumo */}
      {quantidade > 0 && (
        <div className="bg-primary rounded-2xl p-5 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-sm">Valor estimado da OS</p>
              <p className="text-3xl font-bold mt-1">{formatMoeda(valorTotal)}</p>
              <p className="text-slate-400 text-xs mt-1">
                {quantidade.toLocaleString('pt-BR')} {form.unidade} × {formatMoeda(valorUnitario)}
              </p>
            </div>
            <div className="text-4xl">{tipoServicoIcon(form.tipo)}</div>
          </div>
        </div>
      )}

      <button
        onClick={criar}
        disabled={loading || !form.cliente_id || !form.responsavel_id || !form.descricao || !form.quantidade}
        className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Criando OS...</>
        ) : (
          <><Plus size={18} /> Criar OS e Gerar Link de Aprovação</>
        )}
      </button>
    </div>
  )
}
