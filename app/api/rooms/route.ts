import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) return NextResponse.json([], { status: 200 })
  const rooms = await prisma.room.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } })
  return NextResponse.json(rooms)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const json = await req.json().catch(() => ({})) as { name?: string; lat?: number; lon?: number }
  if (!json.name || typeof json.name !== "string") return NextResponse.json({ error: "name is required" }, { status: 400 })
  const lat = typeof json.lat === "number" ? json.lat : null
  const lon = typeof json.lon === "number" ? json.lon : null
  const room = await prisma.room.create({ data: { ownerId: userId, name: json.name, lat, lon } })
  return NextResponse.json(room, { status: 201 })
}

