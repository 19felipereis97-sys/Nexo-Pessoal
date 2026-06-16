'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function revalidate() {
  revalidatePath('/dashboard')
  revalidatePath('/today')
  revalidatePath('/tasks')
  revalidatePath('/projects')
  revalidatePath('/meetings')
  revalidatePath('/calendar')
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null)
  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}

export async function deleteNotification(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidate()
  return { error: null }
}
