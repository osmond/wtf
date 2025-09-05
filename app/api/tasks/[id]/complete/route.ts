import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(_req: Request, { params }: any) {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task || task.ownerId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const now = new Date()
    const updated = await prisma.task.update({ where: { id: task.id }, data: { completedAt: now } })

    // Mirror completion to plant state + care events for primary types
    if (task.type === "water") {
      await prisma.plant.update({ where: { id: task.plantId, ownerId: userId }, data: { lastWateredAt: now } })
      await prisma.careEvent.create({ data: { ownerId: userId, plantId: task.plantId, type: "water" } })
    } else if (task.type === "fertilize") {
      await prisma.plant.update({ where: { id: task.plantId, ownerId: userId }, data: { lastFertilizedAt: now } })
      await prisma.careEvent.create({ data: { ownerId: userId, plantId: task.plantId, type: "fertilize" } })
    }

    return NextResponse.json(updated)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to complete task"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
