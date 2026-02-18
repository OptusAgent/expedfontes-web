'use client'

import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'
import { Download, BarChart3, TrendingUp } from 'lucide-react'
import {
  DADOS_VOLUME_SEMANA, DADOS_RUPTURA_TRANSPORTADORA,
  DADOS_RUPTURA_CLIENTE, DADOS_SLA_MENSAL, BRIEFINGS_IA
} from '@/lib/data/mockData'
import { formatMoeda } from '@/lib/utils'

const TABS = ['Visão Geral', 'Por Cliente', 'Por Transportadora', 'SLA', 'Previsão IA']

export default function RelatoriosPage() {
  const [tab, setTab] = useState(0)

  const CORES_CLIENTES = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-card border border-border p-1 flex gap-1 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              tab === i ? 'bg-accent text-white' : 'text-text-muted hover:text-primary'
            }`}
          >
            {t}
          </button>
        ))}
        <button className="ml-auto flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm text-text-muted hover:text-primary hover:bg-surface transition-all whitespace-nowrap">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* Visão Geral */}
      {tab === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total NFs Set/25', valor: '1.860', sub: '21 dias úteis', cor: 'bg-blue-50 text-blue-700' },
              { label: 'Pico único dia', valor: '611', sub: '04/09/2025', cor: 'bg-red-50 text-red-700' },
              { label: 'Média diária', valor: '88,5', sub: 'NFs problemáticas', cor: 'bg-yellow-50 text-yellow-700' },
              { label: 'Taxa resolução', valor: '94%', sub: 'Média Set-Fev', cor: 'bg-green-50 text-green-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-4 border border-transparent ${s.cor}`}>
                <div className="text-2xl font-bold">{s.valor}</div>
                <div className="text-sm font-medium mt-0.5">{s.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-primary mb-4">Volume Semanal — NFs processadas</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={DADOS_VOLUME_SEMANA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="nfs" name="Total NFs" fill="#3B82F6" radius={[6,6,0,0]} />
                <Bar dataKey="rupturas" name="Rupturas" fill="#EF4444" radius={[6,6,0,0]} />
                <Bar dataKey="expedidas" name="Expedidas" fill="#10B981" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-primary mb-1">SLA Médio de Resolução por Mês</h3>
            <p className="text-xs text-text-muted mb-4">Meta: ≤ 3 dias (linha verde pontilhada)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={DADOS_SLA_MENSAL}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 6]} />
                <Tooltip formatter={v => [`${v} dias`]} />
                <Line type="monotone" dataKey="sla_medio" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 4 }} name="SLA Médio" />
                <Line type="monotone" dataKey={() => 3} stroke="#10B981" strokeWidth={1.5} strokeDasharray="6 4" dot={false} name="Meta" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Por Cliente */}
      {tab === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-primary mb-4">Rupturas por Cliente — Histórico Mensal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={DADOS_RUPTURA_CLIENTE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="cliente" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="setembro" name="Set/25" fill="#3B82F6" radius={[3,3,0,0]} />
                <Bar dataKey="outubro" name="Out/25" fill="#8B5CF6" radius={[3,3,0,0]} />
                <Bar dataKey="novembro" name="Nov/25" fill="#10B981" radius={[3,3,0,0]} />
                <Bar dataKey="fevereiro" name="Fev/26" fill="#F59E0B" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-primary mb-4">Ranking de Clientes — Setembro 2025</h3>
            <div className="space-y-3">
              {DADOS_RUPTURA_CLIENTE.sort((a, b) => b.setembro - a.setembro).map((c, i) => (
                <div key={c.cliente} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-text-muted w-5">{i + 1}º</span>
                  <span className="text-sm text-primary w-32">{c.cliente}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.setembro / 420) * 100}%`, backgroundColor: CORES_CLIENTES[i] }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-primary w-12 text-right">{c.setembro}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Por Transportadora */}
      {tab === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
              <h3 className="font-semibold text-primary mb-4">Distribuição de Rupturas por Transportadora</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={DADOS_RUPTURA_TRANSPORTADORA}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    paddingAngle={3} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {DADOS_RUPTURA_TRANSPORTADORA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
              <h3 className="font-semibold text-primary mb-4">Performance das Transportadoras</h3>
              <div className="space-y-4">
                {[
                  { nome: 'Correios', rupturas: '45%', sla: '4.8 dias', risco: 'Alto' },
                  { nome: 'Jadlog', rupturas: '22%', sla: '3.2 dias', risco: 'Médio' },
                  { nome: 'Total Express', rupturas: '18%', sla: '2.8 dias', risco: 'Médio' },
                  { nome: 'Mercado Envios', rupturas: '10%', sla: '2.1 dias', risco: 'Baixo' },
                  { nome: 'Loggi', rupturas: '5%', sla: '1.9 dias', risco: 'Baixo' },
                ].map((t, i) => (
                  <div key={t.nome} className="flex items-center justify-between p-3 bg-surface rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DADOS_RUPTURA_TRANSPORTADORA[i]?.color }} />
                      <span className="font-medium text-primary text-sm">{t.nome}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span>{t.rupturas} rupturas</span>
                      <span>SLA: {t.sla}</span>
                      <span className={`font-semibold ${t.risco === 'Alto' ? 'text-danger' : t.risco === 'Médio' ? 'text-warning' : 'text-success'}`}>
                        {t.risco}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLA */}
      {tab === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {DADOS_SLA_MENSAL.slice(-3).map(m => (
              <div key={m.mes} className="bg-white rounded-2xl p-5 shadow-card border border-border">
                <div className="text-2xl font-bold text-primary">{m.sla_medio}d</div>
                <div className="text-sm text-text-muted mt-1">SLA médio — {m.mes}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-danger">{m.criticos} críticos</span>
                  <span className="text-xs text-success">{m.resolvidos} resolvidos</span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.sla_medio <= 3 ? 'bg-success' : m.sla_medio <= 4.5 ? 'bg-warning' : 'bg-danger'}`}
                    style={{ width: `${Math.min((m.sla_medio / 6) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-primary mb-4">Evolução do SLA — Meta 3 dias</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={DADOS_SLA_MENSAL}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 6]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sla_medio" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 5 }} name="SLA Médio (dias)" />
                <Line type="monotone" dataKey={() => 3} stroke="#10B981" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Meta (3 dias)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Previsão IA */}
      {tab === 4 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Previsão Operacional — IA</h3>
                <p className="text-slate-400 text-sm">Baseada em dados históricos de 6 meses</p>
              </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: 'Volume Amanhã', valor: BRIEFINGS_IA[0].previsao_amanha.volume_estimado },
                { label: 'Rupturas Previstas', valor: BRIEFINGS_IA[0].previsao_amanha.rupturas_estimadas },
                { label: 'Prob. Pico', valor: BRIEFINGS_IA[0].previsao_amanha.probabilidade_pico },
                { label: 'Recomendação', valor: 'Sexta alta' },
              ].map(item => (
                <div key={item.label} className="bg-white/10 rounded-xl p-3">
                  <div className="text-sm font-bold text-white">{item.valor}</div>
                  <div className="text-xs text-slate-400 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-primary mb-3">Briefing Completo da IA</h3>
            <div className="space-y-4">
              <div className="bg-surface rounded-xl p-4">
                <p className="text-xs font-semibold text-accent mb-2">📊 SITUAÇÃO ATUAL</p>
                <p className="text-sm text-text-primary leading-relaxed">{BRIEFINGS_IA[0].resumo_operacao}</p>
              </div>

              {BRIEFINGS_IA[0].alertas_ia.map((alerta, i) => (
                <div key={i} className={`rounded-xl p-4 ${i === 0 ? 'bg-red-50 border border-red-100' : 'bg-yellow-50 border border-yellow-100'}`}>
                  <p className="text-xs font-semibold mb-1 text-primary">
                    {i === 0 ? '⚠️ ALERTA CRÍTICO' : i === 1 ? '📊 PADRÃO DETECTADO' : '📋 ATENÇÃO'}
                  </p>
                  <p className="text-sm text-text-primary leading-relaxed">{alerta}</p>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-1">📈 TENDÊNCIA</p>
                <p className="text-sm text-text-primary leading-relaxed">{BRIEFINGS_IA[0].tendencia}</p>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-700 mb-1">🎯 AÇÃO SUGERIDA</p>
                <p className="text-sm text-text-primary leading-relaxed">{BRIEFINGS_IA[0].acao_sugerida}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
