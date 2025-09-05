import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { prisma } from "lib/prisma"
import { getCurrentWeather } from "lib/weather"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const latParam = searchParams.get("lat")
    const lonParam = searchParams.get("lon")
    const unit = (searchParams.get("unit") as "metric" | "imperial" | null) || null

    let lat: number | null = latParam ? Number(latParam) : null
    let lon: number | null = lonParam ? Number(lonParam) : null
    let resolvedUnit: "metric" | "imperial" = unit || ((process.env.WEATHER_UNITS as any) || "metric")

    if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
      const session = await getServerSession(authOptions)
      const userId = (session as unknown as { user?: { id?: string } })?.user?.id
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      const settings = await prisma.userSettings.findUnique({ where: { ownerId: userId } })
      if (!settings?.lat || !settings?.lon) {
        return NextResponse.json({ error: "No coordinates configured" }, { status: 400 })
      }
      lat = settings.lat
      lon = settings.lon
      if (settings.unit === "imperial") resolvedUnit = "imperial"
    }

    const wx = await getCurrentWeather(lat!, lon!, resolvedUnit)
    return NextResponse.json({ ok: true, weather: wx })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch weather"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

