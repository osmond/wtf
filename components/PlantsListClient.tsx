"use client"
import { useMemo, useState } from "react"
import { PlantCard } from "components/PlantCard/PlantCard"
import type { Plant as PlantType } from "types/plant"

type Plant = {
  id: string
  name: string
  species?: string | null
  light?: string | null
  water?: string | null
  description?: string | null
  imageUrl?: string | null
  lastWateredAt?: string | null
}

export function PlantsListClient({ plants }: { plants: Plant[] }) {
  const [q, setQ] = useState("")
  const [light, setLight] = useState("")
  const [water, setWater] = useState("")

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return plants.filter((p) => {
      if (light && (p.light || "") !== light) return false
      if (water && (p.water || "") !== water) return false
      if (!s) return true
      const hay = `${p.name} ${p.species ?? ""}`.toLowerCase()
      return hay.includes(s)
    })
  }, [plants, q, light, water])

  return (
    <div className="space-y-6">
      <div className="grid items-end gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or species"
            className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Light</label>
            <select
              value={light}
              onChange={(e) => setLight(e.target.value)}
              className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">Any</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="bright">bright</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Water</label>
            <select
              value={water}
              onChange={(e) => setWater(e.target.value)}
              className="w-full rounded border p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">Any</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">{filtered.length} result(s)</p>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((plant) => (
          <PlantCard key={plant.id} plant={plant as unknown as PlantType} />
        ))}
      </section>
    </div>
  )
}
