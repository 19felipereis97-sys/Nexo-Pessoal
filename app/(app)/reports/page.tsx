import { getReportData, type PeriodType } from '@/lib/data/reports'
import { addDaysISO, monthBoundsSP, monthEndISO, todayISO, weekBoundsSP } from '@/lib/utils/date'
import { ReportsClient } from '@/components/reports/reports-client'

export const dynamic = 'force-dynamic'

interface ReportsPageProps {
  searchParams: Promise<{
    period?: string
    periodStart?: string
    periodEnd?: string
    projectId?: string
  }>
}

function resolvePeriod(
  rawType: string | undefined,
  rawStart: string | undefined,
  rawEnd: string | undefined,
): { periodType: PeriodType; periodStart: string; periodEnd: string } {
  const periodType = (['daily', 'weekly', 'monthly', 'custom'].includes(rawType ?? '')
    ? (rawType as PeriodType)
    : 'weekly')

  if (periodType === 'daily') {
    const day = rawStart ?? todayISO()
    return { periodType, periodStart: day, periodEnd: day }
  }

  if (periodType === 'monthly') {
    const monthStart = rawStart ?? monthBoundsSP().monthStart
    const monthEnd = rawEnd ?? monthEndISO(monthStart)
    return { periodType, periodStart: monthStart, periodEnd: monthEnd }
  }

  if (periodType === 'custom') {
    const today = todayISO()
    const start = rawStart ?? addDaysISO(today, -6)
    const end = rawEnd ?? today
    return { periodType, periodStart: start, periodEnd: end }
  }

  // weekly (default)
  const defaults = weekBoundsSP()
  return {
    periodType: 'weekly',
    periodStart: rawStart ?? defaults.weekStart,
    periodEnd: rawEnd ?? defaults.weekEnd,
  }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams
  const { periodType, periodStart, periodEnd } = resolvePeriod(params.period, params.periodStart, params.periodEnd)
  const projectId = params.projectId ?? null

  const data = await getReportData(periodStart, periodEnd, periodType, projectId)

  return (
    <ReportsClient
      data={data}
      periodStart={periodStart}
      periodEnd={periodEnd}
      periodType={periodType}
      projectId={projectId}
    />
  )
}
