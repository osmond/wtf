"use client"
import { useEffect, useState, FormEvent } from "react"
import { useRouter } from "next/navigation"

type Room = { id: string; name: string; lat?: number | null; lon?: number | null }

export function RoomsManager() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [lat, setLat] = useState("")
  const [lon, setLon] = useState("")
  const router = useRouter()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/rooms")
      const data = (await res.json().catch(() => [])) as Room[]
      if (!res.ok) throw new Error("Failed to load rooms")
      setRooms(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || "Failed to load rooms")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return
    try {
      const body: any = { name: name.trim() }
      if (lat.trim()) body.lat = Number(lat)
      if (lon.trim()) body.lon = Number(lon)
      const res = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to create room")
      setName("")
      setLat("")
      setLon("")
      await load()
      router.refresh()
    } catch (e: any) {
      setError(e?.message || "Failed to create room")
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Rooms</h3>
      <p className="mb-3 text-xs text-gray-600 dark:text-gray-300">Create named locations with optional coordinates. Plants assigned to a room use its coordinates for local weather.</p>
      {loading ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading...</p>
      ) : rooms.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">No rooms yet.</p>
      ) : (
        <ul className="mb-3 list-disc pl-5 text-sm text-gray-800 dark:text-gray-200">
          {rooms.map((r) => (
            <li key={r.id}>
              <span className="font-medium">{r.name}</span>
              {r.lat != null && r.lon != null ? (
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({r.lat.toFixed(3)}, {r.lon.toFixed(3)})</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onAdd} className="grid gap-2 sm:grid-cols-3">
        <input
          placeholder="Name (e.g. Patio)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
        <input
          placeholder="Lat (optional)"
          inputMode="decimal"
          value={lat}
          onChange={(e) => setLat(e.target.value.replace(/[^0-9+\-.]/g, ""))}
          className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
        <div className="flex gap-2">
          <input
            placeholder="Lon (optional)"
            inputMode="decimal"
            value={lon}
            onChange={(e) => setLon(e.target.value.replace(/[^0-9+\-.]/g, ""))}
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <button type="submit" className="shrink-0 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Add</button>
        </div>
      </form>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

