import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) return NextResponse.json({ overdue: 0, today: 0, open: 0 })

  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const [overdue, today] = await Promise.all([
    prisma.task.count({ where: { ownerId: userId, completedAt: null, scheduledFor: { lt: now }, plant: { archived: false } } }),
    prisma.task.count({ where: { ownerId: userId, completedAt: null, scheduledFor: { gte: start, lt: end }, plant: { archived: false } } }),
  ])

  return NextResponse.json({ overdue, today, open: overdue + today })
}
