"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage("Sending sign-in link...")
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    setMessage(error ? error.message : "Check your email for the login link.")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Account Sync</p>
        <h1 className="mt-2 text-2xl font-semibold">Save watchlists and layouts</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with a magic link so your dashboard state follows you across devices and deploys.
        </p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none"
        />
        <button type="submit" className="mt-4 h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Send sign-in link
        </button>
        {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
      </form>
    </main>
  )
}
