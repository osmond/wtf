import type { Plant as DbPlant, Prisma } from "@prisma/client"
import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { AuthButtons } from "components/AuthButtons"
import { FiltersBarClient } from "components/FiltersBarClient"
import { PlantCard } from "components/PlantCard/PlantCard"
import { SeedButton } from "components/SeedButton"
import { prisma } from "lib/prisma"
// Removed maintenance buttons from header; seeding handles images and tasks now

export const metadata: Metadata = {
  title: "Plants",
}

export const dynamic = "force-dynamic"

function nextDueWater(p: DbPlant): Date | null {
  if (!p.waterIntervalDays) return null
  const base = p.lastWateredAt ? new Date(p.lastWateredAt) : new Date(p.createdAt)
  const due = new Date(base)
  due.setDate(due.getDate() + p.waterIntervalDays)
  return due
}

function nextDueFert(p: DbPlant): Date | null {
  if (!p.fertilizeIntervalDays) return null
  const base = p.lastFertilizedAt ? new Date(p.lastFertilizedAt) : new Date(p.createdAt)
  const due = new Date(base)
  due.setDate(due.getDate() + p.fertilizeIntervalDays)
  return due
}

function earliestDue(p: DbPlant): Date | null {
  const w = nextDueWater(p)
  const f = nextDueFert(p)
  if (w && f) return w < f ? w : f
  return w ?? f
}

function isOverdue(p: DbPlant, now: Date) {
  const due = earliestDue(p)
  return !!(due && due < now)
}

function dueSoonScore(p: DbPlant, now: Date) {
  const due = earliestDue(p)
  if (!due) return Number.POSITIVE_INFINITY
  return due.getTime() - now.getTime()
}

export default async function PlantsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await getServerSession(authOptions)
  const sp = await searchParams
  const q = sp?.q?.trim() ?? ""
  const light = sp?.light ?? ""
  const water = sp?.water ?? ""
  const overdue = sp?.overdue === "1"
  const sort = sp?.sort ?? ""
  const showArchived = sp?.archived === "1"

  const whereBase: Prisma.PlantWhereInput = {}
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8 flex items-center justify-end">
          <AuthButtons />
        </header>
      </main>
    )
  }
  whereBase.ownerId = userId
  if (!showArchived) whereBase.archived = false
  const ownedPlantsAll = await prisma.plant.findMany({ where: whereBase, orderBy: { createdAt: "desc" } })

  // Apply filters for visible list
  const whereFiltered: Prisma.PlantWhereInput = { ...whereBase }
  if (light) whereFiltered.light = light
  if (water) whereFiltered.water = water
  const plantsRaw = await prisma.plant.findMany({ where: whereFiltered, orderBy: { createdAt: "desc" } })
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  // Use tasks for badges so they reflect actual schedule (omitted here)
  const plants = plantsRaw.filter((p) => {
    if (q) {
      const hay = `${p.name} ${p.species ?? ""}`.toLowerCase()
      if (!hay.includes(q.toLowerCase())) return false
    }
    if (overdue && !isOverdue(p, now)) return false
    return true
  })

  if (sort === "dueSoon") {
    plants.sort((a, b) => dueSoonScore(a, now) - dueSoonScore(b, now))
  }
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">

      {ownedPlantsAll.length === 0 ? (
        <div className="rounded border border-dashed p-6 text-gray-600 dark:text-gray-300">
          <p className="mb-3">No plants yet.</p>
          <SeedButton />
        </div>
      ) : (
        <>
          <FiltersBarClient />
          <section className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant as unknown as import("types/plant").Plant} />
            ))}
          </section>
        </>
      )}
    </main>
  )
}
