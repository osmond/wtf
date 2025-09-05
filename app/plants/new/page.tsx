import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { PlantForm } from "components/PlantForm"
import { prisma } from "lib/prisma"

export const metadata: Metadata = { title: "Add Plant" }

export default async function NewPlantPage() {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add Plant</h1>
        </div>
        <p className="text-gray-700 dark:text-gray-200">Please sign in first.</p>
      </main>
    )
  }
  const rooms = await prisma.room.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } })
  const roomsSimple = rooms.map((r) => ({ id: r.id, name: r.name }))
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add Plant</h1>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <PlantForm mode="create" rooms={roomsSimple} />
      </div>
    </main>
  )
}
