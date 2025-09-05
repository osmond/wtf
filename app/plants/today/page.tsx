import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { GenerateTasksButton } from "components/GenerateTasksButton"
import { TodayTasksClient } from "components/TodayTasksClient"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

// Types omitted to reduce lint noise

// helpers removed to reduce lint noise

export default async function TodayPage() {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Today Focus</h1>
          <Link href="/plants" className="text-sm text-blue-600 hover:underline">Back to plants</Link>
        </div>
        <p className="text-gray-700 dark:text-gray-200">Please sign in first.</p>
      </main>
    )
  }
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const overdueTasks = await prisma.task.findMany({
    where: { ownerId: userId, scheduledFor: { lt: now }, completedAt: null, plant: { archived: false } },
    include: { plant: { select: { name: true } } },
    orderBy: { scheduledFor: "asc" },
  })
  const todayTasks = await prisma.task.findMany({
    where: { ownerId: userId, scheduledFor: { gte: start, lt: end }, completedAt: null, plant: { archived: false } },
    include: { plant: { select: { name: true } } },
    orderBy: { scheduledFor: "asc" },
  })
  const completedTodayTasks = await prisma.task.findMany({
    where: { ownerId: userId, completedAt: { gte: start, lt: end }, plant: { archived: false } },
    include: { plant: { select: { name: true } } },
    orderBy: { completedAt: "desc" },
  })

  const overdue = overdueTasks.map((t) => ({ id: t.id, plantId: t.plantId, name: t.plant.name, kind: (t.type === "fertilize" ? "fert" : "water") as "water" | "fert", due: t.scheduledFor.toISOString() }))
  const today = todayTasks.map((t) => ({ id: t.id, plantId: t.plantId, name: t.plant.name, kind: (t.type === "fertilize" ? "fert" : "water") as "water" | "fert", due: t.scheduledFor.toISOString() }))
  const completed = completedTodayTasks.map((t) => ({ id: t.id, plantId: t.plantId, name: t.plant.name, kind: (t.type === "fertilize" ? "fert" : "water") as "water" | "fert", due: t.scheduledFor.toISOString() }))

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Today Focus</h1>
      </div>
      <p className="mb-6 text-gray-600 dark:text-gray-300">Overdue and due today tasks with one-click actions.</p>

      {overdue.length + today.length === 0 ? (
        <div className="rounded border border-dashed p-6 text-gray-600 dark:text-gray-300">
          <p className="mb-3">No open tasks found for today.</p>
          <GenerateTasksButton />
        </div>
      ) : (
        <TodayTasksClient overdue={overdue} today={today} completed={completed} />
      )}
    </main>
  )
}

// Client component imported directly
