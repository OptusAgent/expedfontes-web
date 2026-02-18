'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Search, Filter, Clock, ArrowRight, RefreshCw, Plus } from 'lucide-react'
import { rupturasStorage, clientesStorage } from '@/lib/storage'
import { cn, nivelUrgenciaCor, nivelUrgenciaLabel, formatDate, formatTimeAgo } from '@/lib/utils'
import type { Ruptura } from '@/types'

export default function RupturasPage() {
  const router = useRouter()
  const [rupturas, setRupturas] = useState<Ruptura[]>([])
  const [filtro, setFiltro] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [apenasAtivas, setApenasAtivas] = useState(true)
  const [clientes, setClientes] = useState<string[]>([])

  useEffect(() => { carregar() }, [])

  function carregar() {
    const all = rupturasStorage.getAll()
    setRupturas(all.sort((a, b) => b.score_urgencia - a.score_urgencia))
    const nomes = [...new Set(all.map(r => r.cliente_nome))].sort()
    setClientes(nomes)
  }

  const filtradas = rupturas.filter(r => {
    if (apenasAtivas && r.resolvida) return false
    if (filtroNivel && r.nivel_urgencia !== filtroNivel) return false
    if (filtroCliente && r.cliente_id !== filtroCliente) return false
    if (filtro) {
      const f = filtro.toLowerCase()
      return r.numero_nf.includes(f) || r.cliente_nome.toLowerCase().includes(f) || r.transportadora.toLowerCase().includes(f)
    }
    return true
  })

  const stats = {
    total: rupturas.filter(r => !r.resolvida).length,
    criticas: rupturas.filter(r => !r.resolvida && r.nivel_urgencia === 'critico').length,
    urgentes: rupturas.filter(r => !r.resolvida && r.nivel_urgencia === 'urgente').length,
    atencao: rupturas.filter(r => !r.resolvida && r.nivel_urgencia === 'atencao').length,
  }

  const motivoLabel: Record<string, string> = {
    sem_etiqueta: 'Sem Etiqueta',
    cancelada: 'Cancelada',
    aguardando_liberacao: 'Aguard. Liberação',
    erro_bling: 'Erro Bling',
    produto_avariado: 'Prod. Avariado',
  }

  const clientesLista = clientesStorage.getAll()

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total ativas', valor: stats.total, cor: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: '🔴 Críticas (5+ dias)', valor: stats.criticas, cor: 'bg-red-50 text-red-700 border-red-200' },
          { label: '🟠 Urgentes (3-5 dias)', valor: stats.urgentes, cor: 'bg-orange-50 text-orange-700 border-orange-200' },
          { label: '🟡 Atenção (1-3 dias)', valor: stats.atencao, cor: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-xl p-4 border', s.cor)}>
            <div className="text-2xl font-bold">{s.valor}</div>
            <div className="text-xs font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              placeholder="Buscar por NF, cliente, transportadora..."
              className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <select
            value={filtroNivel}
            onChange={e => setFiltroNivel(e.target.value)}
            className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none"
          >
            <option value="">Todos os níveis</option>
            <option value="critico">🔴 Crítico</option>
            <option value="urgente">🟠 Urgente</option>
            <option value="atencao">🟡 Atenção</option>
            <option value="normal">🔵 Normal</option>
          </select>

          <select
            value={filtroCliente}
            onChange={e => setFiltroCliente(e.target.value)}
            className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none"
          >
            <option value="">Todos os clientes</option>
            {clientesLista.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={apenasAtivas}
              onChange={e => setApenasAtivas(e.target.checked)}
              className="w-4 h-4 accent-accent rounded"
            />
            Apenas ativas
          </label>

          <button onClick={carregar} className="p-2 text-text-muted hover:text-accent hover:bg-surface rounded-xl transition-all" title="Atualizar">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-primary text-sm">
            {filtradas.length} ruptura{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-text-muted">Score calculado por IA a cada hora</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['NF', 'Cliente', 'Transportadora', 'Motivo', 'Dias', 'Score IA', 'Ações', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-text-muted text-sm">
                    Nenhuma ruptura encontrada com os filtros aplicados
                  </td>
                </tr>
              ) : filtradas.map(r => (
                <tr
                  key={r.id}
                  className={cn(
                    'border-b border-border/50 hover:bg-surface transition-all cursor-pointer',
                    `urgencia-${r.nivel_urgencia}`
                  )}
                  onClick={() => router.push(`/rupturas/${r.id}`)}
                >
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-sm text-primary">{r.numero_nf}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-text-primary">{r.cliente_nome}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-text-muted">{r.transportadora}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                      {motivoLabel[r.motivo] ?? r.motivo}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Clock size={13} className={r.dias_pendente >= 5 ? 'text-danger' : r.dias_pendente >= 3 ? 'text-warning' : 'text-info'} />
                      <span className={cn(
                        'text-sm font-semibold',
                        r.dias_pendente >= 5 ? 'text-danger' : r.dias_pendente >= 3 ? 'text-warning' : 'text-primary'
                      )}>
                        {r.dias_pendente}d
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', r.nivel_urgencia === 'critico' ? 'bg-danger' : r.nivel_urgencia === 'urgente' ? 'bg-orange-500' : r.nivel_urgencia === 'atencao' ? 'bg-warning' : 'bg-info')}
                          style={{ width: `${r.score_urgencia}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-primary">{r.score_urgencia}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-text-muted">
                      {r.acoes.length} ação{r.acoes.length !== 1 ? 'ões' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium', nivelUrgenciaCor(r.nivel_urgencia))}>
                      {nivelUrgenciaLabel(r.nivel_urgencia)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
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
