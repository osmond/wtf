"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState, FormEvent } from "react"

type Settings = { lat?: number | null; lon?: number | null; unit?: "metric" | "imperial" | null }

export function UserSettingsCard() {
  const [settings, setSettings] = useState<Settings>({})
  const [lat, setLat] = useState("")
  const [lon, setLon] = useState("")
  const [unit, setUnit] = useState<"metric" | "imperial">("metric")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/user-settings")
        const data = (await res.json().catch(() => ({}))) as { settings?: Settings; error?: string }
        if (!res.ok) throw new Error(data.error || "Failed to load settings")
        const s = data.settings || {}
        if (!active) return
        setSettings(s)
        setLat(s.lat != null ? String(s.lat) : "")
        setLon(s.lon != null ? String(s.lon) : "")
        setUnit((s.unit as any) === "imperial" ? "imperial" : "metric")
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load settings")
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body: any = { lat: Number(lat), lon: Number(lon), unit }
      const res = await fetch("/api/user-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || "Failed to save settings")
      router.refresh()
    } catch (e: any) {
      setError(e?.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  function useGeolocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(String(pos.coords.latitude))
      setLon(String(pos.coords.longitude))
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Location & Units</h3>
      {loading ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading...</p>
      ) : (
        <form onSubmit={onSave} className="grid gap-3 sm:grid-cols-5">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">Latitude</label>
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value.replace(/[^0-9+\-.]/g, ""))}
              className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              placeholder="e.g. 37.7749"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">Longitude</label>
            <input
              value={lon}
              onChange={(e) => setLon(e.target.value.replace(/[^0-9+\-.]/g, ""))}
              className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              placeholder="e.g. -122.4194"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-300">Units</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value as any)} className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
              <option value="metric">Metric (°C)</option>
              <option value="imperial">Imperial (°F)</option>
            </select>
          </div>
          <div className="sm:col-span-5 flex items-center gap-2">
            <button type="button" onClick={useGeolocation} className="rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Use my location</button>
            <button disabled={saving} type="submit" className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          </div>
          {error ? <p className="sm:col-span-5 text-xs text-red-600">{error}</p> : null}
        </form>
      )}
    </div>
  )
}

