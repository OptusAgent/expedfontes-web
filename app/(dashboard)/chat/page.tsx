'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Users, MessageSquare, Hash, Bell } from 'lucide-react'
import { chatStorage, authStorage, usuariosStorage, alertasStorage } from '@/lib/storage'
import { cn, formatTimeAgo, uuid } from '@/lib/utils'
import type { MensagemChat, Conversa, Usuario } from '@/types'

export default function ChatPage() {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaAtiva, setConversaAtiva] = useState<string>('')
  const [mensagens, setMensagens] = useState<MensagemChat[]>([])
  const [texto, setTexto] = useState('')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const usuario = authStorage.getUsuarioLogado()

  useEffect(() => {
    const convs = chatStorage.getConversas()
    setConversas(convs)
    if (convs.length > 0) {
      setConversaAtiva(convs[0].id)
    }
    setUsuarios(usuariosStorage.getAll().filter(u => u.ativo))
  }, [])

  useEffect(() => {
    if (conversaAtiva) {
      const msgs = chatStorage.getMensagens(conversaAtiva)
      setMensagens(msgs.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()))
      // Zera não-lidas
      chatStorage.updateConversa(conversaAtiva, { nao_lidas: 0 })
    }
  }, [conversaAtiva])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  function enviar() {
    if (!texto.trim() || !usuario || !conversaAtiva) return

    const msg: MensagemChat = {
      id: uuid(),
      conversa_id: conversaAtiva,
      remetente_id: usuario.id,
      remetente_nome: usuario.nome,
      conteudo: texto.trim(),
      tipo: 'texto',
      criado_em: new Date().toISOString(),
      lida: false,
    }

    chatStorage.createMensagem(msg)
    chatStorage.updateConversa(conversaAtiva, {
      ultima_mensagem: texto.trim(),
      ultima_mensagem_em: new Date().toISOString(),
    })

    setTexto('')
    const updated = chatStorage.getMensagens(conversaAtiva).sort(
      (a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
    )
    setMensagens(updated)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const convAtiva = conversas.find(c => c.id === conversaAtiva)
  const participantesSemMim = convAtiva?.participantes
    .filter(p => p !== usuario?.id)
    .map(p => usuarios.find(u => u.id === p))
    .filter(Boolean) as Usuario[] ?? []

  // Agrupa mensagens por data
  const mensagensAgrupadas = mensagens.reduce((groups, msg) => {
    const date = new Date(msg.criado_em).toLocaleDateString('pt-BR')
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
    return groups
  }, {} as Record<string, MensagemChat[]>)

  const alertasRecentes = alertasStorage.getAll().slice(0, 3)

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-card border border-border overflow-hidden">
      {/* Sidebar conversas */}
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-primary text-sm">Conversas</h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversas.map(conv => (
            <button
              key={conv.id}
              onClick={() => setConversaAtiva(conv.id)}
              className={cn(
                'w-full text-left px-4 py-3 hover:bg-surface transition-all border-b border-border/50',
                conversaAtiva === conv.id && 'bg-accent/5 border-l-2 border-accent'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  {conv.participantes.length > 2
                    ? <Hash size={16} className="text-accent" />
                    : <MessageSquare size={16} className="text-accent" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary truncate">
                      {conv.titulo ?? 'Conversa'}
                    </span>
                    {conv.nao_lidas > 0 && (
                      <span className="bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.nao_lidas}
                      </span>
                    )}
                  </div>
                  {conv.ultima_mensagem && (
                    <p className="text-xs text-text-muted mt-0.5 truncate">{conv.ultima_mensagem}</p>
                  )}
                  {conv.ultima_mensagem_em && (
                    <p className="text-xs text-text-light mt-0.5">{formatTimeAgo(conv.ultima_mensagem_em)}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Membros online */}
        <div className="p-4 border-t border-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            <Users size={11} className="inline mr-1" /> Equipe ({usuarios.length})
          </p>
          <div className="space-y-2">
            {usuarios.slice(0, 5).map(u => (
              <div key={u.id} className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{u.nome.charAt(0)}</span>
                  </div>
                  <div className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white',
                    u.id === usuario?.id ? 'bg-success' : Math.random() > 0.5 ? 'bg-success' : 'bg-slate-300'
                  )} />
                </div>
                <span className="text-xs text-text-muted truncate">{u.nome.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col">
        {/* Header da conversa */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-primary">{convAtiva?.titulo}</h3>
            <p className="text-xs text-text-muted">
              {convAtiva?.participantes.length} participantes
            </p>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Alertas do sistema */}
          {alertasRecentes.filter(a => !a.lido).length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-3">
              <Bell size={16} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-yellow-800">Alertas do Sistema</p>
                {alertasRecentes.filter(a => !a.lido).slice(0, 2).map(a => (
                  <p key={a.id} className="text-xs text-yellow-700 mt-1">· {a.mensagem}</p>
                ))}
              </div>
            </div>
          )}

          {Object.entries(mensagensAgrupadas).map(([date, msgs]) => (
            <div key={date}>
              <div className="text-center mb-3">
                <span className="text-xs text-text-muted bg-surface px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>

              {msgs.map(msg => {
                const isMeu = msg.remetente_id === usuario?.id
                const isSystem = msg.tipo === 'sistema'

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <span className="text-xs text-text-muted bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        🤖 {msg.conteudo}
                      </span>
                    </div>
                  )
                }

                return (
                  <div
                    key={msg.id}
                    className={cn('flex gap-3 mb-2', isMeu && 'flex-row-reverse')}
                  >
                    {!isMeu && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {msg.remetente_nome.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className={cn('max-w-xs xl:max-w-md', isMeu && 'items-end flex flex-col')}>
                      {!isMeu && (
                        <span className="text-xs text-text-muted mb-1 ml-1">{msg.remetente_nome}</span>
                      )}
                      <div className={cn(
                        'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                        isMeu
                          ? 'bg-accent text-white rounded-tr-sm'
                          : 'bg-surface text-primary rounded-tl-sm border border-border'
                      )}>
                        {msg.conteudo}
                      </div>
                      <span className={cn('text-xs text-text-light mt-1', isMeu && 'text-right')}>
                        {formatTimeAgo(msg.criado_em)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-end gap-3">
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Digite sua mensagem... (Enter para enviar)"
              rows={1}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none max-h-24"
              style={{ minHeight: '40px' }}
            />
            <button
              onClick={enviar}
              disabled={!texto.trim()}
              className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center hover:bg-accent-hover transition-all disabled:opacity-50 flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-xs text-text-light mt-1.5 ml-1">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  )
}
