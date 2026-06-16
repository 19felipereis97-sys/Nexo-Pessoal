'use server'

import { createClient } from '@/lib/supabase/server'
import type { IntegrationSetting, NotificationSettings, Profile, SecuritySettings, UserSettings } from '@/lib/supabase/types'
import { USER_SETTINGS_DEFAULTS, NOTIFICATION_DEFAULTS, SECURITY_DEFAULTS } from './settings-defaults'

export type { SettingsData } from './settings-defaults'

export async function getSettingsData() {
  const empty = {
    profile: null as Profile | null,
    userSettings: null as UserSettings | null,
    notificationSettings: null as NotificationSettings | null,
    securitySettings: null as SecuritySettings | null,
    integrations: [] as IntegrationSetting[],
    authEmail: null as string | null,
    authCreatedAt: null as string | null,
    error: null as string | null,
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ...empty, error: 'Não autenticado' }

    const [profileRes, settingsRes, notifRes, securityRes, integrationsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('notification_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('security_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('integration_settings').select('*').eq('user_id', user.id).order('provider'),
    ])

    const us = settingsRes.data as UserSettings | null
    const ns = notifRes.data as NotificationSettings | null
    const ss = securityRes.data as SecuritySettings | null

    return {
      profile: profileRes.data as Profile | null,
      userSettings: us ?? ({ ...USER_SETTINGS_DEFAULTS, id: '', user_id: user.id, created_at: '', updated_at: '' } as UserSettings),
      notificationSettings: ns ?? ({ ...NOTIFICATION_DEFAULTS, id: '', user_id: user.id, created_at: '', updated_at: '' } as NotificationSettings),
      securitySettings: ss ?? ({ ...SECURITY_DEFAULTS, id: '', user_id: user.id, created_at: '', updated_at: '' } as SecuritySettings),
      integrations: (integrationsRes.data ?? []) as IntegrationSetting[],
      authEmail: user.email ?? null,
      authCreatedAt: user.created_at ?? null,
      error: null,
    }
  } catch {
    return { ...empty, error: 'Não foi possível carregar as configurações.' }
  }
}
