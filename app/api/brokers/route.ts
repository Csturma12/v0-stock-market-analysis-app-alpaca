import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { BROKERS, getBroker, type BrokerId } from "@/lib/brokers"

export const dynamic = "force-dynamic"

type BrokerConnectionRow = {
  id: string
  broker: string
  label: string | null
  environment: string
  status: string
  metadata: Record<string, unknown>
  last_verified_at: string | null
  created_at: string
  updated_at: string
}

// Sanitize: never return raw credentials to the client.
function sanitize(row: BrokerConnectionRow) {
  return {
    id: row.id,
    broker: row.broker as BrokerId,
    label: row.label,
    environment: row.environment,
    status: row.status,
    metadata: row.metadata,
    last_verified_at: row.last_verified_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("broker_connections")
    .select("id, broker, label, environment, status, metadata, last_verified_at, created_at, updated_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ connections: (data ?? []).map(sanitize) })
}

export async function POST(req: Request) {
  let body: {
    broker?: string
    label?: string
    environment?: string
    credentials?: Record<string, string>
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const def = getBroker(body.broker ?? "")
  if (!def) {
    return NextResponse.json({ error: "Unknown broker" }, { status: 400 })
  }

  const credentials = body.credentials ?? {}
  const requiredFields = def.fields.filter((f) => !f.label.toLowerCase().includes("optional"))
  for (const field of requiredFields) {
    if (!credentials[field.key] || String(credentials[field.key]).trim() === "") {
      return NextResponse.json(
        { error: `Missing required field: ${field.label}` },
        { status: 400 },
      )
    }
  }

  const environment = body.environment ?? def.environments[0]?.value ?? "live"
  if (!def.environments.some((e) => e.value === environment)) {
    return NextResponse.json({ error: "Invalid environment for broker" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("broker_connections")
    .upsert(
      {
        broker: def.id,
        label: body.label?.trim() || def.name,
        environment,
        status: "connected",
        credentials,
        metadata: { kind: def.status },
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "broker,label" },
    )
    .select("id, broker, label, environment, status, metadata, last_verified_at, created_at, updated_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ connection: sanitize(data as BrokerConnectionRow) })
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }
  const supabase = await createClient()
  const { error } = await supabase.from("broker_connections").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export function _allBrokers() {
  // tiny helper export so this module's BROKERS import isn't tree-shaken in dev
  return BROKERS
}
