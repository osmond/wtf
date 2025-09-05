"use client"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useToast } from "components/ToastProvider"

export function WaterButton({ id }: { id: string }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  const { notify } = useToast()
  return (
    <button
      className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      onClick={() =>
        start(async () => {
          const res = await fetch(`/api/plants/${id}/water`, { method: "POST" })
          if (res.ok) {
            notify("success", "Plant watered")
          } else {
            notify("error", "Failed to water plant")
          }
          router.refresh()
        })
      }
      disabled={pending}
    >
      {pending ? "Watering..." : "Mark watered"}
    </button>
  )
}
