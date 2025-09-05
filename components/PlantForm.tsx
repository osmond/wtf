"use client"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { useToast } from "components/ToastProvider"
import { PlantCreateSchema, PlantUpdateSchema } from "lib/plant-schema"
import { PLANTS } from "data/plants"
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
const FORM_STEPS = ["basics", "care", "environment", "advanced"] as const
type Step = (typeof FORM_STEPS)[number]

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
  const [step, setStep] = useState<Step>("basics")
  const [careProfile, setCareProfile] = useState<"custom" | "easy" | "succulent" | "tropical" | "fern" | "herb">("custom")
  const [overrideWater, setOverrideWater] = useState(() => {
    const n = Number(form.waterMl)
    return !Number.isNaN(n) && n > 0
  })
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
  const [showEnvironment, setShowEnvironment] = useState(() => Boolean((initial?.roomId || initial?.room || initial?.weatherNotes)))

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

  useEffect(() => {
    // If editing and data is rich, start user on the most relevant step
    if (mode === "edit") {
      if (form.roomId || form.room) setStep("environment")
      else if (hasAdvanced) setStep("advanced")
      else setStep("basics")
    }
  }, [mode, hasAdvanced, form.roomId, form.room])

  const PRESETS = [
    {
      key: "easy",
      label: "Easy Care",
      apply: () =>
        setForm((f) => ({
          ...f,
          light: "medium",
          water: "medium",
          humidityPref: "medium",
          soilType: f.soilType || "",
          waterIntervalDays: "7",
          fertilizeIntervalDays: "45",
        })),
    },
    {
      key: "succulent",
      label: "Succulent",
      apply: () =>
        setForm((f) => ({
          ...f,
          light: "bright",
          water: "low",
          humidityPref: "low",
          soilType: f.soilType || "cactus mix",
          waterIntervalDays: "14",
          fertilizeIntervalDays: "60",
        })),
    },
    {
      key: "tropical",
      label: "Tropical",
      apply: () =>
        setForm((f) => ({
          ...f,
          light: "medium",
          water: "medium",
          humidityPref: "high",
          soilType: f.soilType || "rich well-draining",
          waterIntervalDays: "7",
          fertilizeIntervalDays: "30",
        })),
    },
    {
      key: "fern",
      label: "Fern",
      apply: () =>
        setForm((f) => ({
          ...f,
          light: "low",
          water: "high",
          humidityPref: "high",
          soilType: f.soilType || "peaty mix",
          waterIntervalDays: "3",
          fertilizeIntervalDays: "45",
        })),
    },
    {
      key: "herb",
      label: "Herb",
      apply: () =>
        setForm((f) => ({
          ...f,
          light: "bright",
          water: "medium",
          humidityPref: "medium",
          soilType: f.soilType || "potting mix",
          waterIntervalDays: "3",
          fertilizeIntervalDays: "30",
        })),
    },
  ] as const

  const speciesList = useMemo(() => {
    const set = new Set<string>()
    for (const p of PLANTS) if (p.species) set.add(p.species)
    return Array.from(set)
  }, [])

  function applySpeciesDefaults(speciesName: string) {
    const match = PLANTS.find((p) => p.species?.toLowerCase() === speciesName.trim().toLowerCase())
    if (!match) return false
    setForm((f) => ({
      ...f,
      species: speciesName,
      light: (match.light as any) ?? f.light,
      water: (match.water as any) ?? f.water,
      waterIntervalDays: match.waterIntervalDays != null ? String(match.waterIntervalDays) : f.waterIntervalDays,
      fertilizeIntervalDays: match.fertilizeIntervalDays != null ? String(match.fertilizeIntervalDays) : f.fertilizeIntervalDays,
      soilType: f.soilType || "",
    }))
    return true
  }

  const carePreview = useMemo(() => {
    const w = form.waterIntervalDays ? `${form.waterIntervalDays} days` : "—"
    return `Water every ${w}${form.fertilizeIntervalDays ? ` · Fertilize every ${form.fertilizeIntervalDays} days` : ""}`
  }, [form.waterIntervalDays, form.fertilizeIntervalDays])

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
        waterMl: overrideWater && form.waterMl !== "" ? Number(form.waterMl) : undefined,
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
      <div className="sticky top-0 z-10 -mx-4 border-b bg-white/80 px-4 py-2 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="flex flex-wrap items-center gap-2">
          {FORM_STEPS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={`rounded px-3 py-1 text-xs capitalize ${step === s ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200"}`}
            >
              {s}
            </button>
          ))}
          <div className="ml-auto text-xs text-gray-600 dark:text-gray-300 truncate">
            {carePreview}
          </div>
        </div>
      </div>
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

      {step === "basics" ? (
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-300">Care profile:</span>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                p.apply()
                setCareProfile(p.key as any)
              }}
              className={`rounded border px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
                careProfile === p.key ? "border-blue-500 text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCareProfile("custom")}
            className={`rounded border px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
              careProfile === "custom" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"
            }`}
          >
            Custom
          </button>
          <span className="ml-auto"></span>
          <button
            type="button"
            onClick={() => setSimpleMode((v) => !v)}
            className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {simpleMode ? "Switch to detailed" : "Switch to simple"}
          </button>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Species</label>
          <input
            list="species-list"
            value={form.species || ""}
            onChange={(e) => setForm((f) => ({ ...f, species: e.target.value }))}
            onBlur={() => form.species && applySpeciesDefaults(form.species)}
            placeholder="e.g. Monstera deliciosa"
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
          <datalist id="species-list">
            {speciesList.slice(0, 1000).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Selecting a known species auto-fills care defaults.</p>
        </div>
      </div>
      ) : null}

      {step === "care" ? (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Watering frequency</label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Weekly", v: 7 },
              { label: "Biweekly", v: 14 },
              { label: "Monthly", v: 30 },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setForm((f) => ({ ...f, waterIntervalDays: String(opt.v) }))}
                className={`rounded px-2 py-1 text-xs ${form.waterIntervalDays == String(opt.v) ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200"}`}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, waterIntervalDays: f.waterIntervalDays || String(recommended().waterDays) }))}
              className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Custom
            </button>
          </div>
          {form.waterIntervalDays ? (
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.waterIntervalDays || ""}
              onChange={(e) => setForm((f) => ({ ...f, waterIntervalDays: e.target.value.replace(/[^0-9]/g, "") }))}
              className="mt-2 w-32 rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Fertilizing frequency</label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Monthly", v: 30 },
              { label: "6 weeks", v: 45 },
              { label: "Bi-monthly", v: 60 },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setForm((f) => ({ ...f, fertilizeIntervalDays: String(opt.v) }))}
                className={`rounded px-2 py-1 text-xs ${form.fertilizeIntervalDays == String(opt.v) ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200"}`}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, fertilizeIntervalDays: f.fertilizeIntervalDays || String(recommended().fertDays) }))}
              className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Custom
            </button>
          </div>
          {form.fertilizeIntervalDays ? (
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.fertilizeIntervalDays || ""}
              onChange={(e) => setForm((f) => ({ ...f, fertilizeIntervalDays: e.target.value.replace(/[^0-9]/g, "") }))}
              className="mt-2 w-32 rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          ) : null}
        </div>
      </div>
      ) : null}

      {step === "care" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Water amount</label>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {(() => {
                const suggested = computeRecommendedWaterMl(
                  form.potSizeCm ? Number(form.potSizeCm) : undefined,
                  form.soilType,
                  (form.humidityPref || undefined) as "low" | "medium" | "high" | undefined
                )
                return suggested ? `Recommended: ${suggested} mL (${(suggested / 29.5735).toFixed(1)} oz)` : "No recommendation yet"
              })()}
            </p>
            {overrideWater ? (
              <>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.waterMl || ""}
                  onChange={(e) => setForm((f) => ({ ...f, waterMl: e.target.value.replace(/[^0-9]/g, "") }))}
                  placeholder="Override (e.g. 240)"
                  className="mt-2 w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
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
                <button
                  type="button"
                  onClick={() => setOverrideWater(false)}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Use recommendation
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setOverrideWater(true)}
                className="mt-2 rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Override amount
              </button>
            )}
          </div>
        </div>
        </div>
      ) : null}

      {step === "environment" ? (() => {
        const hasRoom = !!(form.roomId || (form.room && form.room.trim()))
        const hasWeather = !!(form.weatherNotes && form.weatherNotes.trim())
        return !hasRoom && !hasWeather && !showEnvironment ? (
          <div>
            <button
              type="button"
              onClick={() => {
                setShowEnvironment(true)
              }}
              className="rounded border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Add location
            </button>
          </div>
        ) : null
      })() : null}

      {step === "environment" ? (() => {
        const hasRoom = !!(form.roomId || (form.room && form.room.trim()))
        const hasWeather = !!(form.weatherNotes && form.weatherNotes.trim())
        if (!hasRoom && !hasWeather && !showEnvironment) return null
        return (
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
        )
      })() : null}

      {step === "advanced" ? (
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs text-blue-600 hover:underline"
        >
          {showAdvanced ? "Hide advanced" : "Show advanced"}
        </button>
      </div>
      ) : null}

      {step === "advanced" && showAdvanced ? (
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

      {step === "care" && careProfile === "custom" ? (
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
      ) : null}

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

      {step === "basics" ? (
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
      ) : null}

      {step === "basics" ? (
      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Description</label>
        <textarea
          value={form.description || ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>
      ) : null}

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="sticky bottom-0 z-10 -mx-4 flex gap-3 border-t bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <button
          type="button"
          onClick={() => {
            const idx = FORM_STEPS.indexOf(step)
            if (idx > 0) setStep(FORM_STEPS[idx - 1])
          }}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            const idx = FORM_STEPS.indexOf(step)
            if (idx < FORM_STEPS.length - 1) setStep(FORM_STEPS[idx + 1])
          }}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Next
        </button>
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
