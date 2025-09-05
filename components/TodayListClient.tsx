"use client"
import { Droplets, Sprout } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "components/ToastProvider"

type DueEntry = { id: string; name: string; kind: "water" | "fert"; due: string }

export function TodayListClient({ overdue, today }: { overdue: DueEntry[]; today: DueEntry[] }) {
  const [over, setOver] = useState(overdue)
  const [tod, setTod] = useState(today)
  const router = useRouter()
  const { notify } = useToast()

  async function act(entry: DueEntry) {
    const path = entry.kind === "water" ? `/api/plants/${entry.id}/water` : `/api/plants/${entry.id}/fertilize`
    // Optimistically remove
    setOver((arr) => arr.filter((e) => e !== entry))
    setTod((arr) => arr.filter((e) => e !== entry))
    const res = await fetch(path, { method: "POST" })
    if (res.ok) {
      notify("success", entry.kind === "water" ? "Watered" : "Fertilized")
    } else {
      notify("error", "Action failed; please retry")
      // No reinsert to keep UX simple; refresh to recompute tasks
    }
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <Section title={`Overdue (${over.length})`} entries={over} onAct={act} />
      <Section title={`Today (${tod.length})`} entries={tod} onAct={act} />
    </div>
  )
}

function Section({ title, entries, onAct }: { title: string; entries: DueEntry[]; onAct: (e: DueEntry) => void }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Nothing here.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {entries.map((e) => (
            <li key={`${e.kind}-${e.id}`} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-gray-500 dark:text-gray-300">
                  {e.kind === "water" ? <Droplets size={14} /> : <Sprout size={14} />}
                </span>
                <Link href={`/plants/${e.id}`} className="text-blue-600 hover:underline">
                  {e.name}
                </Link>
                <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(e.due).toLocaleString()}</span>
              </div>
              <button
                onClick={() => onAct(e)}
                className={
                  "rounded px-3 py-1.5 text-xs font-medium text-white " +
                  (e.kind === "water"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700")
                }
              >
                {e.kind === "water" ? "Mark watered" : "Mark fertilized"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
