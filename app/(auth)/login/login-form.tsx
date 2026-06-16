'use client'

import { useState } from 'react'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { signIn } from '@/lib/auth/actions'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Informe seu e-mail.'); return }
    if (!password) { setError('Informe sua senha.'); return }

    setLoading(true)
    try {
      const result = await signIn(email.trim(), password)
      if (result?.error) setError(result.error)
    } catch {
      // redirect() lança um erro interno — é o comportamento esperado após login bem-sucedido
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium text-[#a3a3a3]">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          disabled={loading}
          className="h-10 w-full rounded-lg border border-[#262626] bg-[#0a0a0a] px-3 text-sm text-[#f5f5f5] placeholder:text-[#737373] transition-all hover:border-[#333] focus:border-[#c9a227]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a227]/30 disabled:opacity-40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-medium text-[#a3a3a3]">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            className="h-10 w-full rounded-lg border border-[#262626] bg-[#0a0a0a] pl-3 pr-10 text-sm text-[#f5f5f5] placeholder:text-[#737373] transition-all hover:border-[#333] focus:border-[#c9a227]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a227]/30 disabled:opacity-40"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#a3a3a3] transition-colors"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 px-3 py-2.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ef4444]" />
          <p className="text-sm text-[#ef4444]">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#c9a227] text-sm font-semibold text-[#050505] transition-all hover:bg-[#d6b43a] active:bg-[#b8911f] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </button>

      <p className="text-center text-xs text-[#737373]">
        Não tem acesso?{' '}
        <span className="text-[#a3a3a3]">Entre em contato com o administrador.</span>
      </p>
    </form>
  )
}
