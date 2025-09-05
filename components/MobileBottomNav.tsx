"use client"
import { BarChart3, CalendarDays, CheckCircle2, Leaf } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const items = [
  { href: "/plants", label: "Plants", Icon: Leaf },
  { href: "/plants/today", label: "Today", Icon: CheckCircle2 },
  { href: "/plants/digest", label: "Digest", Icon: CalendarDays },
  { href: "/plants/analytics", label: "Stats", Icon: BarChart3 },
]

export function MobileBottomNav() {
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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-2 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900/95 sm:hidden">
      <ul className="mx-auto flex max-w-5xl items-center justify-between">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href
          const color = active ? "text-blue-600" : "text-gray-600 dark:text-gray-300"
          return (
            <li key={href} className="flex-1 text-center">
              <Link
                href={href}
                className={"mx-1 inline-flex flex-col items-center rounded px-2 py-1 text-xs " + color}
                aria-current={active ? "page" : undefined}
              >
                <div className="relative">
                  <Icon aria-hidden className="mb-0.5" size={20} strokeWidth={2.25} />
                  {href === "/plants/today" && todayOpen > 0 ? (
                    <span className="absolute -right-2 -top-2 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {todayOpen}
                    </span>
                  ) : null}
                </div>
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
