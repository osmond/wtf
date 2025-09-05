import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await getServerSession(authOptions)
  const ownerId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const plants = await prisma.plant.findMany({ where: { ownerId } })
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
  return NextResponse.json({ ok: true, generated: ups.length })
}
