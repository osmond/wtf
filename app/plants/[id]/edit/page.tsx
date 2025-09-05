import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { PlantForm } from "components/PlantForm"
import { RoomsManager } from "components/RoomsManager"
import { prisma } from "lib/prisma"

export const metadata: Metadata = { title: "Edit Plant" }

export const dynamic = "force-dynamic"

export default async function EditPlantPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) return notFound()
  const { id } = await params
  const p = await prisma.plant.findFirst({ where: { id, ownerId: userId } })
  if (!p) return notFound()
  const rooms = await prisma.room.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } })

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Plant</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <PlantForm
            mode="edit"
            initial={{
              id: p.id,
            name: p.name,
            species: p.species ?? undefined,
            light: (p.light as "low" | "medium" | "bright" | undefined) ?? undefined,
            water: (p.water as "low" | "medium" | "high" | undefined) ?? undefined,
            description: p.description ?? undefined,
            imageUrl: p.imageUrl ?? undefined,
            waterIntervalDays: p.waterIntervalDays ?? undefined,
            fertilizeIntervalDays: p.fertilizeIntervalDays ?? undefined,
            waterMl: p.waterMl ?? undefined,
            potSizeCm: p.potSizeCm ?? undefined,
            soilType: p.soilType ?? undefined,
            humidityPref: (p.humidityPref as "low" | "medium" | "high" | undefined) ?? undefined,
            tempMinC: p.tempMinC ?? undefined,
            tempMaxC: p.tempMaxC ?? undefined,
            room: p.room ?? undefined,
            // @ts-expect-error widen
            roomId: p.roomId ?? undefined,
            weatherNotes: p.weatherNotes ?? undefined,
          }}
            // @ts-expect-error pass rooms list
            rooms={rooms}
          />
        </div>
        <RoomsManager />
      </div>
    </main>
  )
}
