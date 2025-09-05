"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { AuthButtons } from "components/AuthButtons"

const links = [
  { href: "/plants", label: "Plants" },
  { href: "/plants/today", label: "Today" },
  { href: "/plants/digest", label: "Digest" },
  { href: "/plants/analytics", label: "Analytics" },
]

export function HeaderNav() {
  const pathname = usePathname()
  const [todayOpen, setTodayOpen] = useState<number>(0)
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch("/api/tasks/counts")
        const data = (await res.json()) as { open?: number }
        if (active) setTodayOpen(data.open ?? 0)
      } catch {}
    }
    load()
    const t = setInterval(load, 30_000)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [])
  return (
    <header className="sticky top-0 z-40 hidden border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 sm:block">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          {links.map((l) => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "rounded px-2 py-1 text-sm font-medium " +
                  (active
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800")
                }
                aria-current={active ? "page" : undefined}
              >
                <span className="inline-flex items-center gap-2">
                  {l.label}
                  {l.href === "/plants/today" && todayOpen > 0 ? (
                    <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {todayOpen}
                    </span>
                  ) : null}
                </span>
              </Link>
            )
          })}
        </nav>
        <div className="shrink-0">
          <AuthButtons />
        </div>
      </div>
    </header>
  )
}
