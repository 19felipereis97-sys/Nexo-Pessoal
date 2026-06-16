import { LoginForm } from './login-form'

export const metadata = {
  title: 'Entrar – Nexo Pessoal',
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/nexo-lockup.png" alt="Nexo Pessoal" className="h-36 w-36 object-contain" />
        <p className="text-sm text-[#737373]">Entre para acessar seu espaço</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-[#262626] bg-[#111111] p-6 shadow-2xl">
        <LoginForm />
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-[#737373]">
        Sistema de gestão pessoal integrado
      </p>
    </div>
  )
}
