export type BrokerId = "alpaca" | "tradier" | "webull" | "robinhood"

export type BrokerField = {
  key: string
  label: string
  type: "text" | "password"
  placeholder?: string
  helper?: string
}

export type BrokerEnvironment = {
  value: string
  label: string
}

export type BrokerDefinition = {
  id: BrokerId
  name: string
  tagline: string
  status: "official" | "unofficial"
  docsUrl: string
  environments: BrokerEnvironment[]
  fields: BrokerField[]
  notes?: string
}

export const BROKERS: BrokerDefinition[] = [
  {
    id: "alpaca",
    name: "Alpaca",
    tagline: "Commission-free stocks & options. Paper trading supported.",
    status: "official",
    docsUrl: "https://alpaca.markets/docs/api-references/trading-api/",
    environments: [
      { value: "paper", label: "Paper" },
      { value: "live", label: "Live" },
    ],
    fields: [
      { key: "key_id", label: "API Key ID", type: "text", placeholder: "PKxxxxxxxxxxxxxxxxxx" },
      { key: "secret_key", label: "API Secret Key", type: "password", placeholder: "••••••••••••••••" },
    ],
  },
  {
    id: "tradier",
    name: "Tradier",
    tagline: "Equities and options via REST API. Sandbox and production.",
    status: "official",
    docsUrl: "https://documentation.tradier.com/brokerage-api",
    environments: [
      { value: "sandbox", label: "Sandbox" },
      { value: "production", label: "Production" },
    ],
    fields: [
      { key: "access_token", label: "Access Token", type: "password", placeholder: "Bearer access token" },
      { key: "account_id", label: "Account ID", type: "text", placeholder: "VA00000000" },
    ],
  },
  {
    id: "webull",
    name: "Webull",
    tagline: "Unofficial API. Use the trade token from a verified device.",
    status: "unofficial",
    docsUrl: "https://github.com/tedchou12/webull",
    environments: [{ value: "live", label: "Live" }],
    fields: [
      { key: "username", label: "Email or Phone", type: "text", placeholder: "you@example.com" },
      { key: "password", label: "Password", type: "password" },
      { key: "trade_pin", label: "Trade PIN", type: "password", placeholder: "6-digit PIN" },
      { key: "device_id", label: "Device ID (optional)", type: "text", placeholder: "Device UUID" },
    ],
    notes:
      "Webull does not publish an official trading API. Connection uses the same flow as the mobile app and may break without notice.",
  },
  {
    id: "robinhood",
    name: "Robinhood",
    tagline: "Unofficial API. Requires MFA. Read-only by default.",
    status: "unofficial",
    docsUrl: "https://robin-stocks.readthedocs.io/en/latest/",
    environments: [{ value: "live", label: "Live" }],
    fields: [
      { key: "username", label: "Username", type: "text" },
      { key: "password", label: "Password", type: "password" },
      { key: "mfa_code", label: "MFA Code (optional)", type: "text", placeholder: "123456" },
    ],
    notes:
      "Robinhood does not publish an official API. Credentials are stored only to refresh access tokens server-side.",
  },
]

export function getBroker(id: string): BrokerDefinition | undefined {
  return BROKERS.find((b) => b.id === id)
}
