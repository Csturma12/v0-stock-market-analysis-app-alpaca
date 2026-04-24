// Thematic hubs — cross-sector investment themes that don't fit cleanly into GICS sectors.
// Each theme has sub-topics (Tavily query targets) and curated tickers.

export type ThemeSubtopic = {
  id: string
  name: string
  query: string // Tavily search terms for this sub-topic
}

export type Theme = {
  id: string
  name: string
  description: string
  accent: "primary" | "bull" | "bear" | "warning" // drives border/glow color
  rootQuery: string // used when "All" sub-topic is selected
  subtopics: ThemeSubtopic[]
  tickers: string[] // curated ticker list driving this theme
}

export const THEMES: Theme[] = [
  {
    id: "ai-industry",
    name: "AI Industry",
    description:
      "Model releases, enterprise deals, funding rounds, AI agents, regulation & policy, China AI, talent moves, and AI infrastructure (GPUs, data centers, cloud capex, power, networking, memory).",
    accent: "primary",
    rootQuery:
      "AI industry news model release enterprise deal funding round AI agent regulation China AI hiring GPU data center cloud capex power memory HBM server",
    subtopics: [
      { id: "models", name: "Model Releases & Benchmarks", query: "AI model release benchmark GPT Claude Gemini Llama open source" },
      { id: "enterprise", name: "Enterprise Deals & Revenue", query: "AI enterprise deal revenue customer contract Microsoft Google AWS Oracle" },
      { id: "funding", name: "Startup Funding Rounds", query: "AI startup funding round seed series A B C valuation venture capital" },
      { id: "agents", name: "AI Agents & Products", query: "AI agent launch autonomous tool use Devin Operator Claude computer use" },
      { id: "regulation", name: "AI Regulation & Policy", query: "AI regulation policy executive order EU AI Act safety act SEC FTC" },
      { id: "china", name: "China AI Developments", query: "China AI DeepSeek Alibaba Baidu Huawei export controls Nvidia chip ban" },
      { id: "talent", name: "AI Hiring & Talent Moves", query: "AI hiring executive researcher talent poach Meta OpenAI Anthropic Google" },
      { id: "gpus", name: "GPU Revenue & Shipments", query: "GPU shipments Nvidia AMD Blackwell H200 revenue guidance backlog" },
      { id: "datacenter", name: "Data Center Permits & Construction", query: "data center construction permit hyperscale AI build-out Stargate" },
      { id: "cloud-capex", name: "Cloud Capex & Guidance", query: "hyperscaler capex AI cloud Microsoft Google Amazon Meta Oracle guidance" },
      { id: "power", name: "Power & Energy for AI", query: "AI data center power energy nuclear small modular reactor grid PPA Constellation Vistra" },
      { id: "memory", name: "Memory Pricing & HBM", query: "HBM memory pricing DRAM Samsung SK Hynix Micron AI" },
    ],
    tickers: [
      "NVDA", "AVGO", "AMD", "TSM", "MU", "SMCI", "ASML", "AMAT", "KLAC", "LRCX", "MRVL",
      "MSFT", "GOOGL", "META", "AMZN", "ORCL", "CRM", "NOW", "PLTR", "SNOW", "CRWD", "NET",
      "VRT", "ETN", "DELL", "ANET", "ARM", "IBM",
      "CEG", "VST", "TLN", "NRG",
    ],
  },
  {
    id: "political-ma",
    name: "Political & M&A Impact",
    description:
      "Policy catalysts that move markets: tariff changes, tax legislation, antitrust rulings, Fed meetings, sanctions, energy rules, plus M&A deal announcements, regulatory approvals, IPO pricings, and executive orders.",
    accent: "warning",
    rootQuery:
      "tariff trade war tax bill antitrust ruling Fed meeting FOMC sanctions geopolitical energy regulation M&A merger acquisition IPO executive order",
    subtopics: [
      { id: "tariffs", name: "Tariff Changes & Trade", query: "tariff trade policy China Mexico Canada EU section 232 section 301 executive order" },
      { id: "tax", name: "Tax Bill & Legislation", query: "tax bill legislation corporate rate capital gains Congress reconciliation" },
      { id: "antitrust", name: "Antitrust Rulings & Actions", query: "antitrust ruling FTC DOJ Google Meta Amazon Apple lawsuit judgment" },
      { id: "fed", name: "Fed Meeting & Market Reaction", query: "Fed FOMC meeting rate decision dot plot Powell press conference inflation" },
      { id: "sanctions", name: "Sanctions & Geopolitical Risk", query: "sanctions Russia Iran China Treasury OFAC export controls geopolitical risk" },
      { id: "energy-rules", name: "Energy & Environmental Rules", query: "EPA energy regulation drilling permit LNG export IRA clean energy rollback" },
      { id: "ma-deals", name: "M&A Deals Announced", query: "merger acquisition deal announcement takeover bid private equity LBO" },
      { id: "ma-approvals", name: "M&A Regulatory Approvals", query: "merger approval DOJ FTC antitrust clearance conditional remedies blocked" },
      { id: "ipo", name: "IPO Pricings & Filings", query: "IPO pricing filing S-1 direct listing roadshow first day pop" },
      { id: "executive-orders", name: "Executive Orders & Policy", query: "executive order White House presidential policy memorandum national emergency" },
    ],
    tickers: [
      // Tariff-sensitive / trade exposure
      "AAPL", "TSLA", "NKE", "DE", "CAT", "GM", "F", "BA",
      // M&A / PE
      "BLK", "KKR", "APO", "BX", "ARES",
      // Financials / fed-sensitive
      "JPM", "BAC", "GS", "MS", "WFC", "C",
      // Energy / policy-sensitive
      "XOM", "CVX", "OXY", "LNG", "KMI",
      // Mega-cap antitrust targets
      "GOOGL", "META", "AMZN", "MSFT",
    ],
  },
]

export function getTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id)
}

export function getThemeSubtopic(themeId: string, subId: string) {
  const theme = getTheme(themeId)
  if (!theme) return undefined
  return theme.subtopics.find((s) => s.id === subId)
}
