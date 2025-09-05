"use client"
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

type ToastType = "success" | "error" | "info"
type Toast = { id: number; type: ToastType; message: string }

const ToastCtx = createContext<{ notify: (type: ToastType, message: string) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(1)

  const notify = useCallback((type: ToastType, message: string) => {
    const id = idRef.current++
    setToasts((ts) => [...ts, { id, type, message }])
    // Auto-dismiss after 3s
    setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[90vw] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "pointer-events-auto flex items-start gap-2 rounded border p-3 text-sm shadow-lg ring-1 ring-black/5 transition-all " +
              "toast-animate " +
              (t.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-100"
                : t.type === "error"
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/50 dark:text-red-100"
                : "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-900/50 dark:text-sky-100")
            }
          >
            <span className="text-lg leading-none">
              {t.type === "success" ? (
                // icon
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Zm4.243-12.657a1 1 0 0 0-1.414-1.414L11 11.757 9.172 9.929a1 1 0 0 0-1.414 1.414l2.121 2.121a1 1 0 0 0 1.414 0l4.95-4.95Z" />
                </svg>
              ) : t.type === "error" ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 14h-2v-2h2v2Zm0-4h-2V6h2v6Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM11 10h2v6h-2v-6Zm0-4h2v2h-2V6Z" />
                </svg>
              )}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function ToastViewport() {
  // kept for layout placement; all DOM is in provider above
  return null
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
