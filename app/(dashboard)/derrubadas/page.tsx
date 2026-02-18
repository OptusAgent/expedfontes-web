'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Truck, CheckCircle, Clock, Search, ArrowRight, Package } from 'lucide-react'
import { derrubadasStorage, nfsStorage } from '@/lib/storage'
import {
  cn, statusDerrubadasLabel, statusDerrubadasCor, formatDate, formatDateTime
} from '@/lib/utils'
import type { Derrubada } from '@/types'

export default function DerrubadasPage() {
  const router = useRouter()
  const [derrubadas, setDerrubadas] = useState<Derrubada[]>([])
  const [filtro, setFiltro] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [nfsDisponiveis, setNfsDisponiveis] = useState(0)

  useEffect(() => {
    const all = derrubadasStorage.getAll()
    setDerrubadas(all.sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()))
    setNfsDisponiveis(nfsStorage.getDisponiveis().length)
  }, [])

  const filtradas = derrubadas.filter(d => {
    if (filtroStatus && d.status !== filtroStatus) return false
    if (filtro) {
      const f = filtro.toLowerCase()
      return d.codigo.toLowerCase().includes(f) || d.cliente_nome.toLowerCase().includes(f) || d.operador_nome.toLowerCase().includes(f)
    }
    return true
  })

  const stats = {
    total: derrubadas.length,
    expedidas: derrubadas.filter(d => d.status === 'expedida').length,
    emAndamento: derrubadas.filter(d => d.status === 'preparando' || d.status === 'aguardando_impressao').length,
  }

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total de Derrubadas', valor: stats.total, icon: Truck, cor: 'text-accent bg-blue-50' },
          { label: 'Expedidas', valor: stats.expedidas, icon: CheckCircle, cor: 'text-success bg-green-50' },
          { label: 'Em Andamento', valor: stats.emAndamento, icon: Clock, cor: 'text-warning bg-yellow-50' },
          { label: 'NFs Disponíveis', valor: nfsDisponiveis, icon: Package, cor: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{s.valor}</div>
                <div className="text-xs text-text-muted mt-1">{s.label}</div>
              </div>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.cor)}>
                <s.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NFs disponíveis — destaque */}
      {nfsDisponiveis > 0 && (
        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
              <Package size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-primary">
                {nfsDisponiveis} NF{nfsDisponiveis !== 1 ? 's' : ''} disponível{nfsDisponiveis !== 1 ? 'is' : ''} para derrubada
              </p>
              <p className="text-sm text-text-muted">Com etiqueta liberada, prontas para expedição</p>
            </div>
          </div>
          <Link
            href="/derrubadas/nova"
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-accent-hover transition-all"
          >
            <Plus size={16} /> Nova Derrubada
          </Link>
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
              placeholder="Buscar por código, cliente, operador..."
              className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none"
          >
            <option value="">Todos os status</option>
            <option value="preparando">Preparando</option>
            <option value="aguardando_impressao">Aguardando Impressão</option>
            <option value="expedida">Expedida</option>
          </select>

          <Link
            href="/derrubadas/nova"
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-accent-hover transition-all ml-auto"
          >
            <Plus size={16} /> Nova Derrubada
          </Link>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface">
                {['Código', 'Cliente', 'Operador', 'Transportadora', 'NFs', 'Pendentes', 'Data Criação', 'Status', ''].map(h => (
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
                    Nenhuma derrubada encontrada
                  </td>
                </tr>
              ) : filtradas.map(d => (
                <tr
                  key={d.id}
                  className="border-b border-border/50 hover:bg-surface transition-all cursor-pointer"
                  onClick={() => router.push(`/derrubadas/${d.id}`)}
                >
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-sm text-primary">{d.codigo}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-text-primary">{d.cliente_nome}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-text-muted">{d.operador_nome}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-text-muted">{d.transportadora}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-primary">{d.qtd_nfs}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-sm font-semibold', d.qtd_pendentes > 0 ? 'text-danger' : 'text-success')}>
                      {d.qtd_pendentes > 0 ? `${d.qtd_pendentes} ⚠️` : '✅ 0'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-text-muted">{formatDate(d.data_criacao)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium', statusDerrubadasCor(d.status))}>
                      {statusDerrubadasLabel(d.status)}
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
