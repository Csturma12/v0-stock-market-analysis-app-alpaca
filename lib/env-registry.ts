import "server-only"

export type EnvProviderStatus = {
  id: string
  label: string
  configured: boolean
  required: string[]
  missing: string[]
  optional?: string[]
}

const providers = [
  {
    id: "webull",
    label: "Webull",
    required: ["WEBULL_APP_KEY", "WEBULL_APP_SECRET", "WEBULL_ACCESS_TOKEN", "WEBULL_ENVIRONMENT"],
    optional: ["WEBULL_ACCOUNT_ID", "WEBULL_HOST"],
  },
  {
    id: "alpaca",
    label: "Alpaca",
    requiredAny: [
      ["ALPACA_API_KEY_ID", "ALPACA_API_SECRET_KEY"],
      ["ALPACA_API_KEY", "ALPACA_SECRET_API_KEY"],
    ],
    optional: ["ALPACA_PAPER_BASE_URL"],
  },
  {
    id: "tradier",
    label: "Tradier",
    required: ["TRADIER_ACCOUNT_ID", "TRADIER_API_KEY"],
    optional: ["TRADIER_SANDBOX"],
  },
  {
    id: "polygon",
    label: "Polygon",
    requiredAny: [["POLYGON_API_KEY"], ["POLYGON_KEY"]],
    optional: ["POLYGON_BASE_URL"],
  },
  {
    id: "finnhub",
    label: "Finnhub",
    requiredAny: [["FINNHUB_API_KEY"], ["FINNHUB_KEY"]],
  },
  {
    id: "unusual-whales",
    label: "Unusual Whales",
    requiredAny: [["UNUSUAL_WHALES_API_KEY"], ["UNUSUAL_WHALES_KEY"]],
  },
  {
    id: "flashalpha",
    label: "FlashAlpha",
    requiredAny: [["FLASHALPHA_API_KEY"], ["FLASH_ALPHA_API_KEY"]],
  },
  {
    id: "tavily",
    label: "Tavily",
    requiredAny: [["TAVILY_API_KEY"], ["TAVILY_KEY"]],
  },
  {
    id: "openai",
    label: "OpenAI",
    required: ["OPENAI_API_KEY"],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    required: ["ANTHROPIC_KEY"],
  },
  {
    id: "supabase",
    label: "Supabase",
    required: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    optional: ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
  },
] as const

function isPresent(name: string) {
  return Boolean(process.env[name])
}

function statusForProvider(provider: (typeof providers)[number]): EnvProviderStatus {
  if ("requiredAny" in provider) {
    const validSet = provider.requiredAny.find((set) => set.every(isPresent))
    const preferredSet = provider.requiredAny[0]
    const missing = validSet ? [] : preferredSet.filter((name) => !isPresent(name))

    return {
      id: provider.id,
      label: provider.label,
      configured: Boolean(validSet),
      required: validSet ?? preferredSet,
      missing,
      optional: provider.optional ? [...provider.optional] : undefined,
    }
  }

  const missing = provider.required.filter((name) => !isPresent(name))

  return {
    id: provider.id,
    label: provider.label,
    configured: missing.length === 0,
    required: [...provider.required],
    missing,
    optional: provider.optional ? [...provider.optional] : undefined,
  }
}

export function getProviderStatuses() {
  return providers.map(statusForProvider)
}
