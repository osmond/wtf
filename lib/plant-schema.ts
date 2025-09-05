import { z } from "zod"

export const lightEnum = z.enum(["low", "medium", "bright"]) // UI choices
export const waterEnum = z.enum(["low", "medium", "high"]) // UI choices

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const PlantCreateSchema = z.object({
  id: z.string().regex(slugRegex).optional(),
  name: z.string().min(1, "Name is required").max(200),
  species: z.string().max(200).optional(),
  light: lightEnum.optional(),
  water: waterEnum.optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  waterIntervalDays: z.coerce.number().int().min(1).max(365).optional(),
  fertilizeIntervalDays: z.coerce.number().int().min(1).max(365).optional(),
  health: z.enum(["healthy", "sick", "dormant", "dead"]).optional(),
  waterMl: z.coerce.number().int().min(1).max(5000).optional(),
  potSizeCm: z.coerce.number().int().min(1).max(200).optional(),
  soilType: z.string().max(200).optional(),
  humidityPref: z.enum(["low", "medium", "high"]).optional(),
  tempMinC: z.coerce.number().int().min(-50).max(80).optional(),
  tempMaxC: z.coerce.number().int().min(-50).max(80).optional(),
  room: z.string().max(100).optional(),
  weatherNotes: z.string().max(500).optional(),
  archived: z.boolean().optional(),
})

export const PlantUpdateSchema = PlantCreateSchema.partial().strict()

export type PlantCreateInput = z.infer<typeof PlantCreateSchema>
export type PlantUpdateInput = z.infer<typeof PlantUpdateSchema>

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}
