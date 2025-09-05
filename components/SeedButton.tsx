"use client"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useToast } from "components/ToastProvider"

export function SeedButton() {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { notify } = useToast()

  return (
    <div className="inline-flex flex-col items-start">
      <button
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        onClick={() =>
          start(async () => {
            setError(null)
            const res = await fetch("/api/plants/seed", { method: "POST" })
            if (!res.ok) {
              const data = (await res.json().catch(() => ({}))) as { error?: string }
              setError(data.error ?? "Failed to seed")
              notify("error", data.error ?? "Failed to seed plants")
              return
            }
            const data = (await res.json().catch(() => ({}))) as { tasksGenerated?: number }
            notify("success", `Sample plants added${data.tasksGenerated ? ` + ${data.tasksGenerated} tasks` : ""}`)
            router.refresh()
          })
        }
        disabled={pending}
      >
        {pending ? "Seeding..." : "Add sample plants"}
      </button>
      {error ? <span className="mt-2 text-xs text-red-600">{error}</span> : null}
    </div>
  )
}
