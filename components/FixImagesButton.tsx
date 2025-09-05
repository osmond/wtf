"use client"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useToast } from "components/ToastProvider"

export function FixImagesButton() {
  const [pending, start] = useTransition()
  const router = useRouter()
  const { notify } = useToast()
  return (
    <button
      className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
      onClick={() =>
        start(async () => {
          const res = await fetch("/api/plants/fix-images", { method: "POST" })
          const data = (await res.json().catch(() => ({}))) as { updated?: number; error?: string }
          if (res.ok) {
            notify("success", `Updated ${data.updated ?? 0} images`)
            router.refresh()
          } else {
            notify("error", data.error ?? "Failed to fix images")
          }
        })
      }
      disabled={pending}
      type="button"
    >
      {pending ? "Fixing..." : "Fix images"}
    </button>
  )
}
