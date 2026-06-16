'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function ensureProfile(userId: string, email: string, fullName?: string) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (!existing) {
    await supabase.from('profiles').insert({
      id: userId,
      email,
      full_name: fullName ?? email.split('@')[0],
    })
  }
}

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
    'Too many requests': 'Muitas tentativas. Aguarde alguns minutos.',
    'User not found': 'Usuário não encontrado.',
  }
  return map[message] ?? 'Ocorreu um erro ao entrar. Tente novamente.'
}
