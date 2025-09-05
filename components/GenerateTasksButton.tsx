"use client"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useToast } from "components/ToastProvider"

export function GenerateTasksButton() {
  const [pending, start] = useTransition()
  const router = useRouter()
  const { notify } = useToast()
  return (
    <button
      className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
      onClick={() =>
        start(async () => {
          const res = await fetch("/api/tasks/generate", { method: "POST" })
          const data = (await res.json().catch(() => ({}))) as { generated?: number; error?: string }
          if (res.ok) {
            notify("success", `Generated ${data.generated ?? 0} tasks`)
            router.refresh()
          } else {
            notify("error", data.error ?? "Failed to generate tasks")
          }
        })
      }
      disabled={pending}
      type="button"
    >
      {pending ? "Generating..." : "Generate tasks (30d)"}
    </button>
  )
}
