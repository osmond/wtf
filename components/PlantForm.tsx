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
  weatherNotes?: string
}

type Props = {
  mode: "create" | "edit"
  initial?: PlantInput
}

const LIGHTS = ["", "low", "medium", "bright"] as const
const WATERS = ["", "low", "medium", "high"] as const

export function PlantForm({ mode, initial }: Props) {
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
    weatherNotes: (init?.["weatherNotes"] as string) ?? "",
  }))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({})
  const { notify } = useToast()

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
        room: form.room?.trim() || undefined,
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

      <h3 className="mt-6 text-sm font-semibold text-gray-800 dark:text-gray-200">Care Metrics</h3>
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
          <input
            value={form.room || ""}
            onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
            placeholder="e.g. Living Room"
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
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

      <div>
        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Image URL</label>
        <input
          value={form.imageUrl || ""}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          placeholder="https://..."
          className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
        />
        {fieldErrors.imageUrl ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.imageUrl[0]}</p>
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
