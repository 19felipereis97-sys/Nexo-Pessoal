import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { callGemini } from '@/lib/services/gemini'
import { formatContextForPrompt } from '@/lib/services/ai-context'
import type { Database } from '@/lib/supabase/types'

// Runs daily via Vercel Cron (vercel.json schedule: "0 10 * * *" = 7am BRT)
// Requires SUPABASE_SERVICE_ROLE_KEY and CRON_SECRET in environment variables.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 })
  }

  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } },
  )

  // Fetch users with daily summary enabled
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('user_settings')
    .select('user_id')
    .eq('assistant_daily_summary', true)

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 })
  }

  const users = settings ?? []
  const results: Array<{ userId: string; status: string }> = []

  for (const { user_id } of users) {
    try {
      // Build context for this user by temporarily impersonating them
      const { data: tasksData } = await supabaseAdmin
        .from('tasks')
        .select('title,status,priority,due_date,due_time,completed_at')
        .eq('user_id', user_id)
        .order('due_date', { ascending: true })
        .limit(40)

      const { data: eventsData } = await supabaseAdmin
        .from('calendar_events')
        .select('title,start_at,end_at,type')
        .eq('user_id', user_id)
        .gte('start_at', new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
        .lte('start_at', new Date().toISOString().slice(0, 10) + 'T23:59:59Z')
        .order('start_at')
        .limit(10)

      const { data: projectsData } = await supabaseAdmin
        .from('projects')
        .select('name,status,progress,due_date,updated_at')
        .eq('user_id', user_id)
        .eq('status', 'em-andamento')
        .limit(10)

      const today = new Date().toISOString().slice(0, 10)
      const tasks = tasksData ?? []
      const DONE = ['concluida', 'cancelado', 'concluido', 'arquivado']

      const ctx = {
        today,
        todayTasks: tasks
          .filter((t) => t.due_date === today && !DONE.includes(t.status))
          .slice(0, 10)
          .map((t) => ({ title: t.title, priority: t.priority, due_time: t.due_time, status: t.status })),
        overdueTasks: tasks
          .filter((t) => t.due_date && t.due_date < today && !DONE.includes(t.status))
          .slice(0, 8)
          .map((t) => ({ title: t.title, priority: t.priority, due_date: t.due_date as string })),
        criticalTasks: tasks
          .filter((t) => ['critica', 'urgente'].includes(t.priority) && !DONE.includes(t.status) && t.due_date !== today)
          .slice(0, 5)
          .map((t) => ({ title: t.title, status: t.status, due_date: t.due_date })),
        todayEvents: (eventsData ?? []).map((e) => ({ title: e.title, start_at: e.start_at, end_at: e.end_at, type: e.type })),
        weekEvents: [],
        activeProjects: (projectsData ?? []).map((p) => ({ name: p.name, status: p.status, progress: p.progress, due_date: p.due_date, last_updated: p.updated_at })),
        pendingMeetingsWithoutMinutes: [],
        recentNotes: [],
        completedThisWeek: [],
      }

      const contextStr = formatContextForPrompt(ctx)
      const prompt = `Você é o assistente pessoal do Nexo Pessoal. Gere um resumo executivo do dia em no máximo 200 palavras. Seja direto e prático. Foque em: o que é mais urgente, próximos compromissos e alertas críticos. Responda em português brasileiro.\n\n${contextStr}\n=== SOLICITAÇÃO ===\nResume meu dia de forma executiva e prática.`

      const result = await callGemini(prompt)
      if (result.error || !result.text) {
        results.push({ userId: user_id, status: 'gemini_error' })
        continue
      }

      await supabaseAdmin.from('notifications').insert({
        user_id,
        title: 'Resumo do dia — Nexo IA',
        message: result.text.slice(0, 500),
        type: 'ai_summary',
        severity: 'info',
        entity_type: 'assistant',
        entity_id: 'daily-summary',
      })

      await supabaseAdmin.from('ai_interactions').insert({
        user_id,
        mode: 'resumo-dia',
        question: 'Resumo diário automático',
        answer: result.text,
      })

      results.push({ userId: user_id, status: 'ok' })
    } catch {
      results.push({ userId: user_id, status: 'error' })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
