// ============================================================
// CAMADA DE STORAGE — ExpedFontes
//
// ARQUITETURA DE MIGRAÇÃO:
// Esta camada abstrai TODA a persistência de dados.
// Hoje usa localStorage. Para migrar para Supabase:
//   1. Crie lib/storage/supabase.ts implementando StorageAdapter
//   2. Troque 'localStorageAdapter' por 'supabaseAdapter' no export
//   3. Nenhuma page/component precisa ser alterada
//
// MAPEAMENTO Supabase:
//   storage.getAll('usuarios')   → supabase.from('usuarios').select('*')
//   storage.getById('nfs', id)   → supabase.from('nfs').select('*').eq('id', id)
//   storage.create('nfs', data)  → supabase.from('nfs').insert(data)
//   storage.update('nfs', id, d) → supabase.from('nfs').update(d).eq('id', id)
//   storage.delete('nfs', id)    → supabase.from('nfs').delete().eq('id', id)
// ============================================================

import {
  USUARIOS_MOCK, CLIENTES_MOCK, NFS_MOCK,
  DERRUBADAS_MOCK, RUPTURAS_MOCK, SERVICOS_MOCK,
  ALERTAS_MOCK, CONVERSAS_MOCK, MENSAGENS_MOCK,
} from '@/lib/data/mockData'
import type {
  Usuario, Cliente, NF, Derrubada, Ruptura,
  ServicoExtra, Alerta, MensagemChat, Conversa
} from '@/types'

// Chaves no localStorage
const KEYS = {
  usuarios: 'ef_usuarios',
  clientes: 'ef_clientes',
  nfs: 'ef_nfs',
  derrubadas: 'ef_derrubadas',
  rupturas: 'ef_rupturas',
  servicos: 'ef_servicos',
  alertas: 'ef_alertas',
  conversas: 'ef_conversas',
  mensagens: 'ef_mensagens',
  usuario_logado: 'ef_usuario_logado',
  seed_version: 'ef_seed_v1',
} as const

type StorageKey = keyof typeof KEYS

// Garante que o server-side não quebra (Next.js SSR)
const isBrowser = typeof window !== 'undefined'

// ── Inicialização com dados mock ──────────────────────────────
export function initStorage() {
  if (!isBrowser) return

  // Recria os dados mock se for a primeira vez ou versão nova
  if (!localStorage.getItem(KEYS.seed_version)) {
    localStorage.setItem(KEYS.usuarios, JSON.stringify(USUARIOS_MOCK))
    localStorage.setItem(KEYS.clientes, JSON.stringify(CLIENTES_MOCK))
    localStorage.setItem(KEYS.nfs, JSON.stringify(NFS_MOCK))
    localStorage.setItem(KEYS.derrubadas, JSON.stringify(DERRUBADAS_MOCK))
    localStorage.setItem(KEYS.rupturas, JSON.stringify(RUPTURAS_MOCK))
    localStorage.setItem(KEYS.servicos, JSON.stringify(SERVICOS_MOCK))
    localStorage.setItem(KEYS.alertas, JSON.stringify(ALERTAS_MOCK))
    localStorage.setItem(KEYS.conversas, JSON.stringify(CONVERSAS_MOCK))
    localStorage.setItem(KEYS.mensagens, JSON.stringify(MENSAGENS_MOCK))
    localStorage.setItem(KEYS.seed_version, '1')
  }
}

export function resetStorage() {
  if (!isBrowser) return
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  initStorage()
}

