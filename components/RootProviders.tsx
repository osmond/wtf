"use client"
import { SessionProvider } from "next-auth/react"
import { ToastProvider, ToastViewport } from "components/ToastProvider"

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <ToastViewport />
      </ToastProvider>
    </SessionProvider>
  )
}

