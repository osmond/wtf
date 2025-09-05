import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { AnalyticsClient } from "components/AnalyticsClient"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

type ChartData = {
  lightCounts: Record<string, number>
  waterCounts: Record<string, number>
  recencyBuckets: { label: string; value: number }[]
  nextDays: { labels: string[]; water: number[]; fertilize: number[] }
  overdue: { water: number; fertilize: number }
  freq: { water: { labels: string[]; values: number[] }; fertilize: { labels: string[]; values: number[] } }
  health: Record<string, number>
  careTimeWeeks: { labels: string[]; minutes: number[] }
  completionRate: { labels: string[]; percent: number[] }
  overdueTrend: { labels: string[]; count: number[] }
}

function daysSince(date?: Date | null) {
  if (!date) return Infinity
  const ms = Date.now() - date.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

// Client component can be rendered directly from a server component

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
        </div>
        <p className="text-gray-700 dark:text-gray-200">Please sign in first.</p>
      </main>
    )
  }

  const plants = await prisma.plant.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } })
  const events = await prisma.careEvent.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } })

  const lightCounts: Record<string, number> = { low: 0, medium: 0, bright: 0 }
  const waterCounts: Record<string, number> = { low: 0, medium: 0, high: 0 }
  for (const p of plants) {
    if (p.light) lightCounts[p.light] = (lightCounts[p.light] ?? 0) + 1
    if (p.water) waterCounts[p.water] = (waterCounts[p.water] ?? 0) + 1
  }

  // Recency buckets for last watered
  const recencyCounts = [0, 0, 0, 0, 0, 0] // 0,1-3,4-7,8-14,15-∞, none
  for (const p of plants) {
    const d = daysSince(p.lastWateredAt)
    if (!isFinite(d)) {
      recencyCounts[5] = (recencyCounts[5] ?? 0) + 1
    } else if (d === 0) recencyCounts[0] = (recencyCounts[0] ?? 0) + 1
    else if (d <= 3) recencyCounts[1] = (recencyCounts[1] ?? 0) + 1
    else if (d <= 7) recencyCounts[2] = (recencyCounts[2] ?? 0) + 1
    else if (d <= 14) recencyCounts[3] = (recencyCounts[3] ?? 0) + 1
    else recencyCounts[4] = (recencyCounts[4] ?? 0) + 1
  }
  const recencyBuckets = [
    { label: "Today", value: recencyCounts[0] ?? 0 },
    { label: "1–3d", value: recencyCounts[1] ?? 0 },
    { label: "4–7d", value: recencyCounts[2] ?? 0 },
    { label: "8–14d", value: recencyCounts[3] ?? 0 },
    { label: ">14d", value: recencyCounts[4] ?? 0 },
    { label: "No record", value: recencyCounts[5] ?? 0 },
  ]

  // Next 30 days schedule counts (stacked)
  const labels: string[] = []
  const horizon = 30
  const waterArr = Array(horizon).fill(0)
  const fertArr = Array(horizon).fill(0)
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  for (let i = 0; i < horizon; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  function dueIndex(base: Date | null, interval?: number | null) {
    if (!interval) return null
    const last = base ?? start
    const due = new Date(last)
    due.setDate(due.getDate() + interval)
    const idx = Math.floor((due.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    return idx
  }
  let overdueWater = 0
  let overdueFert = 0
  for (const p of plants) {
    const wi = dueIndex(p.lastWateredAt, p.waterIntervalDays)
    const fi = dueIndex(p.lastFertilizedAt, p.fertilizeIntervalDays)
    if (wi !== null) {
      if (wi < 0) overdueWater++
      else if (wi < horizon) waterArr[wi]++
    }
    if (fi !== null) {
      if (fi < 0) overdueFert++
      else if (fi < horizon) fertArr[fi]++
    }
  }

  const nextDays = { labels, water: waterArr, fertilize: fertArr }
  const overdue = { water: overdueWater, fertilize: overdueFert }

  // Frequency histograms based on schedule intervals (days)
  function bucketize(vals: (number | null | undefined)[]) {
    const popular = [1, 2, 3, 4, 5, 7, 10, 14, 21, 30]
    const counts: Record<string, number> = {}
    for (const p of popular) counts[p] = 0
    for (const v of vals) {
      if (!v || v <= 0) continue
      const key = popular.find((p) => p === v) ?? v
      counts[String(key)] = (counts[String(key)] ?? 0) + 1
    }
    const labels = Object.keys(counts)
    const values = labels.map((k) => counts[k] ?? 0)
    return { labels, values }
  }
  const freq = {
    water: bucketize(plants.map((p) => p.waterIntervalDays ?? null)),
    fertilize: bucketize(plants.map((p) => p.fertilizeIntervalDays ?? null)),
  }

  // Health distribution
  const health: Record<string, number> = { healthy: 0, sick: 0, dormant: 0, dead: 0 }
  for (const p of plants) {
    if (p.health && health[p.health] !== undefined) health[p.health] = (health[p.health] ?? 0) + 1
  }

  // Care time per week (last 12 weeks). Use minutes if provided, otherwise defaults: water 1m, fertilize 2m, other 1m
  const weeks = 12
  const weekLabels: string[] = []
  const weekMinutes = Array(weeks).fill(0)
  const weekStart = new Date(start)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // start of this week (Sunday)
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() - i * 7)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    weekLabels.push(label)
  }
  function weekIndex(d: Date) {
    const diffDays = Math.floor((d.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
    return Math.floor(diffDays / 7)
  }
  for (const e of events) {
    const idx = weekIndex(e.createdAt)
    if (idx < 0 || idx >= weeks) continue
    const defaultMinutes = e.type === "fertilize" ? 2 : e.type === "water" ? 1 : 1
    weekMinutes[idx] += e.minutes ?? defaultMinutes
  }
  const careTimeWeeks = { labels: weekLabels, minutes: weekMinutes }

  // Completion and overdue trends (last 30 days)
  const days = 30
  const complLabels: string[] = []
  const complPercent: number[] = []
  const overdueCounts: number[] = []
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(start)
    dayStart.setDate(start.getDate() - i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayStart.getDate() + 1)
    const label = `${dayStart.getMonth() + 1}/${dayStart.getDate()}`
    complLabels.push(label)
    // tasks are the source of completion metrics
    // Pull tasks for the day
    const dayTasks = await prisma.task.findMany({
      where: { ownerId: userId!, scheduledFor: { gte: dayStart, lt: dayEnd } },
    })
    const scheduledCount = dayTasks.length
    const onTime = dayTasks.filter((t) => t.completedAt && t.completedAt <= dayEnd).length
    const overdueMade = dayTasks.filter((t) => !t.completedAt || t.completedAt > dayEnd).length
    complPercent.push(scheduledCount ? Math.round((onTime / scheduledCount) * 100) : 0)
    overdueCounts.push(overdueMade)
  }
  const completionRate = { labels: complLabels, percent: complPercent }
  const overdueTrend = { labels: complLabels, count: overdueCounts }

  const data: ChartData = { lightCounts, waterCounts, recencyBuckets, nextDays, overdue, freq, health, careTimeWeeks, completionRate, overdueTrend }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
      </div>
      <AnalyticsClient data={data} />
    </main>
  )
}