// ── Storage genérico ──────────────────────────────────────────
function getAll<T>(key: string): T[] {
  if (!isBrowser) return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function setAll<T>(key: string, data: T[]): void {
  if (!isBrowser) return
  localStorage.setItem(key, JSON.stringify(data))
}

function getById<T extends { id: string }>(key: string, id: string): T | null {
  return getAll<T>(key).find((item) => item.id === id) ?? null
}

function create<T extends { id: string }>(key: string, item: T): T {
  const all = getAll<T>(key)
  all.unshift(item) // mais recente primeiro
  setAll(key, all)
  return item
}

function update<T extends { id: string }>(key: string, id: string, patch: Partial<T>): T | null {
  const all = getAll<T>(key)
  const idx = all.findIndex((item) => item.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...patch }
  setAll(key, all)
  return all[idx]
}

function remove(key: string, id: string): boolean {
  const all = getAll<{ id: string }>(key)
  const filtered = all.filter((item) => item.id !== id)
  if (filtered.length === all.length) return false
  setAll(key, filtered)
  return true
}

// ── Auth ──────────────────────────────────────────────────────
export const authStorage = {
  // ⚡ Supabase: substituir por supabase.auth.signInWithPassword
  login(email: string, senha: string): Usuario | null {
    const usuarios = getAll<Usuario>(KEYS.usuarios)
    const user = usuarios.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha && u.ativo
    )
    if (user) {
      const { senha: _, ...safeUser } = user
      localStorage.setItem(KEYS.usuario_logado, JSON.stringify(safeUser))
      return safeUser as Usuario
    }
    return null
  },
  // ⚡ Supabase: substituir por supabase.auth.signOut
  logout() {
    localStorage.removeItem(KEYS.usuario_logado)
  },
  // ⚡ Supabase: substituir por supabase.auth.getUser
  getUsuarioLogado(): Usuario | null {
    if (!isBrowser) return null
    try {
      const raw = localStorage.getItem(KEYS.usuario_logado)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
}

// ── Usuários ──────────────────────────────────────────────────
export const usuariosStorage = {
  // ⚡ Supabase: supabase.from('usuarios').select('*')
  getAll: () => getAll<Usuario>(KEYS.usuarios),
  // ⚡ Supabase: .eq('id', id)
  getById: (id: string) => getById<Usuario>(KEYS.usuarios, id),
  // ⚡ Supabase: .insert(data)
  create: (u: Usuario) => create<Usuario>(KEYS.usuarios, u),
  // ⚡ Supabase: .update(patch).eq('id', id)
  update: (id: string, patch: Partial<Usuario>) => update<Usuario>(KEYS.usuarios, id, patch),
}

// ── Clientes ──────────────────────────────────────────────────
export const clientesStorage = {
  // ⚡ Supabase: supabase.from('clientes').select('*').eq('tenant_id', tenantId)
  getAll: () => getAll<Cliente>(KEYS.clientes),
  getById: (id: string) => getById<Cliente>(KEYS.clientes, id),
  create: (c: Cliente) => create<Cliente>(KEYS.clientes, c),
  update: (id: string, patch: Partial<Cliente>) => update<Cliente>(KEYS.clientes, id, patch),
  delete: (id: string) => remove(KEYS.clientes, id),
}

// ── NFs ───────────────────────────────────────────────────────
export const nfsStorage = {
  // ⚡ Supabase: supabase.from('nfs').select('*').eq('tenant_id', tenantId)
  getAll: () => getAll<NF>(KEYS.nfs),
  getById: (id: string) => getById<NF>(KEYS.nfs, id),
  getByCliente: (clienteId: string) => getAll<NF>(KEYS.nfs).filter(n => n.cliente_id === clienteId),
  getDisponiveis: () => getAll<NF>(KEYS.nfs).filter(n => n.status === 'etiqueta_liberada'),
  create: (n: NF) => create<NF>(KEYS.nfs, n),
  update: (id: string, patch: Partial<NF>) => update<NF>(KEYS.nfs, id, patch),
}

// ── Derrubadas ────────────────────────────────────────────────
export const derrubadasStorage = {
  // ⚡ Supabase: supabase.from('derrubadas').select('*').order('data_criacao', { ascending: false })
  getAll: () => getAll<Derrubada>(KEYS.derrubadas),
  getById: (id: string) => getById<Derrubada>(KEYS.derrubadas, id),
  create: (d: Derrubada) => create<Derrubada>(KEYS.derrubadas, d),
  update: (id: string, patch: Partial<Derrubada>) => update<Derrubada>(KEYS.derrubadas, id, patch),
  delete: (id: string) => remove(KEYS.derrubadas, id),
}

// ── Rupturas ──────────────────────────────────────────────────
export const rupturasStorage = {
  // ⚡ Supabase: supabase.from('rupturas').select('*, acoes(*)').eq('resolvida', false)
  getAll: () => getAll<Ruptura>(KEYS.rupturas),
  getAtivas: () => getAll<Ruptura>(KEYS.rupturas).filter(r => !r.resolvida),
  getById: (id: string) => getById<Ruptura>(KEYS.rupturas, id),
  create: (r: Ruptura) => create<Ruptura>(KEYS.rupturas, r),
  update: (id: string, patch: Partial<Ruptura>) => update<Ruptura>(KEYS.rupturas, id, patch),
}

// ── Serviços Extras ───────────────────────────────────────────
export const servicosStorage = {
  // ⚡ Supabase: supabase.from('servicos_extras').select('*').order('data_solicitacao', { ascending: false })
  getAll: () => getAll<ServicoExtra>(KEYS.servicos),
  getById: (id: string) => getById<ServicoExtra>(KEYS.servicos, id),
  getByToken: (token: string) => getAll<ServicoExtra>(KEYS.servicos).find(s => s.aprovacao_token === token) ?? null,
  create: (s: ServicoExtra) => create<ServicoExtra>(KEYS.servicos, s),
  update: (id: string, patch: Partial<ServicoExtra>) => update<ServicoExtra>(KEYS.servicos, id, patch),
  delete: (id: string) => remove(KEYS.servicos, id),
}

// ── Alertas ───────────────────────────────────────────────────
export const alertasStorage = {
  // ⚡ Supabase: supabase.from('alertas').select('*').order('criado_em', { ascending: false })
  getAll: () => getAll<Alerta>(KEYS.alertas),
  getNaoLidos: () => getAll<Alerta>(KEYS.alertas).filter(a => !a.lido),
  create: (a: Alerta) => create<Alerta>(KEYS.alertas, a),
  marcarLido: (id: string) => update<Alerta>(KEYS.alertas, id, { lido: true } as Partial<Alerta>),
  marcarTodosLidos: () => {
    const all = getAll<Alerta>(KEYS.alertas).map(a => ({ ...a, lido: true }))
    setAll(KEYS.alertas, all)
  },
}

// ── Chat ──────────────────────────────────────────────────────
export const chatStorage = {
  // ⚡ Supabase: supabase.from('conversas').select('*').contains('participantes', [userId])
  getConversas: () => getAll<Conversa>(KEYS.conversas),
  getConversa: (id: string) => getById<Conversa>(KEYS.conversas, id),
  getMensagens: (conversaId: string) =>
    getAll<MensagemChat>(KEYS.mensagens).filter(m => m.conversa_id === conversaId),
  createMensagem: (m: MensagemChat) => create<MensagemChat>(KEYS.mensagens, m),
  updateConversa: (id: string, patch: Partial<Conversa>) => update<Conversa>(KEYS.conversas, id, patch),
}
