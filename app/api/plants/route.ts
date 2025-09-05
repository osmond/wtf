import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "auth.config"
import { PlantCreateSchema, slugify } from "lib/plant-schema"
import { prisma } from "lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) return NextResponse.json([], { status: 200 })
  const plants = await prisma.plant.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" } })
  return NextResponse.json(plants)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const json = await req.json().catch(() => null)
  const parsed = PlantCreateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const input = parsed.data
  const id: string = input.id || slugify(input.name)
  if (!id) return NextResponse.json({ error: "Invalid id generated" }, { status: 400 })
  const data = { ...input, id, ownerId: userId }

  try {
    const created = await prisma.plant.create({ data })
    return NextResponse.json(created, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
