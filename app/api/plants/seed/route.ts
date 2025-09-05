import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { PLANTS } from "data/plants"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session as unknown as { user?: { id?: string } })?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    await prisma.$transaction(
      PLANTS.map((p) => {
        const id = `${p.id}-${userId}`
        return prisma.plant.upsert({
          where: { id },
          update: {},
          create: {
            id,
            name: p.name,
            species: p.species ?? null,
            light: p.light ?? null,
            water: p.water ?? null,
            description: p.description ?? null,
            imageUrl: p.imageUrl ?? null,
            lastWateredAt: p.lastWateredAt ? new Date(p.lastWateredAt) : null,
            lastFertilizedAt: p.lastFertilizedAt ? new Date(p.lastFertilizedAt) : null,
            waterIntervalDays: p.waterIntervalDays ?? null,
            fertilizeIntervalDays: p.fertilizeIntervalDays ?? null,
            health: p.health ?? null,
            waterMl: p.waterMl ?? null,
            ownerId: userId,
          },
        })
      })
    )
    // After seeding, adjust some plants to be due today (water/fertilize)
    const ownerId = userId
    const plants = await prisma.plant.findMany({ where: { ownerId }, orderBy: { createdAt: "asc" } })
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const updates: Array<ReturnType<typeof prisma.plant.update>> = []
    let tweaked = 0
    for (const p of plants) {
      if (tweaked >= 6) break
      // Make a subset due today for water or fertilize
      if (p.waterIntervalDays && !p.lastWateredAt) {
        const d = new Date(startOfToday)
        d.setDate(d.getDate() - p.waterIntervalDays)
        updates.push(
          prisma.plant.update({ where: { id: p.id, ownerId }, data: { lastWateredAt: d } })
        )
        tweaked++
        continue
      }
      if (p.fertilizeIntervalDays && !p.lastFertilizedAt) {
        const d = new Date(startOfToday)
        d.setDate(d.getDate() - p.fertilizeIntervalDays)
        updates.push(
          prisma.plant.update({ where: { id: p.id, ownerId }, data: { lastFertilizedAt: d } })
        )
        tweaked++
      }
    }
    if (updates.length) await prisma.$transaction(updates)

    // After seeding and adjustments, generate 30 days of tasks for this user
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 30)
    const ups: Array<ReturnType<typeof prisma.task.upsert>> = []
    for (const p of plants) {
      if (p.waterIntervalDays) {
        let base = p.lastWateredAt ?? p.createdAt
        while (base < end) {
          const due = new Date(base)
          due.setDate(due.getDate() + p.waterIntervalDays)
          if (due > end) break
          if (due >= start) {
            ups.push(
              prisma.task.upsert({
                where: { ownerId_plantId_type_scheduledFor: { ownerId, plantId: p.id, type: "water", scheduledFor: due } },
                update: {},
                create: { ownerId, plantId: p.id, type: "water", scheduledFor: due },
              })
            )
          }
          base = due
        }
      }
      if (p.fertilizeIntervalDays) {
        let base = p.lastFertilizedAt ?? p.createdAt
        while (base < end) {
          const due = new Date(base)
          due.setDate(due.getDate() + p.fertilizeIntervalDays)
          if (due > end) break
          if (due >= start) {
            ups.push(
              prisma.task.upsert({
                where: { ownerId_plantId_type_scheduledFor: { ownerId, plantId: p.id, type: "fertilize", scheduledFor: due } },
                update: {},
                create: { ownerId, plantId: p.id, type: "fertilize", scheduledFor: due },
              })
            )
          }
          base = due
        }
      }
    }
    if (ups.length) await prisma.$transaction(ups)
    return NextResponse.json({ ok: true, tasksGenerated: ups.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Seed failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
