"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Search, Loader2, X } from "lucide-react"

type Result = {
  ticker: string
  name: string
  primaryExchange: string
  type: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TickerSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce input -> API call
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading } = useSWR<{ results: Result[] }>(
    debounced.length >= 1 ? `/api/search/tickers?q=${encodeURIComponent(debounced)}` : null,
    fetcher,
    { keepPreviousData: true },
  )
  const results = data?.results ?? []

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  // Global keyboard shortcut: Cmd/Ctrl+K to focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  function navigateTo(ticker: string) {
    setOpen(false)
    setQuery("")
    router.push(`/ticker/${ticker.toUpperCase()}`)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const pick = results[cursor]?.ticker ?? query.trim().toUpperCase()
    if (pick) navigateTo(pick)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === "Escape") {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <form onSubmit={onSubmit} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setCursor(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search any ticker…"
          aria-label="Search ticker"
          className="h-8 w-full rounded-md border border-border bg-muted/30 pl-9 pr-16 font-mono text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-muted/60 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </form>

      {open && (query.length > 0 || isLoading) && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {isLoading && results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <button
              type="button"
              onClick={() => navigateTo(query.trim().toUpperCase())}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs hover:bg-muted"
            >
              <span className="text-muted-foreground">Go directly to</span>
              <span className="font-mono font-semibold">{query.trim().toUpperCase()}</span>
            </button>
          ) : (
            <ul role="listbox" className="py-1">
              {results.map((r, idx) => (
                <li key={r.ticker}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => navigateTo(r.ticker)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs ${
                      idx === cursor ? "bg-muted" : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-semibold text-foreground">{r.ticker}</span>
                      <span className="truncate text-muted-foreground">{r.name}</span>
                    </div>
                    <span className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {r.primaryExchange?.replace("XNAS", "NASDAQ").replace("XNYS", "NYSE") || r.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
