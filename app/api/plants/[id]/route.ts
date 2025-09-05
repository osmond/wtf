import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { PlantUpdateSchema } from "lib/plant-schema"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_req: Request, { params }: any) {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const plant = await prisma.plant.findFirst({ where: { id: params.id, ownerId: userId } })
  if (!plant) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(plant)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(req: Request, { params }: any) {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const json = await req.json().catch(() => ({}))
  const parsed = PlantUpdateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const updated = await prisma.plant.update({ where: { id: params.id, ownerId: userId }, data: parsed.data })
    return NextResponse.json(updated)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to update"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(_req: Request, { params }: any) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session as unknown as { user?: { id?: string } })?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    await prisma.plant.delete({ where: { id: params.id, ownerId: userId } })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to delete"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
