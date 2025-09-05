"use client"
import { ArchiveRestore, MoreVertical, Pencil } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useToast } from "components/ToastProvider"

export function FabActions({ id, archived = false }: { id: string; archived?: boolean }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const { notify } = useToast()
  const router = useRouter()

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:bottom-6">
      {/* Actions */}
      <div className="mb-2 flex flex-col items-end gap-2 transition-opacity">
        {open && (
          <>
            <Link
              href={`/plants/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
            >
              <Pencil size={16} /> Edit
            </Link>
            <button
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-white shadow disabled:opacity-60 ${archived ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const ok = window.confirm(archived ? "Unarchive this plant?" : "Archive this plant?")
                  if (!ok) return
                  const res = await fetch(`/api/plants/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: !archived }) })
                  if (res.ok) {
                    notify("success", archived ? "Plant unarchived" : "Plant archived")
                    router.push("/plants")
                    router.refresh()
                  } else {
                    const data = (await res.json().catch(() => ({}))) as { error?: string }
                    notify("error", data.error ?? "Failed to update plant")
                  }
                })
              }
            >
              <ArchiveRestore size={16} /> {archived ? "Unarchive" : "Archive"}
            </button>
          </>
        )}
      </div>

      {/* FAB */}
      <button
        aria-label="Actions"
        className="inline-flex size-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg ring-1 ring-black/10 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={22} />
      </button>
    </div>
  )
}
