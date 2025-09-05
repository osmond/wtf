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
  const updates = plants.map((p) => {
    const url = p.imageUrl ?? ""
    if (!url || /unsplash\.com/i.test(url)) {
      const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(p.id)}/1200/600`
      return prisma.plant.update({ where: { id: p.id, ownerId }, data: { imageUrl } })
    }
    return null
  }).filter((u): u is ReturnType<typeof prisma.plant.update> => u !== null)

  if (updates.length === 0) return NextResponse.json({ ok: true, updated: 0 })
  await prisma.$transaction(updates)
  return NextResponse.json({ ok: true, updated: updates.length })
}
