'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Truck, AlertTriangle, Package, BarChart3,
  MessageSquare, Users, Settings, LogOut, Bell, Zap, ChevronRight
} from 'lucide-react'
import type { Usuario } from '@/types'
import { cn } from '@/lib/utils'
import { nivelAcessoLabel, nivelAcessoCor } from '@/lib/utils'

interface SidebarProps {
  usuario: Usuario
  alertasNaoLidos: number
  onLogout: () => void
  mensagensNaoLidas: number
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', niveis: ['admin', 'gestor', 'operador', 'atendimento'] },
  { href: '/derrubadas', icon: Truck, label: 'Derrubadas', niveis: ['admin', 'gestor', 'operador'] },
  { href: '/rupturas', icon: AlertTriangle, label: 'Rupturas / Pendências', niveis: ['admin', 'gestor', 'operador', 'atendimento'] },
  { href: '/servicos', icon: Package, label: 'Serviços Extras', niveis: ['admin', 'gestor', 'operador', 'atendimento'] },
  { href: '/relatorios', icon: BarChart3, label: 'Relatórios', niveis: ['admin', 'gestor'] },
  { href: '/chat', icon: MessageSquare, label: 'Chat Interno', niveis: ['admin', 'gestor', 'operador', 'atendimento'] },
  { href: '/clientes', icon: Users, label: 'Clientes', niveis: ['admin', 'gestor'] },
  { href: '/configuracoes', icon: Settings, label: 'Configurações', niveis: ['admin'] },
]

export default function Sidebar({ usuario, alertasNaoLidos, onLogout, mensagensNaoLidas }: SidebarProps) {
  const pathname = usePathname()

  const itemsVisiveis = navItems.filter(item => item.niveis.includes(usuario.nivel_acesso))

  return (
    <aside className="w-64 min-h-screen bg-primary flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
            <Truck size={18} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base">ExpedFontes</span>
            <div className="text-slate-500 text-xs">Gestão Logística</div>
          </div>
        </div>
      </div>

      {/* IA Badge */}
      <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-2">
        <Zap size={14} className="text-accent flex-shrink-0" />
        <span className="text-xs text-accent font-medium">IA Ativa — Monitorando</span>
        <div className="ml-auto w-2 h-2 rounded-full bg-accent animate-pulse" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {itemsVisiveis.map(item => {
          const ativo = pathname.startsWith(item.href)
          const badge = item.href === '/rupturas' ? alertasNaoLidos : item.href === '/chat' ? mensagensNaoLidas : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                ativo
                  ? 'nav-active shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              )}
            >
              <item.icon size={18} className={ativo ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className={cn(
                  'text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1',
                  ativo ? 'bg-white/20 text-white' : 'bg-danger text-white'
                )}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {ativo && <ChevronRight size={14} className="text-white/50" />}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">
              {usuario.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white text-sm font-medium truncate">{usuario.nome}</div>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', nivelAcessoCor(usuario.nivel_acesso))}>
              {nivelAcessoLabel(usuario.nivel_acesso)}
            </span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-danger hover:bg-red-500/10 text-sm transition-all"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
