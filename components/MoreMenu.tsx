"use client"
import { BarChart3, Lightbulb, LinkIcon, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export function MoreMenu({ analyticsHref }: { analyticsHref: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="More"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-1.5 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <MoreHorizontal size={18} />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            <li>
              <Link
                href={analyticsHref}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={() => setOpen(false)}
              >
                <BarChart3 size={16} /> Analytics
              </Link>
            </li>
            <li>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={() => {
                  setOpen(false)
                  // Placeholder for future coaching tips
                  alert("Care tips coming soon ✨")
                }}
              >
                <Lightbulb size={16} /> Care tips (soon)
              </button>
            </li>
            <li>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).catch(() => {})
                  setOpen(false)
                }}
              >
                <LinkIcon size={16} /> Copy link
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}
