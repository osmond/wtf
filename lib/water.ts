export type HumidityPref = "low" | "medium" | "high" | undefined | null

export function computeRecommendedWaterMl(
  potSizeCm?: number | null,
  soilType?: string | null,
  humidityPref?: HumidityPref
): number {
  // Base: ~15 mL per 1 cm pot diameter (simple heuristic)
  const d = typeof potSizeCm === "number" && potSizeCm > 0 ? potSizeCm : 12
  let ml = d * 15

  // Soil adjustments (string match, case-insensitive)
  const s = (soilType || "").toLowerCase()
  if (s.includes("succulent") || s.includes("cactus") || s.includes("gritty")) {
    ml *= 0.6 // drains fast, hold less water
  } else if (s.includes("peat") || s.includes("coco") || s.includes("moist")) {
    ml *= 1.1 // retains moisture, but often thirstier mixes
  }

  // Humidity preference adjustments
  if (humidityPref === "high") ml *= 1.1
  else if (humidityPref === "low") ml *= 0.9

  // Clamp to sensible bounds
  ml = Math.max(80, Math.min(ml, 1000))
  return Math.round(ml)
}

export function mlToOz(ml: number): number {
  return ml / 29.5735
}

