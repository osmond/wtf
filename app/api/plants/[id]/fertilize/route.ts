import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session as unknown as { user?: { id?: string } })?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const updated = await prisma.plant.update({
      where: { id: params.id, ownerId: userId },
      data: { lastFertilizedAt: new Date() },
    })
    await prisma.careEvent.create({
      data: { ownerId: userId, plantId: updated.id, type: "fertilize" },
    })
    // Auto-complete the nearest uncompleted fertilize task scheduled up to end of today
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)
    const task = await prisma.task.findFirst({
      where: {
        ownerId: userId,
        plantId: updated.id,
        type: "fertilize",
        completedAt: null,
        scheduledFor: { lte: endOfDay },
      },
      orderBy: { scheduledFor: "asc" },
      select: { id: true },
    })
    if (task) {
      await prisma.task.update({ where: { id: task.id }, data: { completedAt: now } })
    }
    return NextResponse.json(updated)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fertilize"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
