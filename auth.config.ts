import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"

function slugifyUsername(username: string) {
  return username.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Username",
      credentials: { username: { label: "Username", type: "text" } },
      async authorize(credentials) {
        const username = (credentials?.username as string | undefined)?.trim()
        if (!username) return null
        const id = slugifyUsername(username)
        return { id, name: username }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Persist id and name in token
        ;(token as any).id = (user as any).id
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = (token as any).id ?? token.sub
        session.user.name = token.name ?? session.user.name
      }
      return session
    },
  },
}
