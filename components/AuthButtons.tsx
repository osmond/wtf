"use client"
import { signIn, signOut, useSession } from "next-auth/react"
import { useState } from "react"

export function AuthButtons() {
  const { data } = useSession()
  const [name, setName] = useState("")
  if (data?.user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 dark:text-gray-300">Hi, {data.user.name}</span>
        <button
          className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          onClick={() => signOut({ callbackUrl: "/plants" })}
        >
          Sign out
        </button>
      </div>
    )
  }
  return (
    <form
      className="flex items-center gap-2 text-sm"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        signIn("credentials", { username: name, callbackUrl: "/plants" })
      }}
    >
      <input
        placeholder="username"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded border px-2 py-1 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />
      <button className="rounded bg-blue-600 px-2 py-1 font-medium text-white hover:bg-blue-700">Sign in</button>
    </form>
  )
}
