import { NextResponse } from "next/server"

import { getProviderStatuses } from "@/lib/env-registry"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const providers = getProviderStatuses()

  return NextResponse.json({
    ok: providers.every((provider) => provider.configured),
    providers,
  })
}
