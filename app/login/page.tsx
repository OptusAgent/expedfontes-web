'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Mail, Lock, Eye, EyeOff, AlertCircle, Zap } from 'lucide-react'
import { authStorage, initStorage } from '@/lib/storage'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    initStorage()
    const user = authStorage.getUsuarioLogado()
    if (user) router.replace('/dashboard')
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    await new Promise(r => setTimeout(r, 800)) // simula latência

    const user = authStorage.login(email, senha)
    if (user) {
      router.replace('/dashboard')
    } else {
      setErro('E-mail ou senha incorretos. Tente novamente.')
      setLoading(false)
    }
  }

  function loginRapido(emailDemo: string) {
    setEmail(emailDemo)
    setSenha('123456')
  }

  const demos = [
    { label: 'Admin', email: 'admin@expedfontes.com', cor: 'bg-red-100 text-red-700' },
    { label: 'Gestor', email: 'joao@expedfontes.com', cor: 'bg-purple-100 text-purple-700' },
    { label: 'Operador', email: 'brendo@expedfontes.com', cor: 'bg-blue-100 text-blue-700' },
    { label: 'Atendimento', email: 'tatiane@expedfontes.com', cor: 'bg-green-100 text-green-700' },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <Truck size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold">ExpedFontes</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Gestão Logística<br />
            <span className="text-accent">Inteligente</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            Controle de expedições, rupturas e serviços extras em tempo real.
            Substituindo planilhas por dados e IA.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'NFs/dia processadas', value: '~88' },
              { label: 'Horas economizadas/mês', value: '~90h' },
              { label: 'Clientes atendidos', value: '12' },
              { label: 'Taxa de resolução', value: '94%' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-accent">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-500 text-sm">© 2026 ExpedFontes · Versão 1.0 · Protótipo</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <Truck size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">ExpedFontes</span>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-dropdown">
            <h2 className="text-2xl font-bold text-primary mb-1">Bem-vindo de volta</h2>
            <p className="text-text-muted mb-8">Faça login para acessar o sistema</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">E-mail</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@expedfontes.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                  >
                    {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {erro && (
                <div className="flex items-center gap-2 text-danger text-sm bg-red-50 px-4 py-3 rounded-xl">
                  <AlertCircle size={16} />
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Acessos rápidos para demo */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-warning" />
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Acesso Rápido — Demo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demos.map(d => (
                  <button
                    key={d.email}
                    onClick={() => loginRapido(d.email)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80 ${d.cor}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-light mt-2 text-center">Senha: 123456 para todos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
