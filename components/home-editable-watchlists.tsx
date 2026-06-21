"use client"

import { useEffect, useState } from "react"
import { Plus, X, Pencil } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

type Watchlist = {
  id: string
  name: string
  color: string
  position: number
  symbols?: string[]
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function HomeEditableWatchlists() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([])
  const [activeList, setActiveList] = useState<string>("")
  const [newSymbol, setNewSymbol] = useState("")
  const [editingName, setEditingName] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(true)

  // Load watchlists and symbols
  useEffect(() => {
    async function load() {
      try {
        const { data: lists } = await supabase
          .from("named_watchlists")
          .select("*")
          .order("position", { ascending: true })

        if (lists) {
          const withSymbols = await Promise.all(
            lists.map(async (list) => {
              const { data: symbols } = await supabase
                .from("watchlist_symbols")
                .select("ticker")
                .eq("watchlist_id", list.id)

              return {
                ...list,
                symbols: symbols?.map((s) => s.ticker) || [],
              }
            })
          )
          setWatchlists(withSymbols)
          if (withSymbols.length > 0) setActiveList(withSymbols[0].id)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function addWatchlist() {
    if (watchlists.length >= 5) return
    const { data } = await supabase
      .from("named_watchlists")
      .insert([{ name: "New Watchlist", color: "#3b82f6", position: watchlists.length }])
      .select()
      .single()

    if (data) {
      setWatchlists([...watchlists, { ...data, symbols: [] }])
      setActiveList(data.id)
    }
  }

  async function deleteWatchlist(id: string) {
    await supabase.from("named_watchlists").delete().eq("id", id)
    setWatchlists(watchlists.filter((w) => w.id !== id))
    if (activeList === id) setActiveList(watchlists[0]?.id || "")
  }

  async function renameWatchlist(id: string, name: string) {
    await supabase.from("named_watchlists").update({ name }).eq("id", id)
    setWatchlists(watchlists.map((w) => (w.id === id ? { ...w, name } : w)))
    setEditingName(null)
    setNewName("")
  }

  async function addSymbol() {
    if (!newSymbol.trim() || !activeList) return
    const ticker = newSymbol.toUpperCase().trim()

    const { error } = await supabase.from("watchlist_symbols").insert([
      { watchlist_id: activeList, ticker },
    ])

    if (!error) {
      setWatchlists(
        watchlists.map((w) =>
          w.id === activeList ? { ...w, symbols: [...(w.symbols || []), ticker] } : w
        )
      )
      setNewSymbol("")
    }
  }

  async function removeSymbol(ticker: string) {
    await supabase
      .from("watchlist_symbols")
      .delete()
      .eq("watchlist_id", activeList)
      .eq("ticker", ticker)

    setWatchlists(
      watchlists.map((w) =>
        w.id === activeList
          ? { ...w, symbols: w.symbols?.filter((s) => s !== ticker) }
          : w
      )
    )
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded bg-muted/20" />
  }

  const active = watchlists.find((w) => w.id === activeList)
  const symbols = active?.symbols || []

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      {/* Watchlist tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {watchlists.map((list) => (
          <button
            key={list.id}
            onClick={() => setActiveList(list.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-widest transition-colors whitespace-nowrap ${
              activeList === list.id
                ? `text-white`
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={
              activeList === list.id
                ? { backgroundColor: list.color, color: "white" }
                : {}
            }
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: list.color }}
            />
            {editingName === list.id ? (
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => renameWatchlist(list.id, newName || list.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") renameWatchlist(list.id, newName || list.name)
                }}
                className="bg-transparent border-b border-white/50 outline-none w-20"
              />
            ) : (
              <>
                {list.name}
                {watchlists.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (editingName === list.id) {
                        setEditingName(null)
                      } else {
                        setEditingName(list.id)
                        setNewName(list.name)
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </>
            )}
            {watchlists.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteWatchlist(list.id)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </button>
        ))}

        {watchlists.length < 5 && (
          <button
            onClick={addWatchlist}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        )}
      </div>

      {/* Add symbol input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add ticker..."
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSymbol()}
          className="flex-1 rounded border border-border bg-muted/20 px-2 py-1 text-xs font-mono placeholder-muted-foreground focus:outline-none focus:border-primary"
        />
        <button
          onClick={addSymbol}
          className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-mono hover:bg-primary/90 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Symbols list */}
      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
        {symbols.length === 0 ? (
          <p className="text-xs text-muted-foreground">No symbols in this watchlist</p>
        ) : (
          symbols.map((ticker) => (
            <div
              key={ticker}
              className="flex items-center gap-1 px-2 py-1 rounded bg-muted/30 text-xs font-mono"
            >
              {ticker}
              <button
                onClick={() => removeSymbol(ticker)}
                className="text-muted-foreground hover:text-foreground ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="text-[10px] text-muted-foreground font-mono">
        {watchlists.length}/5 watchlists
      </div>
    </div>
  )
}
