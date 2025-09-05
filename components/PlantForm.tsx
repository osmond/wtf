"use client"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useToast } from "components/ToastProvider"
import { PlantCreateSchema, PlantUpdateSchema } from "lib/plant-schema"
import { computeRecommendedWaterMl } from "lib/water"

type PlantInput = {
  id?: string
  name: string
  species?: string
  light?: "low" | "medium" | "bright" | ""
  water?: "low" | "medium" | "high" | ""
  description?: string
  imageUrl?: string
  waterIntervalDays?: number | string | ""
  fertilizeIntervalDays?: number | string | ""
  health?: "healthy" | "sick" | "dormant" | "dead" | ""
  waterMl?: number | string | ""
  potSizeCm?: number | string | ""
  soilType?: string
  humidityPref?: "low" | "medium" | "high" | ""
  tempMinC?: number | string | ""
  tempMaxC?: number | string | ""
  room?: string
  roomId?: string | ""
  weatherNotes?: string
}

type Props = {
  mode: "create" | "edit"
  initial?: PlantInput
  rooms?: { id: string; name: string }[]
}

const LIGHTS = ["", "low", "medium", "bright"] as const
const WATERS = ["", "low", "medium", "high"] as const

export function PlantForm({ mode, initial, rooms }: Props) {
  const router = useRouter()
  const init = initial as Record<string, unknown> | undefined
  const asStr = (v: unknown) => (v == null ? "" : String(v))
  const [form, setForm] = useState<PlantInput>(() => ({
    id: initial?.id,
    name: initial?.name ?? "",
    species: initial?.species ?? "",
    light: (initial?.light) ?? "",
    water: (initial?.water) ?? "",
    description: initial?.description ?? "",
    imageUrl: initial?.imageUrl ?? "",
    waterIntervalDays: initial?.waterIntervalDays != null ? String(initial.waterIntervalDays) : "",
    fertilizeIntervalDays: initial?.fertilizeIntervalDays != null ? String(initial.fertilizeIntervalDays) : "",
    health: initial?.health ?? "",
    waterMl: asStr(init?.["waterMl"]),
    potSizeCm: asStr(init?.["potSizeCm"]),
    soilType: (init?.["soilType"] as string) ?? "",
    humidityPref: (init?.["humidityPref"] as PlantInput["humidityPref"]) ?? "",
    tempMinC: asStr(init?.["tempMinC"]),
    tempMaxC: asStr(init?.["tempMaxC"]),
    room: (init?.["room"] as string) ?? "",
    roomId: (init?.["roomId"] as string) ?? "",
    weatherNotes: (init?.["weatherNotes"] as string) ?? "",
  }))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({})
  const { notify } = useToast()
  const [showAdvanced, setShowAdvanced] = useState(false)
  // Rooms local state for better UX (filter/add inline)
  const [roomsState, setRoomsState] = useState(rooms ?? [])
  const [roomFilter, setRoomFilter] = useState("")
  const filteredRooms = useMemo(
    () => roomsState.filter((r) => r.name.toLowerCase().includes(roomFilter.toLowerCase())),
    [roomsState, roomFilter]
  )
  const [addingRoom, setAddingRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState("")
  const [newRoomLat, setNewRoomLat] = useState("")
  const [newRoomLon, setNewRoomLon] = useState("")
  const [creatingRoom, setCreatingRoom] = useState(false)

  useEffect(() => {
    setRoomsState(rooms ?? [])
  }, [rooms])

  const hasAdvanced = useMemo(
    () =>
      Boolean(
        form.potSizeCm ||
          form.soilType ||
          form.humidityPref ||
          form.tempMinC ||
          form.tempMaxC ||
          form.room ||
          form.roomId ||
          form.weatherNotes ||
          form.health
      ),
    [
      form.potSizeCm,
      form.soilType,
      form.humidityPref,
      form.tempMinC,
      form.tempMaxC,
      form.room,
      form.roomId,
      form.weatherNotes,
      form.health,
    ]
  )

  useEffect(() => {
    // Auto-open advanced if editing with values present
    if (!showAdvanced && hasAdvanced) setShowAdvanced(true)
  }, [hasAdvanced, showAdvanced])

  const canSubmit = useMemo(() => form.name.trim().length > 0, [form.name])

  function recommended() {
    const w = form.water
    const l = form.light
    // Simple heuristics
    const waterDays = w === "low" ? 14 : w === "medium" ? 7 : w === "high" ? 3 : 7
    const fertDays = l === "low" ? 60 : l === "medium" ? 45 : l === "bright" ? 30 : 30
    return { waterDays, fertDays }
  }

  useEffect(() => {
    setError(null)
  }, [form])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      // If a free-text room matches an existing room name, auto-use its id
      const trimmedRoom = (form.room || "").trim()
      let resolvedRoomId = form.roomId || undefined
      let resolvedRoom: string | undefined = trimmedRoom || undefined
      if (!resolvedRoomId && trimmedRoom && Array.isArray(roomsState) && roomsState.length) {
        const match = roomsState.find((r) => r.name.trim().toLowerCase() === trimmedRoom.toLowerCase())
        if (match) {
          resolvedRoomId = match.id
          resolvedRoom = undefined
        }
      }
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        name: form.name.trim(),
        species: form.species?.trim() || undefined,
        light: form.light || undefined,
        water: form.water || undefined,
        description: form.description?.trim() || undefined,
        imageUrl: form.imageUrl?.trim() || undefined,
        waterIntervalDays: form.waterIntervalDays === "" ? undefined : Number(form.waterIntervalDays),
        fertilizeIntervalDays: form.fertilizeIntervalDays === "" ? undefined : Number(form.fertilizeIntervalDays),
        health: form.health || undefined,
        waterMl: form.waterMl === "" ? undefined : Number(form.waterMl),
        potSizeCm: form.potSizeCm === "" ? undefined : Number(form.potSizeCm),
        soilType: form.soilType?.trim() || undefined,
        humidityPref: form.humidityPref || undefined,
        tempMinC: form.tempMinC === "" ? undefined : Number(form.tempMinC),
        tempMaxC: form.tempMaxC === "" ? undefined : Number(form.tempMaxC),
        room: resolvedRoom,
        roomId: resolvedRoomId,
        weatherNotes: form.weatherNotes?.trim() || undefined,
      }
      // Client-side validation mirrors server
      const parsed = (mode === "create" ? PlantCreateSchema : PlantUpdateSchema).safeParse(payload)
      if (!parsed.success) {
        const flat = parsed.error.flatten()
        setFieldErrors(flat.fieldErrors)
        setError("Please fix the highlighted fields")
        setSubmitting(false)
        return
      }

      const res = await fetch(
        mode === "create" ? "/api/plants" : `/api/plants/${form.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      )
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string }
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Request failed")

      const id = data?.id ?? form.id
      notify("success", mode === "create" ? "Plant created" : "Plant updated")
      router.push(id ? `/plants/${id}` : "/plants")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong"
      setError(msg)
      notify("error", msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "edit" ? (
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">ID</label>
          <input
            value={form.id || ""}
            readOnly
            className="w-full rounded border border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Name</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Monstera"
          className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
          style={{ borderColor: fieldErrors.name ? "#ef4444" : undefined }}
        />
        {fieldErrors.name ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
        ) : null}
  </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Water every (days)</label>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.waterIntervalDays || ""}
            onChange={(e) => setForm((f) => ({ ...f, waterIntervalDays: e.target.value.replace(/[^0-9]/g, "") }))}
            placeholder={`e.g. ${recommended().waterDays}`}
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[3, 7, 10, 14].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm((f) => ({ ...f, waterIntervalDays: String(d) }))}
                className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Fertilize every (days)</label>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.fertilizeIntervalDays || ""}
            onChange={(e) => setForm((f) => ({ ...f, fertilizeIntervalDays: e.target.value.replace(/[^0-9]/g, "") }))}
            placeholder={`e.g. ${recommended().fertDays}`}
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[30, 45, 60, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm((f) => ({ ...f, fertilizeIntervalDays: String(d) }))}
                className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Water amount (mL)</label>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.waterMl || ""}
            onChange={(e) => setForm((f) => ({ ...f, waterMl: e.target.value.replace(/[^0-9]/g, "") }))}
            placeholder="e.g. 240"
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[100, 250, 500].map((ml) => (
              <button
                key={ml}
                type="button"
                onClick={() => setForm((f) => ({ ...f, waterMl: String(ml) }))}
                className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {ml} mL
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {form.waterMl && Number(form.waterMl) > 0
              ? `${(Number(form.waterMl) / 29.5735).toFixed(1)} oz`
              : (() => {
                  const suggested = computeRecommendedWaterMl(
                    form.potSizeCm ? Number(form.potSizeCm) : undefined,
                    form.soilType,
                    (form.humidityPref || undefined) as "low" | "medium" | "high" | undefined
                  )
                  return suggested ? `Suggested: ${Math.round((suggested / 29.5735) * 10) / 10} oz (${suggested} mL)` : ""
                })()}
          </p>
          {(!form.waterMl || Number(form.waterMl) <= 0) && (
            (() => {
              const suggested = computeRecommendedWaterMl(
                form.potSizeCm ? Number(form.potSizeCm) : undefined,
                form.soilType,
                (form.humidityPref || undefined) as "low" | "medium" | "high" | undefined
              )
              return suggested ? (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, waterMl: String(suggested) }))}
                  className="rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Use suggestion
                </button>
              ) : null
            })()
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Environment</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Room</label>
            {roomsState && roomsState.length ? (
              <>
                <input
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  placeholder="Filter rooms..."
                  className="mb-2 w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={form.roomId || ""}
                    onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                    className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">(none)</option>
                    {filteredRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, roomId: "" }))}
                    className="whitespace-nowrap rounded border px-2 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingRoom((v) => !v)
                      setNewRoomName("")
                      setNewRoomLat("")
                      setNewRoomLon("")
                    }}
                    className="whitespace-nowrap rounded border px-2 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {addingRoom ? "Cancel" : "Add room"}
                  </button>
                </div>
                {addingRoom ? (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <input
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Room name"
                      className="col-span-3 rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 sm:col-span-1"
                    />
                    <input
                      value={newRoomLat}
                      onChange={(e) => setNewRoomLat(e.target.value.replace(/[^0-9+\-.]/g, ""))}
                      placeholder="Lat (opt)"
                      className="rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                    />
                    <input
                      value={newRoomLon}
                      onChange={(e) => setNewRoomLon(e.target.value.replace(/[^0-9+\-.]/g, ""))}
                      placeholder="Lon (opt)"
                      className="rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                    />
                    <div className="col-span-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!navigator?.geolocation) return
                          navigator.geolocation.getCurrentPosition((pos) => {
                            setNewRoomLat(String(pos.coords.latitude))
                            setNewRoomLon(String(pos.coords.longitude))
                          })
                        }}
                        className="rounded border px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Use my location
                      </button>
                      <button
                        type="button"
                        disabled={creatingRoom || !newRoomName.trim()}
                        onClick={async () => {
                          if (!newRoomName.trim()) return
                          setCreatingRoom(true)
                          try {
                            const body: any = { name: newRoomName.trim() }
                            if (newRoomLat) body.lat = Number(newRoomLat)
                            if (newRoomLon) body.lon = Number(newRoomLon)
                            const res = await fetch("/api/rooms", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(body),
                            })
                            const data = await res.json().catch(() => ({} as any))
                            if (!res.ok) throw new Error(data?.error || "Failed to create room")
                            const created = data as { id: string; name: string; lat?: number | null; lon?: number | null }
                            setRoomsState((prev) => [...prev, created])
                            setForm((f) => ({ ...f, roomId: created.id }))
                            setAddingRoom(false)
                            setRoomFilter("")
                            setNewRoomName("")
                            setNewRoomLat("")
                            setNewRoomLon("")
                            notify("success", "Room created")
                          } catch (e: any) {
                            notify("error", e?.message || "Failed to create room")
                          } finally {
                            setCreatingRoom(false)
                          }
                        }}
                        className="rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {creatingRoom ? "Creating..." : "Create and select"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <input
                  value={form.room || ""}
                  onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                  placeholder="e.g. Living Room"
                  className="mb-2 w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setAddingRoom((v) => !v)}
                  className="rounded border px-2 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {addingRoom ? "Cancel" : "Add room"}
                </button>
                {addingRoom ? (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <input
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Room name"
                      className="col-span-3 rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 sm:col-span-1"
                    />
                    <input
                      value={newRoomLat}
                      onChange={(e) => setNewRoomLat(e.target.value.replace(/[^0-9+\-.]/g, ""))}
                      placeholder="Lat (opt)"
                      className="rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                    />
                    <input
                      value={newRoomLon}
                      onChange={(e) => setNewRoomLon(e.target.value.replace(/[^0-9+\-.]/g, ""))}
                      placeholder="Lon (opt)"
                      className="rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                    />
                    <div className="col-span-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!navigator?.geolocation) return
                          navigator.geolocation.getCurrentPosition((pos) => {
                            setNewRoomLat(String(pos.coords.latitude))
                            setNewRoomLon(String(pos.coords.longitude))
                          })
                        }}
                        className="rounded border px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Use my location
                      </button>
                      <button
                        type="button"
                        disabled={creatingRoom || !newRoomName.trim()}
                        onClick={async () => {
                          if (!newRoomName.trim()) return
                          setCreatingRoom(true)
                          try {
                            const body: any = { name: newRoomName.trim() }
                            if (newRoomLat) body.lat = Number(newRoomLat)
                            if (newRoomLon) body.lon = Number(newRoomLon)
                            const res = await fetch("/api/rooms", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(body),
                            })
                            const data = await res.json().catch(() => ({} as any))
                            if (!res.ok) throw new Error(data?.error || "Failed to create room")
                            const created = data as { id: string; name: string; lat?: number | null; lon?: number | null }
                            setRoomsState((prev) => [...prev, created])
                            setForm((f) => ({ ...f, roomId: created.id }))
                            setAddingRoom(false)
                            setNewRoomName("")
                            setNewRoomLat("")
                            setNewRoomLon("")
                            notify("success", "Room created")
                          } catch (e: any) {
                            notify("error", e?.message || "Failed to create room")
                          } finally {
                            setCreatingRoom(false)
                          }
                        }}
                        className="rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {creatingRoom ? "Creating..." : "Create and select"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Weather context</label>
            <input
              value={form.weatherNotes || ""}
              onChange={(e) => setForm((f) => ({ ...f, weatherNotes: e.target.value }))}
              placeholder="e.g. Low humidity week, increase misting"
              className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs text-blue-600 hover:underline"
        >
          {showAdvanced ? "Hide advanced" : "Show advanced"}
        </button>
      </div>

      {showAdvanced ? (
        <>
          <h3 className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200">Care Metrics</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Pot size (cm)</label>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.potSizeCm || ""}
                onChange={(e) => setForm((f) => ({ ...f, potSizeCm: e.target.value.replace(/[^0-9]/g, "") }))}
                placeholder="e.g. 15"
                className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Soil type</label>
              <input
                value={form.soilType || ""}
                onChange={(e) => setForm((f) => ({ ...f, soilType: e.target.value }))}
                placeholder="e.g. succulent mix"
                className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Humidity preference</label>
              <select
                value={form.humidityPref || ""}
                onChange={(e) => setForm((f) => ({ ...f, humidityPref: e.target.value as PlantInput["humidityPref"] }))}
                className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                {(["", "low", "medium", "high"] as const).map((h) => (
                  <option key={h} value={h}>
                    {h || "(not set)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Temp min (°C)</label>
                <input
                  inputMode="numeric"
                  pattern="[0-9-]*"
                  value={form.tempMinC || ""}
                  onChange={(e) => setForm((f) => ({ ...f, tempMinC: e.target.value.replace(/[^0-9-]/g, "") }))}
                  placeholder="e.g. 10"
                  className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Temp max (°C)</label>
                <input
                  inputMode="numeric"
                  pattern="[0-9-]*"
                  value={form.tempMaxC || ""}
                  onChange={(e) => setForm((f) => ({ ...f, tempMaxC: e.target.value.replace(/[^0-9-]/g, "") }))}
                  placeholder="e.g. 30"
                  className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/** Environment moved to always-visible section above **/}
        </>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Pot size (cm)</label>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.potSizeCm || ""}
            onChange={(e) => setForm((f) => ({ ...f, potSizeCm: e.target.value.replace(/[^0-9]/g, "") }))}
            placeholder="e.g. 15"
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Soil type</label>
          <input
            value={form.soilType || ""}
            onChange={(e) => setForm((f) => ({ ...f, soilType: e.target.value }))}
            placeholder="e.g. succulent mix"
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Humidity preference</label>
          <select
            value={form.humidityPref || ""}
            onChange={(e) => setForm((f) => ({ ...f, humidityPref: e.target.value as PlantInput["humidityPref"] }))}
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {(["", "low", "medium", "high"] as const).map((h) => (
              <option key={h} value={h}>
                {h || "(not set)"}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Temp min (°C)</label>
            <input
              inputMode="numeric"
              pattern="[0-9-]*"
            value={form.tempMinC || ""}
            onChange={(e) => setForm((f) => ({ ...f, tempMinC: e.target.value.replace(/[^0-9-]/g, "") }))}
              placeholder="e.g. 10"
              className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Temp max (°C)</label>
            <input
              inputMode="numeric"
              pattern="[0-9-]*"
            value={form.tempMaxC || ""}
            onChange={(e) => setForm((f) => ({ ...f, tempMaxC: e.target.value.replace(/[^0-9-]/g, "") }))}
              placeholder="e.g. 30"
              className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <h3 className="mt-6 text-sm font-semibold text-gray-800 dark:text-gray-200">Environment</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Room</label>
          {rooms && rooms.length ? (
            <select
              value={form.roomId || ""}
              onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
              className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">(none)</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          ) : (
            <input
              value={form.room || ""}
              onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
              placeholder="e.g. Living Room"
              className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Weather context</label>
          <input
            value={form.weatherNotes || ""}
            onChange={(e) => setForm((f) => ({ ...f, weatherNotes: e.target.value }))}
            placeholder="e.g. Low humidity week, increase misting"
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => {
            const r = recommended()
            setForm((f) => ({
              ...f,
              waterIntervalDays: String(r.waterDays),
              fertilizeIntervalDays: String(r.fertDays),
            }))
          }}
          className="text-xs text-blue-600 hover:underline"
        >
          Set recommended schedule
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Species</label>
        <input
          value={form.species || ""}
          onChange={(e) => setForm((f) => ({ ...f, species: e.target.value }))}
          placeholder="Monstera deliciosa"
          className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Light</label>
          <select
            value={form.light || ""}
            onChange={(e) => setForm((f) => ({ ...f, light: e.target.value as typeof LIGHTS[number] }))}
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {LIGHTS.map((l) => (
              <option key={l} value={l}>
                {l ? l : "(not set)"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Water</label>
          <select
            value={form.water || ""}
            onChange={(e) => setForm((f) => ({ ...f, water: e.target.value as typeof WATERS[number] }))}
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {WATERS.map((w) => (
              <option key={w} value={w}>
                {w ? w : "(not set)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showAdvanced ? (
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Health</label>
          <select
            value={form.health || ""}
            onChange={(e) => setForm((f) => ({ ...f, health: e.target.value as PlantInput["health"] }))}
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {(["", "healthy", "sick", "dormant", "dead"] as const).map((h) => (
              <option key={h} value={h}>
                {h || "(not set)"}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Image URL</label>
        <input
          value={form.imageUrl || ""}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          placeholder="https://..."
          className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
        />
        {fieldErrors.imageUrl ? <p className="mt-1 text-xs text-red-600">{fieldErrors.imageUrl[0]}</p> : null}
        {form.imageUrl?.startsWith("http") ? (
          <div className="mt-2">
            <img src={form.imageUrl} alt="Preview" className="h-32 w-full rounded object-cover" />
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Description</label>
        <textarea
          value={form.description || ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? (mode === "create" ? "Creating..." : "Saving...") : mode === "create" ? "Create" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
