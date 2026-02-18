'use client'

import { useState } from 'react'
import { Bell, Search, X, RefreshCw, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { cn, formatTimeAgo } from '@/lib/utils'
import type { Alerta } from '@/types'

interface HeaderProps {
  titulo: string
  subtitulo?: string
  alertas: Alerta[]
  onMarcarLido: (id: string) => void
  onMarcarTodosLidos: () => void
  onRefresh?: () => void
}

export default function Header({
  titulo, subtitulo, alertas, onMarcarLido, onMarcarTodosLidos, onRefresh
}: HeaderProps) {
  const [showAlertas, setShowAlertas] = useState(false)
  const [search, setSearch] = useState('')
  const naoLidos = alertas.filter(a => !a.lido).length

  const iconeCor = (tipo: string) => {
    const cores: Record<string, string> = {
      critico: 'text-danger bg-red-50',
      aviso: 'text-warning bg-yellow-50',
      info: 'text-info bg-cyan-50',
      sucesso: 'text-success bg-green-50',
    }
    return cores[tipo] ?? cores.info
  }

  return (
    <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-20 no-print">
      <div>
        <h1 className="text-xl font-bold text-primary">{titulo}</h1>
        {subtitulo && <p className="text-sm text-text-muted mt-0.5">{subtitulo}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar NF, pedido..."
            className="pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 w-56 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-text-muted" />
            </button>
          )}
        </div>

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-text-muted hover:text-accent hover:bg-surface rounded-xl transition-all"
            title="Atualizar dados"
          >
            <RefreshCw size={18} />
          </button>
        )}

        {/* Alertas */}
        <div className="relative">
          <button
            onClick={() => setShowAlertas(!showAlertas)}
            className={cn(
              'p-2 rounded-xl transition-all relative',
              showAlertas ? 'bg-accent text-white' : 'text-text-muted hover:text-accent hover:bg-surface'
            )}
          >
            <Bell size={20} />
            {naoLidos > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-xs font-bold rounded-full flex items-center justify-center">
                {naoLidos > 9 ? '9+' : naoLidos}
              </span>
            )}
          </button>

          {showAlertas && (
            <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-dropdown border border-border z-50 slide-in-right">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-primary text-sm">
                  Alertas {naoLidos > 0 && <span className="text-danger">({naoLidos} novos)</span>}
                </span>
                <div className="flex items-center gap-2">
                  {naoLidos > 0 && (
                    <button
                      onClick={() => { onMarcarTodosLidos(); setShowAlertas(false) }}
                      className="text-xs text-accent hover:underline flex items-center gap-1"
                    >
                      <CheckCheck size={12} /> Marcar todos
                    </button>
                  )}
                  <button onClick={() => setShowAlertas(false)}>
                    <X size={16} className="text-text-muted hover:text-primary" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {alertas.length === 0 ? (
                  <div className="px-4 py-8 text-center text-text-muted text-sm">
                    Nenhum alerta no momento
                  </div>
                ) : (
                  alertas.slice(0, 10).map(a => (
                    <div
                      key={a.id}
                      onClick={() => onMarcarLido(a.id)}
                      className={cn(
                        'flex gap-3 px-4 py-3 hover:bg-surface cursor-pointer transition-all border-b border-border/50',
                        !a.lido && 'bg-blue-50/50'
                      )}
                    >
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs', iconeCor(a.tipo))}>
                        {a.tipo === 'critico' ? '🔴' : a.tipo === 'aviso' ? '🟡' : a.tipo === 'sucesso' ? '✅' : 'ℹ️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-semibold', !a.lido ? 'text-primary' : 'text-text-muted')}>
                          {a.titulo}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5 leading-relaxed line-clamp-2">{a.mensagem}</p>
                        <p className="text-xs text-text-light mt-1">{formatTimeAgo(a.criado_em)}</p>
                      </div>
                      {!a.lido && <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-1" />}
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-3 border-t border-border text-center">
                <Link
                  href="/dashboard"
                  onClick={() => setShowAlertas(false)}
                  className="text-xs text-accent hover:underline"
                >
                  Ver dashboard completo
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
