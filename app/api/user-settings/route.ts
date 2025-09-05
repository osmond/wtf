import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const settings = await prisma.userSettings.findUnique({ where: { ownerId: userId } })
  return NextResponse.json({ settings })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => ({})) as { lat?: number; lon?: number; unit?: "metric" | "imperial" }
  if (typeof body.lat !== "number" || typeof body.lon !== "number") {
    return NextResponse.json({ error: "lat and lon (numbers) are required" }, { status: 400 })
  }
  const unit = body.unit === "imperial" ? "imperial" : "metric"
  const up = await prisma.userSettings.upsert({
    where: { ownerId: userId },
    update: { lat: body.lat, lon: body.lon, unit },
    create: { ownerId: userId, lat: body.lat, lon: body.lon, unit },
  })
  return NextResponse.json({ ok: true, settings: up })
}
