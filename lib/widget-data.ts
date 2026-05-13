"use client"

import { useEffect, useState } from "react"

export const WIDGET_STAGGER_MS = 140

export async function jsonFetcher<T = unknown>(url: string): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 12_000)

  try {
    const response = await fetch(url, { signal: controller.signal })
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error?: unknown }).error)
          : `Request failed with ${response.status}`
      throw new Error(message)
    }

    return payload as T
  } finally {
    window.clearTimeout(timeout)
  }
}

export function useDelayedReady(delayMs = 0) {
  const [ready, setReady] = useState(delayMs <= 0)

  useEffect(() => {
    if (delayMs <= 0) {
      setReady(true)
      return
    }

    setReady(false)
    const timer = window.setTimeout(() => setReady(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return ready
}

export function useDelayedKey<T>(key: T | null, delayMs = 0): T | null {
  const ready = useDelayedReady(key ? delayMs : 0)
  return ready ? key : null
}
