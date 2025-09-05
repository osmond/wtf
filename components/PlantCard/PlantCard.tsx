import { Droplets, Sprout } from "lucide-react"
import Link from "next/link"
import { ProgressRing } from "components/ProgressRing"
import { SafeImg } from "components/SafeImg"
import type { Plant as BasePlant } from "types/plant"

function since(date?: string) {
  if (!date) return null
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return null
  const ms = Date.now() - d.getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days > 0) return `${days}d ago`
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours > 0) return `${hours}h ago`
  const mins = Math.floor(ms / (1000 * 60))
  if (mins > 0) return `${mins}m ago`
  return "just now"
}

type UIPlant = BasePlant & {
  createdAt?: string | Date
  lastFertilizedAt?: string | null
  waterIntervalDays?: number | null
  fertilizeIntervalDays?: number | null
}

type Props = { plant: UIPlant }

export function PlantCard({ plant }: Props) {
  const waterSince = since(plant.lastWateredAt)
  const fertSince = since(plant.lastFertilizedAt || undefined)

  const wInt = plant.waterIntervalDays ?? undefined
  const fInt = plant.fertilizeIntervalDays ?? undefined

  const wDue = wInt
    ? (() => {
        const createdRaw = plant.createdAt
        const created = createdRaw instanceof Date ? createdRaw : createdRaw ? new Date(createdRaw) : new Date()
        const base = plant.lastWateredAt ? new Date(plant.lastWateredAt) : created
        const d = new Date(base)
        d.setDate(d.getDate() + wInt)
        return d
      })()
    : null
  const fDue = fInt
    ? (() => {
        const createdRaw = plant.createdAt
        const created = createdRaw instanceof Date ? createdRaw : createdRaw ? new Date(createdRaw) : new Date()
        const baseF = plant.lastFertilizedAt ? new Date(plant.lastFertilizedAt) : created
        const d = new Date(baseF)
        d.setDate(d.getDate() + fInt)
        return d
      })()
    : null

  const nextDue = wDue && fDue ? (wDue < fDue ? wDue : fDue) : wDue ?? fDue
  const nextKind = nextDue === wDue ? "water" : nextDue === fDue ? "fert" : null
  const now = Date.now()
  const overdue = !!(nextDue && nextDue.getTime() < now)
  const soonThreshold = 1000 * 60 * 60 * 24 * 2 // 2 days
  const dueSoon = !!(nextDue && nextDue.getTime() - now <= soonThreshold && nextDue.getTime() >= now)

  function formatNext(d?: Date | null) {
    if (!d) return null
    const diff = d.getTime() - now
    if (diff <= 0) return "due now"
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 0) return `in ${days}d`
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours > 0) return `in ${hours}h`
    const mins = Math.floor(diff / (1000 * 60))
    if (mins > 0) return `in ${mins}m`
    return "soon"
  }

  return (
    <div
      className={
        "group rounded-lg border bg-white shadow-sm transition hover:shadow-lg dark:bg-gray-900 overflow-hidden " +
        (overdue
          ? "border-red-400 dark:border-red-700"
          : dueSoon
          ? "border-amber-300 dark:border-amber-700"
          : "border-gray-200 dark:border-gray-700")
      }
    >
      {plant.imageUrl ? (
        <SafeImg
          src={plant.imageUrl}
          fallbackId={plant.id}
          alt={plant.name}
          className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      ) : (
        <div className="h-40 w-full bg-gray-100 dark:bg-gray-800" />
      )}
      <div className="relative p-4">
        {nextDue && (wInt || fInt) ? (
          (() => {
            // compute percent toward next due
            let elapsed = 0
            let total = 1
            if (nextKind === "water" && wInt) {
              const createdRaw2 = plant.createdAt
              const created = createdRaw2 instanceof Date ? createdRaw2 : createdRaw2 ? new Date(createdRaw2) : new Date()
              const base = plant.lastWateredAt ? new Date(plant.lastWateredAt) : created
              total = wInt * 24 * 60 * 60 * 1000
              elapsed = Date.now() - base.getTime()
            } else if (nextKind === "fert" && fInt) {
              const createdRaw3 = plant.createdAt
              const created = createdRaw3 instanceof Date ? createdRaw3 : createdRaw3 ? new Date(createdRaw3) : new Date()
              const base = plant.lastFertilizedAt ? new Date(plant.lastFertilizedAt) : created
              total = fInt * 24 * 60 * 60 * 1000
              elapsed = Date.now() - base.getTime()
            }
            const pct = Math.max(0, Math.min(100, (elapsed / total) * 100))
            type RingColor = "overdue" | "soon" | "normal"
            const color: RingColor = overdue ? "overdue" : dueSoon ? "soon" : "normal"
            const label = ""
            return (
              <div className="absolute right-3 top-3">
                <ProgressRing size={36} stroke={4} percent={pct} color={color} label={label} />
              </div>
            )
          })()
        ) : null}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Link href={`/plants/${plant.id}`}>{plant.name}</Link>
        </h3>
        {plant.species ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{plant.species}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-300">
          {plant.light ? (
            <span className="rounded-full bg-gradient-to-r from-sky-100 to-sky-50 px-2 py-0.5 text-sky-700 dark:from-sky-900 dark:to-sky-800 dark:text-sky-200">
              Light: {plant.light}
            </span>
          ) : null}
          {plant.water ? (
            <span className="rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 px-2 py-0.5 text-emerald-700 dark:from-emerald-900 dark:to-emerald-800 dark:text-emerald-200">
              Water: {plant.water}
            </span>
          ) : null}
          {waterSince ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <Droplets size={14} className={(wDue ? (wDue.getTime() < now ? "text-red-600" : wDue.getTime() - now <= soonThreshold ? "text-amber-600" : "text-emerald-600") : "text-gray-500")} />
              Last: {waterSince}
            </span>
          ) : null}
          {fertSince ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <Sprout size={14} className={(fDue ? (fDue.getTime() < now ? "text-red-600" : fDue.getTime() - now <= soonThreshold ? "text-amber-600" : "text-emerald-600") : "text-gray-500")} />
              Last: {fertSince}
            </span>
          ) : null}
          {nextDue ? (
            <span
              className={
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 " +
                (overdue
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                  : dueSoon
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200")
              }
            >
              {nextKind === "water" ? (
                <Droplets size={14} className={(wDue ? (wDue.getTime() < now ? "text-red-600" : wDue.getTime() - now <= soonThreshold ? "text-amber-600" : "text-emerald-600") : "text-gray-500")} />
              ) : (
                <Sprout size={14} className={(fDue ? (fDue.getTime() < now ? "text-red-600" : fDue.getTime() - now <= soonThreshold ? "text-amber-600" : "text-emerald-600") : "text-gray-500")} />
              )} Next: {formatNext(nextDue)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
