'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Package, Search, ArrowRight, CheckCircle, Clock, DollarSign } from 'lucide-react'
import { servicosStorage } from '@/lib/storage'
import {
  cn, statusServicosLabel, statusServicosCor, tipoServicoLabel, tipoServicoIcon,
  formatDate, formatMoeda
} from '@/lib/utils'
import type { ServicoExtra } from '@/types'

export default function ServicosPage() {
  const router = useRouter()
  const [servicos, setServicos] = useState<ServicoExtra[]>([])
  const [filtro, setFiltro] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroMes, setFiltroMes] = useState('')

  useEffect(() => {
    const all = servicosStorage.getAll()
    setServicos(all.sort((a, b) => new Date(b.data_solicitacao).getTime() - new Date(a.data_solicitacao).getTime()))
  }, [])

  const filtrados = servicos.filter(s => {
    if (filtroStatus && s.status !== filtroStatus) return false
    if (filtroMes && s.mes_referencia !== filtroMes) return false
    if (filtro) {
      const f = filtro.toLowerCase()
      return s.codigo.toLowerCase().includes(f) || s.cliente_nome.toLowerCase().includes(f) || s.descricao.toLowerCase().includes(f)
    }
    return true
  })

  const stats = {
    total: servicos.length,
    emAndamento: servicos.filter(s => s.status === 'em_andamento' || s.status === 'aprovado').length,
    finalizados: servicos.filter(s => s.status === 'finalizado').length,
    aguardandoAprovacao: servicos.filter(s => s.status === 'aguardando_aprovacao').length,
    valorMes: servicos
      .filter(s => s.status === 'finalizado' && s.mes_referencia === '2026-02')
      .reduce((acc, s) => acc + s.valor_total, 0),
  }

  const mesesDisponiveis = [...new Set(servicos.map(s => s.mes_referencia))].sort().reverse()

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: 'Total de OS', valor: stats.total, cor: 'bg-blue-50 text-blue-700' },
          { label: 'Em Andamento', valor: stats.emAndamento, cor: 'bg-purple-50 text-purple-700' },
          { label: 'Finalizados', valor: stats.finalizados, cor: 'bg-green-50 text-green-700' },
          { label: 'Aguard. Aprovação', valor: stats.aguardandoAprovacao, cor: 'bg-yellow-50 text-yellow-700' },
          { label: 'Faturado Fev/26', valor: formatMoeda(stats.valorMes), cor: 'bg-emerald-50 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-xl p-4 border border-transparent', s.cor)}>
            <div className="text-xl font-bold">{s.valor}</div>
            <div className="text-xs font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alerta aprovações pendentes */}
      {stats.aguardandoAprovacao > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-warning" />
            <div>
              <p className="font-semibold text-yellow-800">
                {stats.aguardandoAprovacao} OS aguardando aprovação do cliente
              </p>
              <p className="text-sm text-yellow-700">Links de aprovação enviados — aguardando resposta</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              placeholder="Buscar por código, cliente, descrição..."
              className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none"
          >
            <option value="">Todos os status</option>
            <option value="aguardando_aprovacao">Aguard. Aprovação</option>
            <option value="aprovado">Aprovado</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="finalizado">Finalizado</option>
            <option value="recusado">Recusado</option>
          </select>

          <select
            value={filtroMes}
            onChange={e => setFiltroMes(e.target.value)}
            className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none"
          >
            <option value="">Todos os meses</option>
            {mesesDisponiveis.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <Link
            href="/servicos/nova"
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-accent-hover transition-all ml-auto"
          >
            <Plus size={16} /> Nova OS
          </Link>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['Código', 'Tipo', 'Cliente', 'Responsável', 'Qtd', 'Valor', 'Mês Ref.', 'Prazo', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-text-muted text-sm">
                    Nenhum serviço encontrado
                  </td>
                </tr>
              ) : filtrados.map(s => (
                <tr
                  key={s.id}
                  className="border-b border-border/50 hover:bg-surface transition-all cursor-pointer"
                  onClick={() => router.push(`/servicos/${s.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-semibold text-sm text-primary">{s.codigo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {tipoServicoIcon(s.tipo)} {tipoServicoLabel(s.tipo)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-primary">{s.cliente_nome}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-muted">{s.responsavel_nome}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-primary">
                      {(s.quantidade_real ?? s.quantidade).toLocaleString('pt-BR')} {s.unidade}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-primary">{formatMoeda(s.valor_total)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-muted">{s.mes_referencia}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.prazo ? (
                      <span className={cn(
                        'text-xs',
                        new Date(s.prazo) < new Date() && s.status !== 'finalizado'
                          ? 'text-danger font-semibold'
                          : 'text-text-muted'
                      )}>
                        {formatDate(s.prazo)}
                        {new Date(s.prazo) < new Date() && s.status !== 'finalizado' && ' ⚠️'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium', statusServicosCor(s.status))}>
                      {statusServicosLabel(s.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ArrowRight size={16} className="text-text-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
