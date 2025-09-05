"use client"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useToast } from "components/ToastProvider"

function pretty(d?: string | null) {
  if (!d) return "—"
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return "—"
  return dt.toLocaleString()
}

export function PlantTimes({
  id,
  lastWateredAt,
  lastFertilizedAt,
  waterIntervalDays,
  fertilizeIntervalDays,
  waterMl,
  recommendedWaterMl,
  adjustedWaterMl,
}: {
  id: string
  lastWateredAt?: string | null
  lastFertilizedAt?: string | null
  waterIntervalDays?: number | null
  fertilizeIntervalDays?: number | null
  waterMl?: number | null
  recommendedWaterMl?: number | null
  adjustedWaterMl?: number | null
}) {
  const [optimisticWateredAt, setOW] = useState<string | null>(null)
  const [optimisticFertilizedAt, setOF] = useState<string | null>(null)
  const [pendingW, startW] = useTransition()
  const [pendingF, startF] = useTransition()
  const router = useRouter()
  const { notify } = useToast()

  // Placeholder for future next-due UI

  return (
    <div className="mt-4 space-y-6 text-sm">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Last watered</dt>
          <dd className="text-gray-800 dark:text-gray-200">
            {optimisticWateredAt ? "Just now" : pretty(lastWateredAt)}
          </dd>
          <button
            className="mt-2 w-full rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            disabled={pendingW}
            onClick={() =>
              startW(async () => {
                setOW(new Date().toISOString())
                const res = await fetch(`/api/plants/${id}/water`, { method: "POST" })
                if (res.ok) {
                  notify("success", "Plant watered")
                } else {
                  notify("error", "Failed to water plant")
                  setOW(null)
                }
                router.refresh()
              })
            }
          >
            {pendingW ? "Watering..." : "Mark Watered"}
          </button>
          {(adjustedWaterMl || recommendedWaterMl) && !waterMl ? (
            <button
              className="mt-2 rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={async () => {
                const res = await fetch(`/api/plants/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ waterMl: adjustedWaterMl ?? recommendedWaterMl }),
                })
                if (res.ok) {
                  notify("success", "Water amount set")
                  router.refresh()
                } else {
                  const data = (await res.json().catch(() => ({}))) as { error?: string }
                  notify("error", data.error ?? "Failed to set amount")
                }
              }}
            >
              Use suggestion
            </button>
          ) : null}
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {waterMl
              ? `Recommended: ${Math.round((waterMl / 29.5735) * 10) / 10} oz (${waterMl} mL)`
              : adjustedWaterMl
              ? `Adjusted: ${Math.round((adjustedWaterMl / 29.5735) * 10) / 10} oz (${adjustedWaterMl} mL)`
              : recommendedWaterMl
              ? `Suggested: ${Math.round((recommendedWaterMl / 29.5735) * 10) / 10} oz (${recommendedWaterMl} mL)`
              : null}
          </p>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Last fertilized</dt>
          <dd className="text-gray-800 dark:text-gray-200">
            {optimisticFertilizedAt ? "Just now" : pretty(lastFertilizedAt)}
          </dd>
          <button
            className="mt-2 w-full rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            disabled={pendingF}
            onClick={() =>
              startF(async () => {
                setOF(new Date().toISOString())
                const res = await fetch(`/api/plants/${id}/fertilize`, { method: "POST" })
                if (res.ok) {
                  notify("success", "Plant fertilized")
                } else {
                  notify("error", "Failed to fertilize plant")
                  setOF(null)
                }
                router.refresh()
              })
            }
          >
            {pendingF ? "Fertilizing..." : "Mark Fertilized"}
          </button>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {waterIntervalDays ? `Water every ${waterIntervalDays}d` : null}
            {fertilizeIntervalDays ? `${waterIntervalDays ? " • " : ""}Fertilize every ${fertilizeIntervalDays}d` : null}
          </p>
        </div>
      </div>
    </div>
  )
}
