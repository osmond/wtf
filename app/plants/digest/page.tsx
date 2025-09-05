import { Droplets, Sprout } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

type DueEntry = {
  id: string
  name: string
  kind: "water" | "fert"
  due: Date
}

function nextDue(base: Date | null, intervalDays?: number | null): Date | null {
  if (!intervalDays) return null
  const b = base ?? new Date()
  const d = new Date(b)
  d.setDate(d.getDate() + intervalDays)
  return d
}

export default async function DigestPage() {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Weekly Digest</h1>
        </div>
        <p className="text-gray-700 dark:text-gray-200">Please sign in first.</p>
      </main>
    )
  }
  const plants = await prisma.plant.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } })
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const dayMs = 24 * 60 * 60 * 1000

  const buckets: { title: string; entries: DueEntry[] }[] = []

  const overdue: DueEntry[] = []
  const days: { [k: number]: DueEntry[] } = {}

  for (let i = 0; i < 7; i++) days[i] = []

  for (const p of plants) {
    const wDue = nextDue(p.lastWateredAt, p.waterIntervalDays)
    const fDue = nextDue(p.lastFertilizedAt, p.fertilizeIntervalDays)
    const entries: DueEntry[] = []
    if (wDue) entries.push({ id: p.id, name: p.name, kind: "water", due: wDue })
    if (fDue) entries.push({ id: p.id, name: p.name, kind: "fert", due: fDue })

    for (const e of entries) {
      const diff = e.due.getTime() - start.getTime()
      if (diff < 0) {
        overdue.push(e)
      } else {
        const idx = Math.floor(diff / dayMs)
        if (idx >= 0 && idx < 7) (days[idx] ?? (days[idx] = [])).push(e)
      }
    }
  }

  const titles = ["Today", "Tomorrow", "In 2 days", "In 3 days", "In 4 days", "In 5 days", "In 6 days"]

  if (overdue.length) buckets.push({ title: "Overdue", entries: overdue.sort((a, b) => a.due.getTime() - b.due.getTime()) })
  for (let i = 0; i < 7; i++) {
    const list = days[i] ?? []
    const entries = list.sort((a, b) => a.due.getTime() - b.due.getTime())
    buckets.push({ title: titles[i] ?? `Day ${i}`, entries })
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Weekly Digest</h1>
      </div>

      <p className="mb-6 text-gray-600 dark:text-gray-300">What needs attention today and the next 6 days.</p>

      <div className="space-y-8">
        {buckets.map((b) => (
          <section key={b.title}>
            <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">{b.title}</h2>
            {b.entries.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nothing scheduled.</p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {b.entries.map((e) => (
                  <li key={`${e.kind}-${e.id}`} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="text-gray-500 dark:text-gray-300">
                        {e.kind === "water" ? <Droplets size={14} /> : <Sprout size={14} />}
                      </span>
                      <Link href={`/plants/${e.id}`} className="text-blue-600 hover:underline">
                        {e.name}
                      </Link>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{e.due.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}
