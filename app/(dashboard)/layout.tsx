'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import {
  authStorage, initStorage, alertasStorage, chatStorage
} from '@/lib/storage'
import type { Usuario, Alerta } from '@/types'

const PAGE_TITLES: Record<string, { titulo: string; subtitulo?: string }> = {
  '/dashboard': { titulo: 'Dashboard', subtitulo: 'Visão geral da operação em tempo real' },
  '/derrubadas': { titulo: 'Derrubadas', subtitulo: 'Gestão de lotes de expedição' },
  '/derrubadas/nova': { titulo: 'Nova Derrubada', subtitulo: 'Criar novo lote de expedição' },
  '/rupturas': { titulo: 'Rupturas / Pendências', subtitulo: 'NFs com problema aguardando resolução' },
  '/servicos': { titulo: 'Serviços Extras', subtitulo: 'Ordens de serviço: etiquetagem, kits, paletes' },
  '/servicos/nova': { titulo: 'Nova Ordem de Serviço', subtitulo: 'Registrar novo serviço extra' },
  '/chat': { titulo: 'Chat Interno', subtitulo: 'Comunicação da equipe em tempo real' },
  '/relatorios': { titulo: 'Relatórios', subtitulo: 'Analytics e insights da operação' },
  '/clientes': { titulo: 'Clientes', subtitulo: 'Gestão de clientes e integrações Bling' },
  '/configuracoes': { titulo: 'Configurações', subtitulo: 'Configurações do sistema' },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initStorage()
    const u = authStorage.getUsuarioLogado()
    if (!u) {
      router.replace('/login')
      return
    }
    setUsuario(u)
    setAlertas(alertasStorage.getAll())

    // Conta mensagens não lidas
    const conversas = chatStorage.getConversas()
    const total = conversas.reduce((acc, c) => acc + c.nao_lidas, 0)
    setMensagensNaoLidas(total)

    setReady(true)
  }, [router])

  const refreshAlertas = useCallback(() => {
    setAlertas(alertasStorage.getAll())
  }, [])

  function handleLogout() {
    authStorage.logout()
    router.replace('/login')
  }

  function handleMarcarLido(id: string) {
    alertasStorage.marcarLido(id)
    refreshAlertas()
  }

  function handleMarcarTodosLidos() {
    alertasStorage.marcarTodosLidos()
    refreshAlertas()
  }

  if (!ready || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <div className="ai-thinking">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  const pageInfo = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? { titulo: 'ExpedFontes' }

  const naoLidos = alertas.filter(a => !a.lido).length

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        usuario={usuario}
        alertasNaoLidos={naoLidos}
        mensagensNaoLidas={mensagensNaoLidas}
        onLogout={handleLogout}
      />

      {/* Main content — offset pela sidebar */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header
          titulo={pageInfo.titulo}
          subtitulo={pageInfo.subtitulo}
          alertas={alertas}
          onMarcarLido={handleMarcarLido}
          onMarcarTodosLidos={handleMarcarTodosLidos}
          onRefresh={refreshAlertas}
        />
        <main className="flex-1 p-6 fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
