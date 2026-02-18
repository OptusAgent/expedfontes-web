'use client'

import { useEffect, useState } from 'react'
import { authStorage, usuariosStorage, resetStorage } from '@/lib/storage'
import { cn, nivelAcessoLabel, nivelAcessoCor, uuid } from '@/lib/utils'
import { USUARIOS_MOCK } from '@/lib/data/mockData'
import type { Usuario } from '@/types'

export default function ConfiguracoesPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [tab, setTab] = useState(0)
  const [showNovo, setShowNovo] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', nivel_acesso: 'operador', senha: '123456' })
  const usuarioLogado = authStorage.getUsuarioLogado()

  useEffect(() => { setUsuarios(usuariosStorage.getAll()) }, [])

  function criarUsuario() {
    const novo: Usuario = {
      id: uuid(),
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      nivel_acesso: form.nivel_acesso as Usuario['nivel_acesso'],
      ativo: true,
      criado_em: new Date().toISOString(),
    }
    usuariosStorage.create(novo)
    setUsuarios(usuariosStorage.getAll())
    setShowNovo(false)
    setForm({ nome: '', email: '', nivel_acesso: 'operador', senha: '123456' })
  }

  function toggleAtivo(id: string, ativo: boolean) {
    usuariosStorage.update(id, { ativo: !ativo })
    setUsuarios(usuariosStorage.getAll())
  }

  function resetarDados() {
    if (confirm('Resetar TODOS os dados para o estado inicial dos mocks? Esta ação não pode ser desfeita.')) {
      resetStorage()
      window.location.reload()
    }
  }

  const TABS = ['Usuários', 'Bling / Integrações', 'IA / Alertas', 'Dados']

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-card border border-border p-1 flex gap-1">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === i ? 'bg-accent text-white' : 'text-text-muted hover:text-primary'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Usuários */}
      {tab === 0 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowNovo(true)}
              className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent-hover"
            >
              + Novo Usuário
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {['Nome', 'E-mail', 'Nível', 'Status', 'Ação'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-surface transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{u.nome.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-sm text-primary">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', nivelAcessoCor(u.nivel_acesso))}>
                        {nivelAcessoLabel(u.nivel_acesso)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.id !== usuarioLogado?.id && (
                        <button
                          onClick={() => toggleAtivo(u.id, u.ativo)}
                          className="text-xs text-text-muted hover:text-primary"
                        >
                          {u.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bling */}
      {tab === 1 && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-semibold text-primary mb-4">Configuração Bling API V3</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
              <p className="font-semibold text-blue-800 mb-1">📌 Integração OAuth por Cliente</p>
              <p className="text-blue-700">Cada cliente (marca) deve autorizar acesso ao seu Bling individualmente.
              O fluxo OAuth é iniciado pela tela de Clientes. Os tokens são armazenados criptografados no banco.</p>
            </div>
            {[
              { label: 'Intervalo de Sync', valor: 'A cada 5 minutos', desc: 'Verificação de novas NFs e etiquetas' },
              { label: 'Resolução Automática', valor: 'Ativo', desc: 'Resolve rupturas automaticamente ao detectar etiqueta no Bling' },
              { label: 'Webhook Bling', valor: 'Configurar', desc: 'Recebe notificações em tempo real (reduz polling)' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center p-3 bg-surface rounded-xl">
                <div>
                  <p className="font-medium text-sm text-primary">{item.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                </div>
                <span className="text-sm font-semibold text-accent">{item.valor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IA */}
      {tab === 2 && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
          <h3 className="font-semibold text-primary mb-4">Configuração de IA e Alertas</h3>
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm">
              <p className="font-semibold text-purple-800 mb-1">🤖 Motor de IA — Protótipo</p>
              <p className="text-purple-700">Neste protótipo, as funções de IA são simuladas. Em produção, conecte
              a variável ANTHROPIC_API_KEY para usar Claude API real.</p>
            </div>
            {[
              { label: 'Classificação OBS (NLP)', status: 'Simulado', desc: 'Classifica o campo livre de observações' },
              { label: 'Score de Urgência (ML)', status: 'Ativo', desc: 'Calculado por regras — em produção: RandomForest' },
              { label: 'Briefing Executivo', status: 'Simulado', desc: 'Narração diária da operação' },
              { label: 'IA Vision (Imagens)', status: 'Simulado', desc: 'Extração de dados de DANFE/etiqueta/produto' },
              { label: 'Mensagem para Cliente', status: 'Simulado', desc: 'Geração de mensagem personalizada' },
              { label: 'Previsão de Volume', status: 'Mock', desc: 'Em produção: Prophet + dados históricos Bling' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center p-3 bg-surface rounded-xl">
                <div>
                  <p className="font-medium text-sm text-primary">{item.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                </div>
                <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                  item.status === 'Ativo' ? 'bg-green-100 text-green-700' :
                  item.status === 'Simulado' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dados */}
      {tab === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-primary mb-4">Gerenciamento de Dados</h3>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm">
                <p className="font-semibold text-yellow-800 mb-1">⚠️ Dados de Protótipo (localStorage)</p>
                <p className="text-yellow-700">Os dados são armazenados no localStorage do navegador.
                Em produção, serão migrados para o Supabase PostgreSQL com RLS.</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-xl">
                <div>
                  <p className="font-medium text-sm text-primary">Resetar para dados iniciais</p>
                  <p className="text-xs text-text-muted">Volta todos os dados para o estado original dos mocks</p>
                </div>
                <button
                  onClick={resetarDados}
                  className="px-4 py-2 bg-danger text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all"
                >
                  Resetar Dados
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-primary mb-4">Guia de Migração para Supabase</h3>
            <div className="space-y-3 text-sm">
              {[
                { passo: '1', desc: 'Criar projeto Supabase e executar migrations em packages/database/' },
                { passo: '2', desc: 'Configurar RLS em todas as tabelas para multitenancy' },
                { passo: '3', desc: 'Em lib/storage/index.ts: trocar LocalStorageAdapter por SupabaseAdapter' },
                { passo: '4', desc: 'Definir variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY' },
                { passo: '5', desc: 'Executar script migrations/import_spreadsheets.py para dados históricos' },
                { passo: '6', desc: 'Testar todos os módulos com dados reais' },
              ].map(item => (
                <div key={item.passo} className="flex gap-3">
                  <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{item.passo}</span>
                  <span className="text-text-primary">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal novo usuário */}
      {showNovo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-dropdown">
            <h3 className="font-bold text-primary mb-4">Novo Usuário</h3>
            <div className="space-y-3">
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome completo" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none" />
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="E-mail" type="email" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none" />
              <select value={form.nivel_acesso} onChange={e => setForm(f => ({ ...f, nivel_acesso: e.target.value }))}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none">
                <option value="operador">Operador</option>
                <option value="atendimento">Atendimento</option>
                <option value="gestor">Gestor</option>
                <option value="admin">Admin</option>
              </select>
              <input value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                placeholder="Senha inicial" type="password" className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowNovo(false)} className="flex-1 py-2 border border-border rounded-xl text-sm text-text-muted hover:bg-surface">Cancelar</button>
              <button onClick={criarUsuario} disabled={!form.nome || !form.email} className="flex-1 py-2 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-50">Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
