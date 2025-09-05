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

export function computeAdjustedWaterMl(
  baseMl: number,
  weather?: { tempC: number; humidity: number } | null,
  humidityPref?: "low" | "medium" | "high" | null
): number {
  if (!weather) return baseMl
  let ml = baseMl
  // Humidity adjustments
  if (weather.humidity <= 25) ml *= 1.2
  else if (weather.humidity <= 35) ml *= 1.1
  else if (weather.humidity >= 70) ml *= 0.9

  // Temperature adjustments
  if (weather.tempC >= 32) ml *= 1.2
  else if (weather.tempC >= 28) ml *= 1.1
  else if (weather.tempC <= 18) ml *= 0.95

  // Preference nudge: plants preferring "high" humidity may need a bit more when ambient is low
  if (humidityPref === "high" && weather.humidity < 40) ml *= 1.05

  // Clamp and round to nearest 5 mL
  ml = Math.max(80, Math.min(ml, 1200))
  return Math.round(ml / 5) * 5
}
