'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle, Truck, Package, CheckCircle, TrendingUp,
  TrendingDown, Zap, RefreshCw, ArrowRight, Clock,
  BarChart3, Users
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  nfsStorage, derrubadasStorage, rupturasStorage,
  servicosStorage, alertasStorage, clientesStorage
} from '@/lib/storage'
import { gerarBriefing } from '@/lib/ai'
import {
  DADOS_VOLUME_SEMANA, DADOS_RUPTURA_TRANSPORTADORA,
  DADOS_SLA_MENSAL, BRIEFINGS_IA
} from '@/lib/data/mockData'
import { cn, formatMoeda, nivelUrgenciaCor, formatTimeAgo } from '@/lib/utils'
import type { Ruptura, Alerta } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [briefingTexto, setBriefingTexto] = useState('')
  const [metricas, setMetricas] = useState({
    nfsPendentes: 0,
    derrubadasHoje: 0,
    criticas: 0,
    servicosAndamento: 0,
    rupturasAtivas: 0,
    expedidas: 0,
    totalClientes: 0,
    valorPendente: 0,
  })
  const [rupturasTop, setRupturasTop] = useState<Ruptura[]>([])
  const [alertasRecentes, setAlertasRecentes] = useState<Alerta[]>([])

  useEffect(() => {
    carregarDados()
    gerarBriefingInicial()
  }, [])

  function carregarDados() {
    const nfs = nfsStorage.getAll()
    const derrubadas = derrubadasStorage.getAll()
    const rupturas = rupturasStorage.getAll()
    const servicos = servicosStorage.getAll()
    const alertas = alertasStorage.getAll()
    const clientes = clientesStorage.getAll()

    const nfsPendentes = nfs.filter(n => n.status === 'aguardando_etiqueta').length
    const hoje = new Date().toISOString().split('T')[0]
    const derrubadasHoje = derrubadas.filter(d => d.data_criacao.startsWith(hoje)).length
    const rupturasAtivas = rupturas.filter(r => !r.resolvida)
    const criticas = rupturasAtivas.filter(r => r.nivel_urgencia === 'critico').length
    const servicosAndamento = servicos.filter(s => s.status === 'em_andamento' || s.status === 'aprovado').length
    const expedidas = derrubadas.filter(d => d.status === 'expedida').length
    const valorPendente = nfs
      .filter(n => n.status === 'aguardando_etiqueta')
      .reduce((acc, n) => acc + n.valor_estimado, 0)

    setMetricas({
      nfsPendentes,
      derrubadasHoje,
      criticas,
      servicosAndamento,
      rupturasAtivas: rupturasAtivas.length,
      expedidas,
      totalClientes: clientes.length,
      valorPendente,
    })

    setRupturasTop(
      rupturasAtivas
        .sort((a, b) => b.score_urgencia - a.score_urgencia)
        .slice(0, 5)
    )

    setAlertasRecentes(alertas.filter(a => !a.lido).slice(0, 4))
    setLoading(false)
  }

  async function gerarBriefingInicial() {
    // Usa um dos briefings pré-gerados para o protótipo
    setBriefingTexto(BRIEFINGS_IA[0].resumo_operacao)
  }

  async function refreshBriefing() {
    setBriefingLoading(true)
    setBriefingTexto('')
    const texto = await gerarBriefing({
      rupturas_ativas: metricas.rupturasAtivas,
      criticas: metricas.criticas,
      derrubadas_hoje: metricas.derrubadasHoje,
      nfs_pendentes: metricas.nfsPendentes,
    })

    // Simula streaming de texto (efeito "digitando")
    let i = 0
    const interval = setInterval(() => {
      setBriefingTexto(texto.slice(0, i))
      i += 8
      if (i >= texto.length) {
        setBriefingTexto(texto)
        clearInterval(interval)
        setBriefingLoading(false)
      }
    }, 20)
  }

  const cardMetricas = [
    {
      icone: AlertTriangle,
      titulo: 'NFs Pendentes',
      valor: metricas.nfsPendentes,
      sub: `${metricas.criticas} críticas`,
      cor: '#EF4444',
      href: '/rupturas',
      tendencia: metricas.criticas > 0 ? 'down' : 'up',
    },
    {
      icone: Truck,
      titulo: 'Derrubadas Hoje',
      valor: metricas.derrubadasHoje,
      sub: `${metricas.expedidas} expedidas`,
      cor: '#3B82F6',
      href: '/derrubadas',
      tendencia: 'up',
    },
    {
      icone: Package,
      titulo: 'Serviços em Andamento',
      valor: metricas.servicosAndamento,
      sub: 'Para fechamento mensal',
      cor: '#8B5CF6',
      href: '/servicos',
      tendencia: 'up',
    },
    {
      icone: CheckCircle,
      titulo: 'Valor Pendente',
      valor: formatMoeda(metricas.valorPendente),
      sub: 'Em NFs aguardando etiqueta',
      cor: '#F59E0B',
      href: '/rupturas',
      tendencia: 'down',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="ai-thinking"><span></span><span></span><span></span></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cardMetricas.map((card) => (
          <Link key={card.titulo} href={card.href}>
            <div className="bg-white rounded-2xl p-5 shadow-card border border-border card-hover relative overflow-hidden">
              <div
                className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-10"
                style={{ backgroundColor: card.cor }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-muted mb-1">{card.titulo}</p>
                  <div className="text-2xl font-bold text-primary">{card.valor}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {card.tendencia === 'up'
                      ? <TrendingUp size={13} className="text-success" />
                      : <TrendingDown size={13} className="text-danger" />
                    }
                    <span className={cn('text-xs font-medium', card.tendencia === 'up' ? 'text-success' : 'text-danger')}>
                      {card.sub}
                    </span>
                  </div>
                </div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: card.cor }}
                >
                  <card.icone size={22} className="text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gráfico de volume semanal */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-primary">Volume da Semana</h3>
              <p className="text-xs text-text-muted mt-0.5">NFs processadas, rupturas e expedidas</p>
            </div>
            <BarChart3 size={20} className="text-text-muted" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DADOS_VOLUME_SEMANA} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(v, name) => [v, name === 'nfs' ? 'Total NFs' : name === 'rupturas' ? 'Rupturas' : 'Expedidas']}
              />
              <Legend
                formatter={v => v === 'nfs' ? 'Total NFs' : v === 'rupturas' ? 'Rupturas' : 'Expedidas'}
              />
              <Bar dataKey="expedidas" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="rupturas" fill="#EF4444" radius={[6, 6, 0, 0]} />
              <Bar dataKey="nfs" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pizza transportadoras */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-primary">Rupturas por Transportadora</h3>
              <p className="text-xs text-text-muted mt-0.5">Mês atual</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={DADOS_RUPTURA_TRANSPORTADORA}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {DADOS_RUPTURA_TRANSPORTADORA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [`${v}%`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {DADOS_RUPTURA_TRANSPORTADORA.map(t => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-text-muted">{t.name}</span>
                </div>
                <span className="font-semibold text-primary">{t.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Rupturas críticas */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-primary">Rupturas Prioritárias</h3>
              <p className="text-xs text-text-muted mt-0.5">Ordenadas por score de urgência (IA)</p>
            </div>
            <Link href="/rupturas" className="text-xs text-accent hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {rupturasTop.map(r => (
              <Link key={r.id} href={`/rupturas/${r.id}`}>
                <div className={cn(
                  'p-3 rounded-xl border hover:shadow-sm transition-all',
                  `urgencia-${r.nivel_urgencia}`,
                  r.nivel_urgencia === 'critico' ? 'bg-red-50/50' :
                  r.nivel_urgencia === 'urgente' ? 'bg-orange-50/50' :
                  r.nivel_urgencia === 'atencao' ? 'bg-yellow-50/50' : 'bg-blue-50/50'
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-primary">NF {r.numero_nf}</span>
                      <span className="text-text-muted text-xs ml-2">· {r.cliente_nome}</span>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', nivelUrgenciaCor(r.nivel_urgencia))}>
                      Score {r.score_urgencia}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={11} /> {r.dias_pendente}d pendente
                    </span>
                    <span className="text-xs text-text-muted">· {r.transportadora}</span>
                  </div>
                </div>
              </Link>
            ))}
            {rupturasTop.length === 0 && (
              <div className="text-center py-8 text-text-muted text-sm">
                ✅ Nenhuma ruptura ativa no momento
              </div>
            )}
          </div>
        </div>

        {/* Briefing IA */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Briefing IA</h3>
                <p className="text-xs text-text-muted">Análise automática da operação</p>
              </div>
            </div>
            <button
              onClick={refreshBriefing}
              disabled={briefingLoading}
              className="flex items-center gap-1.5 text-xs text-accent hover:underline disabled:opacity-50"
            >
              <RefreshCw size={12} className={briefingLoading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>

          {briefingLoading ? (
            <div className="flex flex-col gap-3">
              <div className="ai-thinking mb-2">
                <span></span><span></span><span></span>
              </div>
              <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-4/5" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{briefingTexto}</p>

              {BRIEFINGS_IA[0] && (
                <div className="mt-4 space-y-2">
                  {BRIEFINGS_IA[0].alertas_ia.map((alerta, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="flex-shrink-0">{i === 0 ? '⚠️' : i === 1 ? '📊' : '📋'}</span>
                      <span className="text-text-muted leading-relaxed">{alerta}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Previsão amanhã */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
              <TrendingUp size={12} /> Previsão para Amanhã
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Volume estimado', valor: BRIEFINGS_IA[0].previsao_amanha.volume_estimado },
                { label: 'Rupturas estimadas', valor: BRIEFINGS_IA[0].previsao_amanha.rupturas_estimadas },
              ].map(item => (
                <div key={item.label} className="bg-surface rounded-lg p-2">
                  <div className="text-xs font-semibold text-primary">{item.valor}</div>
                  <div className="text-xs text-text-muted">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SLA histórico */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-primary">SLA Histórico — Tempo Médio de Resolução</h3>
            <p className="text-xs text-text-muted mt-0.5">Dias em aberto até resolução — meta: ≤ 3 dias</p>
          </div>
          <Link href="/relatorios" className="text-xs text-accent hover:underline flex items-center gap-1">
            Relatório completo <ArrowRight size={12} />
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={DADOS_SLA_MENSAL}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[0, 6]} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              formatter={(v) => [`${v} dias`, 'SLA Médio']}
            />
            <Line
              type="monotone"
              dataKey="sla_medio"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            {/* Linha da meta */}
            <Line
              type="monotone"
              dataKey={() => 3}
              stroke="#10B981"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              name="Meta (3 dias)"
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
          <span className="inline-block w-8 border-t-2 border-success border-dashed" /> Meta de 3 dias
          <span className="ml-4 inline-block w-8 border-t-2 border-accent" /> SLA real
        </p>
      </div>
    </div>
  )
}
