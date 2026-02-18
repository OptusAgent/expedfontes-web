'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, CheckCircle, XCircle, Link2, RefreshCw } from 'lucide-react'
import { clientesStorage } from '@/lib/storage'
import { cn } from '@/lib/utils'
import type { Cliente } from '@/types'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filtro, setFiltro] = useState('')
  const [showNovo, setShowNovo] = useState(false)
  const [form, setForm] = useState({ nome: '', cnpj: '', email_contato: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { setClientes(clientesStorage.getAll()) }, [])

  const filtrados = clientes.filter(c =>
    !filtro || c.nome.toLowerCase().includes(filtro.toLowerCase()) || c.cnpj.includes(filtro)
  )

  function simularOAuth(id: string) {
    alert(`🔗 Fluxo OAuth Bling\n\nEm produção, o cliente ${id} seria redirecionado para autorizar acesso ao Bling.\n\nURL: https://www.bling.com.br/Api/v3/oauth/authorize?client_id=...&response_type=code&redirect_uri=...`)
    clientesStorage.update(id, { bling_configurado: true })
    setClientes(clientesStorage.getAll())
  }

  function criar() {
    if (!form.nome || !form.cnpj || !form.email_contato) return
    const { uuid } = require('@/lib/utils')
    const novo: Cliente = {
      id: `cli-${Date.now()}`,
      ...form,
      ativo: true,
      bling_configurado: false,
      criado_em: new Date().toISOString(),
    }
    clientesStorage.create(novo)
    setClientes(clientesStorage.getAll())
    setShowNovo(false)
    setForm({ nome: '', cnpj: '', email_contato: '' })
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Clientes', valor: clientes.length, cor: 'bg-blue-50 text-blue-700' },
          { label: 'Bling Configurado', valor: clientes.filter(c => c.bling_configurado).length, cor: 'bg-green-50 text-green-700' },
          { label: 'Sem Integração', valor: clientes.filter(c => !c.bling_configurado).length, cor: 'bg-yellow-50 text-yellow-700' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-xl p-4', s.cor)}>
            <div className="text-2xl font-bold">{s.valor}</div>
            <div className="text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-card border border-border flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            placeholder="Buscar cliente, CNPJ..."
            className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <button
          onClick={() => setShowNovo(true)}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-accent-hover transition-all"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface">
              {['Cliente', 'CNPJ', 'E-mail de Contato', 'Bling', 'Status', 'Ação'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-surface transition-all">
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-sm text-primary">{c.nome}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-text-muted font-mono">{c.cnpj}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-text-muted">{c.email_contato}</span>
                </td>
                <td className="px-4 py-3.5">
                  {c.bling_configurado ? (
                    <div className="flex items-center gap-1.5 text-success text-xs font-medium">
                      <CheckCircle size={14} /> Conectado
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-warning text-xs font-medium">
                      <XCircle size={14} /> Não configurado
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full font-medium',
                    c.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  )}>
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {!c.bling_configurado && (
                    <button
                      onClick={() => simularOAuth(c.id)}
                      className="flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      <Link2 size={12} /> Conectar Bling
                    </button>
                  )}
                  {c.bling_configurado && (
                    <button
                      onClick={() => { alert('Sincronizando com Bling...'); setTimeout(() => alert('Sincronização concluída! ✅'), 1500) }}
                      className="flex items-center gap-1 text-xs text-text-muted hover:text-accent"
                    >
                      <RefreshCw size={12} /> Sincronizar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal novo cliente */}
      {showNovo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-dropdown">
            <h3 className="font-bold text-primary mb-4">Novo Cliente</h3>
            <div className="space-y-3">
              <input
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome / Razão Social"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none"
              />
              <input
                value={form.cnpj}
                onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                placeholder="CNPJ (00.000.000/0001-00)"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none"
              />
              <input
                value={form.email_contato}
                onChange={e => setForm(f => ({ ...f, email_contato: e.target.value }))}
                placeholder="E-mail de contato"
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowNovo(false)} className="flex-1 py-2 border border-border rounded-xl text-sm text-text-muted hover:bg-surface">Cancelar</button>
              <button onClick={criar} disabled={!form.nome || !form.cnpj || !form.email_contato} className="flex-1 py-2 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-50">Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
