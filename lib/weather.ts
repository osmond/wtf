import { env } from "../env.mjs"

export type WeatherCurrent = {
  tempC: number
  feelsLikeC: number
  humidity: number
  description: string
  icon: string
  dt: string // ISO
}

type CacheEntry = { data: WeatherCurrent; expires: number }
const cache = new Map<string, CacheEntry>()

function key(lat: number, lon: number, unit: "metric" | "imperial") {
  return `${lat.toFixed(3)},${lon.toFixed(3)}:${unit}`
}

export async function getCurrentWeather(
  lat: number,
  lon: number,
  unit: "metric" | "imperial" = (process.env.WEATHER_UNITS as any) || "metric",
  ttlMs = 10 * 60 * 1000
): Promise<WeatherCurrent> {
  const apiKey = (process.env.OPENWEATHER_API_KEY || (env as any).OPENWEATHER_API_KEY) as string | undefined
  if (!apiKey) throw new Error("Missing OPENWEATHER_API_KEY")
  const k = key(lat, lon, unit)
  const now = Date.now()
  const hit = cache.get(k)
  if (hit && hit.expires > now) return hit.data

  const url = new URL("https://api.openweathermap.org/data/2.5/weather")
  url.searchParams.set("lat", String(lat))
  url.searchParams.set("lon", String(lon))
  url.searchParams.set("appid", apiKey)
  url.searchParams.set("units", unit)
  const res = await fetch(url.toString())
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.message || "Weather fetch failed")

  const tempC = unit === "metric" ? Number(json.main.temp) : (Number(json.main.temp) - 32) * (5 / 9)
  const feelsLikeC = unit === "metric" ? Number(json.main.feels_like) : (Number(json.main.feels_like) - 32) * (5 / 9)
  const humidity = Number(json.main.humidity)
  const description = (json.weather?.[0]?.description as string) || ""
  const icon = (json.weather?.[0]?.icon as string) || ""
  const dt = new Date((json.dt as number) * 1000).toISOString()

  const data: WeatherCurrent = { tempC: Math.round(tempC * 10) / 10, feelsLikeC: Math.round(feelsLikeC * 10) / 10, humidity, description, icon, dt }
  cache.set(k, { data, expires: now + ttlMs })
  return data
}

