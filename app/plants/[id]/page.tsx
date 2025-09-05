import { Droplets, Sprout } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import { getServerSession } from "next-auth"
import type { ReactNode } from "react"
import { authOptions } from "auth.config"
import { CareHistoryClient } from "components/CareHistoryClient"
import { FabActions } from "components/FabActions"
import { MoreMenu } from "components/MoreMenu"
import { PlantTimes } from "components/PlantTimes"
import { prisma } from "lib/prisma"
import { computeAdjustedWaterMl, computeRecommendedWaterMl } from "lib/water"
import { getCurrentWeather } from "lib/weather"
import { WeatherWidget } from "components/WeatherWidget"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const session = await getServerSession(authOptions)
  const { id } = await params
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  const plant = userId
    ? await prisma.plant.findFirst({ where: { id, ownerId: userId }, select: { name: true } })
    : null
  return { title: plant?.name ?? "Plant" }
}

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-gray-700 dark:text-gray-200">Please sign in to view this plant.</p>
      </main>
    )
  }
  const { id } = await params
  const plant = await prisma.plant.findFirst({ where: { id, ownerId: userId } })
  const events = await prisma.careEvent.findMany({
    where: { ownerId: userId, plantId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
  })
  if (!plant) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-gray-700 dark:text-gray-200">Plant not found.</p>
      </main>
    )
  }
  // Resolve room details if linked
  let roomName: string | null = plant.room ?? null
  let roomLat: number | null = null
  let roomLon: number | null = null
  if ((plant as any).roomId) {
    const room = await prisma.room.findUnique({ where: { id: (plant as any).roomId as string } })
    if (room) {
      roomName = room.name
      roomLat = room.lat ?? null
      roomLon = room.lon ?? null
    }
  }
  const recommendedWaterMl = computeRecommendedWaterMl(
    plant.potSizeCm ?? null,
    plant.soilType ?? null,
    (plant.humidityPref as "low" | "medium" | "high" | null)
  )

  // Weather via room coordinates if present, else user settings
  let weather: Awaited<ReturnType<typeof getCurrentWeather>> | null = null
  try {
    const settings = await prisma.userSettings.findUnique({ where: { ownerId: userId } })
    if (roomLat != null && roomLon != null) {
      const unit = (settings?.unit === "imperial" ? "imperial" : "metric") as "metric" | "imperial"
      weather = await getCurrentWeather(roomLat, roomLon, unit)
    } else if (settings?.lat != null && settings?.lon != null) {
      const unit = (settings.unit === "imperial" ? "imperial" : "metric") as "metric" | "imperial"
      weather = await getCurrentWeather(settings.lat, settings.lon, unit)
    }
  } catch {}

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {plant.archived ? (
          <div className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
            Archived — this plant is hidden from lists and tasks.
          </div>
        ) : null}
        {plant.imageUrl ? (
          <Image src={plant.imageUrl} alt={plant.name} width={1200} height={600} className="mb-4 w-full rounded object-cover" />
        ) : null}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{plant.name}</h1>
            {plant.species ? (
              <p className="text-gray-600 dark:text-gray-300">{plant.species}</p>
            ) : null}
          </div>
          <MoreMenu analyticsHref="/plants/analytics" />
        </div>

        {/* Hero chips */}
        <div className="mt-3 flex flex-wrap items-center justify-start gap-2 text-sm sm:text-xs">
          {plant.light ? (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">Light: {plant.light}</span>
          ) : null}
          {plant.water ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">Water: {plant.water}</span>
          ) : null}
          {plant.waterIntervalDays ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">Every {plant.waterIntervalDays}d</span>
          ) : null}
          {plant.fertilizeIntervalDays ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">Fert {plant.fertilizeIntervalDays}d</span>
          ) : null}
          {plant.health ? (
            <span className={
              "rounded-full px-2 py-0.5 " +
              (plant.health === "healthy"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                : plant.health === "sick"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                : plant.health === "dormant"
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200"
                : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200")
            }>
              Health: {plant.health}
            </span>
          ) : null}
          {plant.potSizeCm ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">{plant.potSizeCm} cm</span>
          ) : null}
          {plant.soilType ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">{plant.soilType}</span>
          ) : null}
          {plant.room ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">{plant.room}</span>
          ) : null}
        </div>

        {/* Next care tasks */}
        {(() => {
          const now = Date.now()
          const soonThreshold = 1000 * 60 * 60 * 24 * 2
          function fmtNext(d?: Date | null) {
            if (!d) return "—"
            const diff = d.getTime() - now
            if (diff <= 0) return "due now"
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            if (days > 0) return `in ${days}d`
            const hours = Math.floor(diff / (1000 * 60 * 60))
            if (hours > 0) return `in ${hours}h`
            const mins = Math.floor(diff / (1000 * 60))
            if (mins > 0) return `in ${mins}m`
            return "soon"
          }
          const wBase = plant.lastWateredAt ? new Date(plant.lastWateredAt) : new Date(plant.createdAt)
          const fBase = plant.lastFertilizedAt ? new Date(plant.lastFertilizedAt) : new Date(plant.createdAt)
          const wInt = plant.waterIntervalDays as number | undefined
          const fInt = plant.fertilizeIntervalDays as number | undefined
          const wNext = wInt ? new Date(new Date(wBase).setDate(wBase.getDate() + wInt)) : null
          const fNext = fInt ? new Date(new Date(fBase).setDate(fBase.getDate() + fInt)) : null
          const badges: { key: "water" | "fert"; label: string; className: string; icon: ReactNode }[] = []
          if (wNext) {
            const overdue = wNext.getTime() < now
            const dueSoon = !overdue && wNext.getTime() - now <= soonThreshold
            badges.push({
              key: "water",
              label: `Water ${fmtNext(wNext)}`,
              className:
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 " +
                (overdue
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                  : dueSoon
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"),
              icon: <Droplets size={14} />,
            })
          }
          if (fNext) {
            const overdue = fNext.getTime() < now
            const dueSoon = !overdue && fNext.getTime() - now <= soonThreshold
            badges.push({
              key: "fert",
              label: `Fertilize ${fmtNext(fNext)}`,
              className:
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 " +
                (overdue
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                  : dueSoon
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"),
              icon: <Sprout size={14} />,
            })
          }
          return badges.length ? (
            <div className="mt-3 flex flex-wrap items-center justify-start gap-2 text-sm sm:text-xs">
              {badges.map((b) => (
                <span key={b.key} className={b.className}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          ) : null
        })()}

        {plant.description ? (
          <p className="mt-3 text-gray-700 dark:text-gray-200">{plant.description}</p>
        ) : null}

        <PlantTimes
          id={plant.id}
          lastWateredAt={plant.lastWateredAt ? new Date(plant.lastWateredAt).toISOString() : null}
          lastFertilizedAt={plant.lastFertilizedAt ? new Date(plant.lastFertilizedAt).toISOString() : null}
          waterIntervalDays={plant.waterIntervalDays ?? null}
          fertilizeIntervalDays={plant.fertilizeIntervalDays ?? null}
          waterMl={plant.waterMl ?? null}
          recommendedWaterMl={recommendedWaterMl}
          adjustedWaterMl={weather ? computeAdjustedWaterMl(recommendedWaterMl ?? 0, { tempC: weather.tempC, humidity: weather.humidity }, (plant.humidityPref as any) ?? null) : null}
        />

        {/* Care History (collapsible tabs) */}
        {events.length ? (
          <section className="mt-6">
            <details className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Care History</summary>
              <div className="px-4 pb-4">
                <CareHistoryClient
                  events={events.map((e) => ({ id: e.id, type: e.type, createdAt: e.createdAt.toISOString(), waterMl: e.waterMl ?? null, fertilizerType: e.fertilizerType ?? null }))}
                />
              </div>
            </details>
          </section>
        ) : null}

        {/* Care Metrics (collapsible) */}
        <section className="mt-6">
          <details className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Care Metrics</summary>
            <div className="px-4 pb-4">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {plant.potSizeCm ? (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Pot size</dt>
                    <dd className="text-gray-800 dark:text-gray-200">{plant.potSizeCm} cm</dd>
                  </div>
                ) : null}
                {plant.soilType ? (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Soil</dt>
                    <dd className="text-gray-800 dark:text-gray-200">{plant.soilType}</dd>
                  </div>
                ) : null}
                {plant.humidityPref ? (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Humidity</dt>
                    <dd className="text-gray-800 dark:text-gray-200 capitalize">{plant.humidityPref}</dd>
                  </div>
                ) : null}
                {plant.tempMinC != null || plant.tempMaxC != null ? (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Temperature</dt>
                    <dd className="text-gray-800 dark:text-gray-200">
                      {plant.tempMinC != null ? plant.tempMinC : "—"}°C – {plant.tempMaxC != null ? plant.tempMaxC : "—"}°C
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </details>
        </section>

        {/* Environment */}
        {roomName || plant.weatherNotes || weather ? (
          <section className="mt-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Environment</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              {weather ? (
                <WeatherWidget tempC={weather.tempC} feelsLikeC={weather.feelsLikeC} humidity={weather.humidity} description={weather.description} dt={weather.dt} />
              ) : null}
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {roomName ? (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Location</dt>
                    <dd className="text-gray-800 dark:text-gray-200">{roomName}</dd>
                  </div>
                ) : null}
              {plant.weatherNotes ? (
                  <div className="col-span-2">
                    <dt className="text-gray-500 dark:text-gray-400">Weather context</dt>
                    <dd className="text-gray-800 dark:text-gray-200">{plant.weatherNotes}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </section>
        ) : null}
      </article>
      {/* Floating actions */}
      <FabActions id={plant.id} archived={plant.archived ?? false} />
    </main>
  )
}
