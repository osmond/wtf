"use client"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useToast } from "components/ToastProvider"

export function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  const { notify } = useToast()
  return (
    <button
      className="rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
      onClick={() =>
        start(async () => {
          const ok = typeof window !== "undefined" ? window.confirm("Delete this plant?") : true
          if (!ok) return
          const res = await fetch(`/api/plants/${id}`, { method: "DELETE" })
          if (res.ok) {
            notify("success", "Plant deleted")
            router.push("/plants")
            router.refresh()
          } else {
            notify("error", "Failed to delete plant")
          }
        })
      }
      disabled={pending}
      type="button"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  )
}
