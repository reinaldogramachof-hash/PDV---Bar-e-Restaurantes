import React, { useState } from 'react'
import { Loader2, ChefHat, Eye, EyeOff } from 'lucide-react'

interface LoginPageProps {
  onSignIn: (email: string, password: string) => Promise<string | null>
}

export function LoginPage({ onSignIn }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)
    const err = await onSignIn(email, password)
    if (err) {
      setError(err === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err)
    }
    // Sempre reseta loading — se o login teve sucesso, AuthGate desmontará este componente;
    // se loadProfile falhar, este componente será reexibido sem o spinner preso.
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--color-app-base)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-panel bg-[var(--color-accent)] flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Gestão Gastro</h1>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">Plataforma de Gestão para Restaurantes</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-panel p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-[var(--color-muted)]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full h-10 px-3 rounded-control bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              autoFocus
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--color-muted)]">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 pr-10 rounded-control bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-control px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-10 px-4 rounded-control bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--color-muted)] mt-6">
          Plena Sistemas · Gestão Gastro
        </p>
      </div>
    </div>
  )
}
