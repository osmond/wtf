"use client"
import { Droplets, Sprout } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "components/ToastProvider"

type DueEntry = { id: string; plantId: string; name: string; kind: "water" | "fert"; due: string }

export function TodayTasksClient({ overdue, today, completed }: { overdue: DueEntry[]; today: DueEntry[]; completed: DueEntry[] }) {
  const [over, setOver] = useState(overdue)
  const [tod, setTod] = useState(today)
  const [done, _setDone] = useState(completed)
  const router = useRouter()
  const { notify } = useToast()

  async function complete(entry: DueEntry) {
    setOver((arr) => arr.filter((e) => e !== entry))
    setTod((arr) => arr.filter((e) => e !== entry))
    const res = await fetch(`/api/tasks/${entry.id}/complete`, { method: "POST" })
    if (res.ok) {
      notify("success", "Task completed")
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      notify("error", data.error ?? "Failed to complete task")
    }
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <Section title={`Overdue (${over.length})`} entries={over} onAct={complete} />
      <Section title={`Today (${tod.length})`} entries={tod} onAct={complete} />
      <CompletedSection title={`Completed Today (${done.length})`} entries={done} />
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
            <li key={e.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-gray-500 dark:text-gray-300">
                  {e.kind === "water" ? <Droplets size={14} /> : <Sprout size={14} />}
                </span>
                <Link href={`/plants/${e.plantId}`} className="text-blue-600 hover:underline">
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
                Complete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CompletedSection({ title, entries }: { title: string; entries: DueEntry[] }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Nothing here.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="opacity-60 text-gray-500 dark:text-gray-300" aria-hidden>
                  {e.kind === "water" ? <Droplets size={14} /> : <Sprout size={14} />}
                </span>
                <Link href={`/plants/${e.plantId}`} className="text-blue-600 hover:underline line-through opacity-70">
                  {e.name}
                </Link>
                <span className="text-xs text-gray-500 dark:text-gray-400 line-through">{new Date(e.due).toLocaleString()}</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
