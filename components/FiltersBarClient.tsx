"use client"
import { Archive, Droplets, Filter, Search, SortAsc, SunMedium, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"

export function FiltersBarClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const timerRef = useRef<number | null>(null)
  const setParam = (key: string, value: string) => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`${pathname}?${params.toString()}`)
    }, 200)
  }

  const setImmediate = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  const q = searchParams.get("q") ?? ""
  const light = searchParams.get("light") ?? ""
  const water = searchParams.get("water") ?? ""
  const overdue = searchParams.get("overdue") ?? ""
  const showArchived = searchParams.get("archived") ?? ""
  const sort = searchParams.get("sort") ?? ""

  const hasFilters = !!(q || light || water || overdue || sort)

  const clearAll = () => {
    router.push(`${pathname}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative min-w-0 grow sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          defaultValue={q}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="Search plants..."
          className="w-full rounded-full border pl-9 pr-9 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
        />
        {q ? (
          <button
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => setImmediate("q", "")}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {/* Light */}
      <div className="flex items-center gap-2">
        <SunMedium size={16} className="text-gray-500 dark:text-gray-300" />
        <select
          value={light}
          onChange={(e) => setImmediate("light", e.target.value)}
          className="rounded-full border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Light: Any</option>
          <option value="low">Light: low</option>
          <option value="medium">Light: medium</option>
          <option value="bright">Light: bright</option>
        </select>
      </div>

      {/* Water */}
      <div className="flex items-center gap-2">
        <Droplets size={16} className="text-gray-500 dark:text-gray-300" />
        <select
          value={water}
          onChange={(e) => setImmediate("water", e.target.value)}
          className="rounded-full border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Water: Any</option>
          <option value="low">Water: low</option>
          <option value="medium">Water: medium</option>
          <option value="high">Water: high</option>
        </select>
      </div>

      {/* Overdue toggle */}
      <button
        type="button"
        onClick={() => setImmediate("overdue", overdue === "1" ? "" : "1")}
        className={
          "inline-flex items-center gap-1 rounded-full border px-3 py-2 text-sm " +
          (overdue === "1"
            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200"
            : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800")
        }
      >
        <Filter size={16} /> Overdue
      </button>

      {/* Sort segmented */}
      <div className="flex items-center gap-2">
        <SortAsc size={16} className="text-gray-500 dark:text-gray-300" />
        <div className="inline-flex rounded-full border p-1 dark:border-gray-700">
          <button
            className={
              "rounded-full px-3 py-1 text-sm " +
              (sort === "" ? "bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200")
            }
            onClick={() => setImmediate("sort", "")}
          >
            Newest
          </button>
          <button
            className={
              "rounded-full px-3 py-1 text-sm " +
              (sort === "dueSoon" ? "bg-gray-200 dark:bg-gray-700" : "text-gray-700 dark:text-gray-200")
            }
            onClick={() => setImmediate("sort", "dueSoon")}
          >
            Due soon
          </button>
        </div>
      </div>

      {/* Clear */}
      <button
        type="button"
        onClick={() => setImmediate("archived", showArchived === "1" ? "" : "1")}
        className={
          "inline-flex items-center gap-1 rounded-full border px-3 py-2 text-sm " +
          (showArchived === "1"
            ? "border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800")
        }
        title="Show archived"
      >
        <Archive size={16} /> Archived
      </button>

      {hasFilters ? (
        <button
          type="button"
          onClick={clearAll}
          className="ml-auto rounded-full border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Clear
        </button>
      ) : null}
    </div>
  )
}
