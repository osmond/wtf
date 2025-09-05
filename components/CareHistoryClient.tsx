"use client"
import { useState } from "react"

type Event = { id: string; type: string; createdAt: string; waterMl?: number | null; fertilizerType?: string | null }

export function CareHistoryClient({ events }: { events: Event[] }) {
  const [tab, setTab] = useState<"water" | "fertilize">("water")
  const water = events.filter((e) => e.type === "water").slice(0, 5)
  const fert = events.filter((e) => e.type === "fertilize").slice(0, 5)
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 inline-flex rounded-full border p-1 text-sm dark:border-gray-700">
        <button
          onClick={() => setTab("water")}
          className={`rounded-full px-3 py-1 ${tab === "water" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
        >
          Watering
        </button>
        <button
          onClick={() => setTab("fertilize")}
          className={`rounded-full px-3 py-1 ${tab === "fertilize" ? "bg-gray-200 dark:bg-gray-700" : ""}`}
        >
          Fertilizer
        </button>
      </div>
      {tab === "water" ? (
        <ul className="space-y-1 text-sm">
          {water.length === 0 ? <li className="text-gray-500 dark:text-gray-400">No events</li> : null}
          {water.map((e) => (
            <li key={e.id} className="flex justify-between">
              <span>{new Date(e.createdAt).toLocaleString()}</span>
              <span className="text-gray-600 dark:text-gray-300">{e.waterMl ? `${e.waterMl} mL` : ""}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-1 text-sm">
          {fert.length === 0 ? <li className="text-gray-500 dark:text-gray-400">No events</li> : null}
          {fert.map((e) => (
            <li key={e.id} className="flex justify-between">
              <span>{new Date(e.createdAt).toLocaleString()}</span>
              <span className="text-gray-600 dark:text-gray-300">{e.fertilizerType || ""}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

