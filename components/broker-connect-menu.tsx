"use client"

import { useState } from "react"
import useSWR from "swr"
import { Check, ChevronDown, ExternalLink, Link2, Loader2, Plug, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { BROKERS, type BrokerDefinition, type BrokerId } from "@/lib/brokers"

type Connection = {
  id: string
  broker: BrokerId
  label: string | null
  environment: string
  status: string
  last_verified_at: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function BrokerConnectMenu() {
  const { data, mutate, isLoading } = useSWR<{ connections: Connection[] }>(
    "/api/brokers",
    fetcher,
  )
  const [activeBroker, setActiveBroker] = useState<BrokerDefinition | null>(null)

  const connections = data?.connections ?? []
  const connectedCount = connections.length

  async function handleDisconnect(id: string) {
    await fetch(`/api/brokers?id=${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-border bg-card font-mono text-xs"
          >
            <Plug className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {connectedCount > 0 ? `${connectedCount} broker${connectedCount > 1 ? "s" : ""}` : "Connect"}
            </span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            Connected accounts
          </DropdownMenuLabel>
          {isLoading && (
            <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </div>
          )}
          {!isLoading && connections.length === 0 && (
            <div className="px-2 py-2 text-xs text-muted-foreground">No accounts connected yet.</div>
          )}
          {connections.map((c) => {
            const def = BROKERS.find((b) => b.id === c.broker)
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary" />
                    <span className="truncate font-medium">{c.label ?? def?.name}</span>
                  </div>
                  <div className="ml-4.5 truncate font-mono text-[0.65rem] uppercase text-muted-foreground">
                    {def?.name} · {c.environment}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDisconnect(c.id)}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  aria-label={`Disconnect ${c.label ?? def?.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            Link a platform
          </DropdownMenuLabel>
          {BROKERS.map((b) => (
            <DropdownMenuItem
              key={b.id}
              onSelect={(e) => {
                e.preventDefault()
                setActiveBroker(b)
              }}
              className="flex cursor-pointer items-start gap-2 py-2"
            >
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{b.name}</span>
                  {b.status === "unofficial" && (
                    <Badge variant="outline" className="h-4 px-1 text-[0.6rem] font-normal">
                      unofficial
                    </Badge>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">{b.tagline}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <BrokerConnectDialog
        broker={activeBroker}
        onClose={() => setActiveBroker(null)}
        onSaved={() => {
          setActiveBroker(null)
          mutate()
        }}
      />
    </>
  )
}

function BrokerConnectDialog({
  broker,
  onClose,
  onSaved,
}: {
  broker: BrokerDefinition | null
  onClose: () => void
  onSaved: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [environment, setEnvironment] = useState<string>("")
  const [label, setLabel] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset on broker change
  if (broker && environment === "" && broker.environments[0]) {
    setEnvironment(broker.environments[0].value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!broker) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/brokers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker: broker.id,
          label: label.trim() || broker.name,
          environment,
          credentials: values,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to connect")
      setValues({})
      setLabel("")
      setEnvironment("")
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={!!broker}
      onOpenChange={(open) => {
        if (!open) {
          setValues({})
          setLabel("")
          setEnvironment("")
          setError(null)
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {broker && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Connect {broker.name}
                {broker.status === "unofficial" && (
                  <Badge variant="outline" className="text-[0.65rem] font-normal">
                    unofficial
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>{broker.tagline}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="broker-label" className="text-xs">
                  Nickname
                </Label>
                <Input
                  id="broker-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={`My ${broker.name} account`}
                />
              </div>

              {broker.environments.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Environment</Label>
                  <div className="flex gap-1 rounded-md border border-border bg-muted p-0.5">
                    {broker.environments.map((env) => (
                      <button
                        key={env.value}
                        type="button"
                        onClick={() => setEnvironment(env.value)}
                        className={
                          "flex-1 rounded px-2 py-1 text-xs font-medium transition-colors " +
                          (environment === env.value
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground")
                        }
                      >
                        {env.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {broker.fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`broker-${field.key}`} className="text-xs">
                    {field.label}
                  </Label>
                  <Input
                    id={`broker-${field.key}`}
                    type={field.type}
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {field.helper && (
                    <p className="text-[0.7rem] text-muted-foreground">{field.helper}</p>
                  )}
                </div>
              ))}

              {broker.notes && (
                <p className="rounded-md border border-border bg-muted/40 p-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                  {broker.notes}
                </p>
              )}

              {error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <DialogFooter className="mt-1 gap-2 sm:justify-between">
                <a
                  href={broker.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Docs <ExternalLink className="h-3 w-3" />
                </a>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                    Connect
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
