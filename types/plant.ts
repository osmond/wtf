export type Plant = {
  id: string
  name: string
  species?: string
  light?: "low" | "medium" | "bright"
  water?: "low" | "medium" | "high"
  description?: string
  imageUrl?: string
  lastWateredAt?: string
  lastFertilizedAt?: string
  waterIntervalDays?: number
  fertilizeIntervalDays?: number
  waterMl?: number
  health?: "healthy" | "sick" | "dormant" | "dead"
  roomId?: string
}
