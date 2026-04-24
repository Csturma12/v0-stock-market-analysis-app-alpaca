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
  {
    id: "ai-infrastructure",
    name: "AI Infrastructure",
    description:
      "GPU shipments, data center permits, cloud capex guidance, power & energy deals for AI, networking orders & backlog, memory pricing & HBM, server orders, AI infra IPOs.",
    accent: "primary",
    rootQuery:
      "GPU shipments data center construction cloud capex power energy AI networking memory HBM server orders AI infrastructure IPO",
    subtopics: [
      { id: "gpus", name: "GPU Revenue & Shipments", query: "GPU revenue shipments Nvidia AMD Blackwell H200 H100 supply demand backlog" },
      { id: "datacenter", name: "Data Center Permits & Construction", query: "data center construction permits hyperscale Stargate Microsoft Google Amazon Meta build-out" },
      { id: "cloud-capex", name: "Cloud Capex & Guidance", query: "cloud capex guidance Microsoft Azure Google Cloud AWS Amazon Meta hyperscaler spending" },
      { id: "power-energy", name: "Power & Energy Deals for AI", query: "AI data center power energy PPA nuclear SMR Constellation Vistra NRG grid agreement" },
      { id: "networking", name: "Networking Orders & Backlog", query: "AI networking InfiniBand Ethernet Arista Broadcom Juniper backlog order" },
      { id: "memory-hbm", name: "Memory Pricing & HBM", query: "HBM memory pricing DRAM Samsung SK Hynix Micron AI high bandwidth memory" },
      { id: "servers", name: "Server Orders & Backlog", query: "AI server orders backlog Dell SMCI Lenovo HPE shipments rack unit" },
      { id: "ipos", name: "AI Infra IPOs & Emerging", query: "AI infrastructure IPO emerging company filing listing CoreWeave Lambda Crusoe" },
    ],
    tickers: [
      "NVDA", "AMD", "AVGO", "MRVL", "ANET", "ARM", "MU", "SMCI", "DELL", "HPE",
      "TSM", "ASML", "AMAT", "KLAC", "LRCX", "INTC",
      "VRT", "ETN", "EATON", "CEG", "VST", "TLN", "NRG",
      "GOOGL", "MSFT", "AMZN", "META", "ORCL",
    ],
  },
  {
    id: "banking-finance",
    name: "Banking & Finance",
    description:
      "Bank earnings & NII, regional bank health, insurance results, consumer credit data, Fed rate decisions, private equity & M&A, fintech metrics, Bitcoin price & flows, crypto regulation.",
    accent: "bull",
    rootQuery:
      "bank earnings NII net interest income regional bank insurance consumer credit Fed rate decision private equity M&A fintech Bitcoin crypto regulation",
    subtopics: [
      { id: "big-banks", name: "Big Bank Earnings & NII", query: "JPMorgan Goldman Sachs Morgan Stanley Bank of America Citigroup Wells Fargo earnings NII net interest income" },
      { id: "regional", name: "Regional Bank Health", query: "regional bank earnings deposits loan growth credit quality commercial real estate exposure" },
      { id: "insurance", name: "Insurance Results & Losses", query: "insurance earnings combined ratio catastrophe losses underwriting AIG Travelers Hartford Chubb" },
      { id: "credit", name: "Consumer Credit Data", query: "consumer credit card delinquency charge-off auto loan student loan CFPB report" },
      { id: "fed", name: "Fed Rate Decision & Outlook", query: "Federal Reserve FOMC rate decision dot plot Powell inflation employment forward guidance" },
      { id: "pe-ma", name: "Private Equity & M&A Deals", query: "private equity buyout LBO deal announcement KKR Blackstone Apollo Carlyle Ares fundraise" },
      { id: "fintech", name: "Fintech Metrics & Growth", query: "fintech payments volume Visa Mastercard PayPal Stripe Affirm Block revenue GMV growth" },
      { id: "bitcoin", name: "Bitcoin Price & Flows", query: "Bitcoin price ETF inflows outflows MicroStrategy Coinbase spot BTC fund flows" },
      { id: "crypto-reg", name: "Crypto Regulation & Policy", query: "crypto regulation SEC CFTC stablecoin bill digital asset policy enforcement action" },
    ],
    tickers: [
      "JPM", "BAC", "GS", "MS", "WFC", "C", "BLK", "SCHW",
      "KKR", "APO", "BX", "ARES", "CG",
      "V", "MA", "PYPL", "SQ", "COIN", "AFRM",
      "AIG", "TRV", "HIG", "CB",
    ],
  },
  {
    id: "defense-government",
    name: "Defense & Government",
    description:
      "Major contract awards, defense budget & spending, space launch & contracts, drone & UAV programs, cyber & IT contracts, naval programs, foreign military sales, military AI & autonomy.",
    accent: "bear",
    rootQuery:
      "defense contract award budget spending space launch drone UAV cyber IT naval foreign military sales AI autonomy weapons Pentagon",
    subtopics: [
      { id: "contracts", name: "Major Contract Awards", query: "defense contract award Pentagon DoD Raytheon Lockheed Northrop Boeing General Dynamics IDIQ" },
      { id: "budget", name: "Defense Budget & Spending", query: "defense budget NDAA appropriations Pentagon spending continuing resolution supplemental" },
      { id: "space", name: "Space Launch & Contracts", query: "space launch contract SpaceX ULA Rocket Lab Blue Origin NASA NRO DoD satellite" },
      { id: "drone-uav", name: "Drone & UAV Programs", query: "drone UAV uncrewed aerial system contract AeroVironment Shield AI Kratos Joby" },
      { id: "cyber", name: "Cyber & IT Contracts", query: "cyber IT defense contract CISA NSA DoD cloud DISA Microsoft Palantir Leidos SAIC" },
      { id: "naval", name: "Naval Programs & Ships", query: "naval contract ship submarine destroyer Huntington Ingalls General Dynamics Bath Iron Works" },
      { id: "fms", name: "Foreign Military Sales", query: "foreign military sales FMS DSCA notification jets missiles Ukraine Israel Taiwan" },
      { id: "mil-ai", name: "Military AI & Autonomy", query: "military AI autonomous weapons JADC2 Palantir Shield AI Anduril defense technology contract" },
    ],
    tickers: [
      "LMT", "RTX", "NOC", "GD", "BA", "HII", "LHX", "LDOS", "SAIC", "CACI",
      "KTOS", "AVAV", "RKLB", "SPCE", "PLTR", "ANDURIL",
      "MSFT", "AMZN", "GOOG",
    ],
  },
  {
    id: "energy-industrials",
    name: "Energy & Industrials",
    description:
      "Oil major earnings, rig counts & drilling activity, LNG & natural gas contracts, crude oil & gas prices, utility rate cases, nuclear restart & uranium, renewable project awards, mining output, steel & aluminum pricing, freight & trucking, construction & infrastructure, industrial orders & PMI.",
    accent: "warning",
    rootQuery:
      "oil earnings rig count drilling LNG natural gas crude prices utility nuclear uranium renewable mining steel aluminum freight trucking construction infrastructure PMI industrial orders",
    subtopics: [
      { id: "oil-earnings", name: "Oil Major Earnings & Dividends", query: "ExxonMobil Chevron Shell BP TotalEnergies ConocoPhillips oil earnings dividend buyback" },
      { id: "rig-count", name: "Rig Count & Drilling Activity", query: "Baker Hughes rig count drilling activity Permian Eagle Ford shale oilfield services" },
      { id: "lng", name: "LNG & Natural Gas Contracts", query: "LNG natural gas contract export terminal Cheniere Venture Global Sempra Energy Transfer" },
      { id: "crude-prices", name: "Crude Oil & Gas Prices", query: "crude oil WTI Brent OPEC production cut price forecast natural gas Henry Hub" },
      { id: "utilities", name: "Utility Rate Cases & Earnings", query: "utility rate case earnings NextEra Duke Southern Dominion AES Evergy grid investment" },
      { id: "nuclear", name: "Nuclear Restart & Uranium", query: "nuclear restart uranium price Cameco Kazatomprom SMR Constellation Vistra Three Mile Island" },
      { id: "renewables", name: "Renewable Project Awards", query: "renewable energy solar wind project award PPA contract Nextracker First Solar Vestas Ørsted" },
      { id: "mining", name: "Mining Production & Prices", query: "mining production copper gold iron ore lithium Freeport BHP Rio Tinto Vale Anglo American" },
      { id: "steel-aluminum", name: "Steel & Aluminum Pricing", query: "steel aluminum pricing tariff Nucor Steel Dynamics Cleveland-Cliffs Alcoa Century Aluminum" },
      { id: "freight", name: "Freight & Trucking Data", query: "freight volume trucking spot rate Cass Freight Index J.B. Hunt Werner Old Dominion XPO" },
      { id: "construction", name: "Construction & Infrastructure", query: "construction spending infrastructure Caterpillar Vulcan Materials Martin Marietta Granite Fluor" },
      { id: "pmi", name: "Industrial Orders & PMI", query: "ISM PMI industrial orders manufacturing durable goods capex Honeywell Emerson Parker Hannifin" },
    ],
    tickers: [
      "XOM", "CVX", "OXY", "COP", "SLB", "HAL", "BKR",
      "LNG", "ET", "KMI", "WMB", "OKE",
      "NEE", "DUK", "SO", "D", "AES", "VST", "CEG",
      "CCJ", "CAM", "FCX", "NEM", "AA", "NUE", "STLD",
      "CAT", "DE", "HON", "EMR", "PH", "GNRC",
      "JBHT", "ODFL", "XPO", "UPS", "FDX",
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate & REITs",
    description:
      "REIT earnings & FFO, office vacancy & distress, housing starts & sales data, mortgage rate movement, data center leasing demand, industrial & logistics REITs, retail REIT traffic & leasing.",
    accent: "bull",
    rootQuery:
      "REIT earnings FFO office vacancy housing starts mortgage rate data center leasing industrial logistics retail REIT real estate",
    subtopics: [
      { id: "reit-earnings", name: "REIT Earnings & FFO", query: "REIT earnings FFO AFFO funds from operations Prologis Realty Income Welltower Equity Residential" },
      { id: "office", name: "Office Vacancy & Distress", query: "office vacancy distress sublease default loan extension return to office CBRE JLL SL Green Vornado" },
      { id: "housing-starts", name: "Housing Starts & Sales Data", query: "housing starts existing home sales new home sales inventory pending sales D.R. Horton Lennar" },
      { id: "mortgage-rates", name: "Mortgage Rate Movement", query: "mortgage rate 30 year fixed refinance applications MBA Fannie Mae Freddie Mac Fed housing" },
      { id: "datacenter-leasing", name: "Data Center Leasing Demand", query: "data center leasing demand AI Digital Realty Equinix Iron Mountain colocation hyperscale" },
      { id: "industrial-logistics", name: "Industrial & Logistics REITs", query: "industrial logistics REIT Prologis Duke Realty STAG Rexford vacancy rent growth e-commerce" },
      { id: "retail-reit", name: "Retail REIT Traffic & Leasing", query: "retail REIT traffic leasing Simon Property Regency Centers Kimco Brixmor occupancy tenant" },
    ],
    tickers: [
      "PLD", "EQIX", "DLR", "WELL", "SPG", "O", "AMT", "CCI",
      "AVB", "EQR", "MAA", "UDR", "VNO", "SLG", "BXP",
      "KIM", "REG", "SITC", "BRX",
      "DHI", "LEN", "NVR", "TOL", "PHM",
      "STAG", "REXR", "FR", "TRNO",
    ],
  },
  {
    id: "consumer-retail",
    name: "Consumer & Retail",
    description:
      "Retail earnings & comps, luxury & apparel sales, restaurant & food earnings, CPG volumes & pricing, auto sales & EV data, consumer confidence index, travel & airline bookings.",
    accent: "bull",
    rootQuery:
      "retail earnings same-store sales comps luxury apparel restaurant food CPG consumer auto EV sales confidence travel airline booking",
    subtopics: [
      { id: "retail-earnings", name: "Retail Earnings & Comps", query: "retail earnings same-store sales comps Walmart Target Costco Home Depot Lowe's TJX Dollar General" },
      { id: "luxury-apparel", name: "Luxury & Apparel Sales", query: "luxury apparel sales LVMH Kering Hermès Tapestry Capri Ralph Lauren PVH Moncler" },
      { id: "restaurant", name: "Restaurant & Food Earnings", query: "restaurant earnings comps traffic McDonald's Starbucks Chipotle Darden Yum Brands Domino's" },
      { id: "cpg", name: "CPG Volumes & Pricing", query: "CPG consumer goods volume pricing elasticity P&G Unilever Nestlé Kraft Heinz Mondelez Colgate" },
      { id: "auto-ev", name: "Auto Sales & EV Data", query: "auto sales EV electric vehicle Tesla GM Ford Rivian Stellantis channel inventory incentive" },
      { id: "confidence", name: "Consumer Confidence Index", query: "consumer confidence sentiment University of Michigan Conference Board spending outlook survey" },
      { id: "travel", name: "Travel & Airline Bookings", query: "airline bookings travel demand Delta United American Southwest Marriott Hilton Airbnb booking.com" },
    ],
    tickers: [
      "WMT", "TGT", "COST", "HD", "LOW", "TJX", "DG", "DLTR", "AMZN",
      "MCD", "SBUX", "CMG", "DRI", "YUM", "DPZ",
      "PG", "UL", "MDLZ", "KHC", "CL", "KO", "PEP",
      "TSLA", "GM", "F", "RIVN",
      "DAL", "UAL", "AAL", "LUV", "MAR", "HLT", "ABNB", "BKNG",
      "RL", "PVH", "TPR",
    ],
  },
  {
    id: "healthcare-biopharma",
    name: "Healthcare & BioPharma",
    description:
      "Pharma earnings & drug sales, FDA approvals & PDUFA dates, clinical trial results, GLP-1 prescriptions & sales, medical device approvals, oncology pipeline & deals, CDMO & manufacturing orders, biotech M&A & licensing.",
    accent: "primary",
    rootQuery:
      "pharma earnings drug sales FDA approval PDUFA clinical trial GLP-1 medical device oncology pipeline CDMO biotech M&A licensing",
    subtopics: [
      { id: "pharma-earnings", name: "Pharma Earnings & Drug Sales", query: "pharma earnings drug sales Pfizer J&J AbbVie Merck Bristol-Myers Eli Lilly AstraZeneca Roche" },
      { id: "fda", name: "FDA Approvals & PDUFA Dates", query: "FDA approval PDUFA date NDA BLA new drug application biosimilar priority review accelerated" },
      { id: "clinical-trials", name: "Clinical Trial Results", query: "clinical trial results phase 2 phase 3 efficacy readout ASCO ESMO ASH data top-line" },
      { id: "glp1", name: "GLP-1 Prescriptions & Sales", query: "GLP-1 Ozempic Wegovy Mounjaro Zepbound semaglutide tirzepatide obesity diabetes prescription demand supply" },
      { id: "med-devices", name: "Medical Device Approvals", query: "medical device FDA approval 510k PMA Medtronic Abbott Boston Scientific Edwards Intuitive Surgical" },
      { id: "oncology", name: "Oncology Pipeline & Deals", query: "oncology pipeline cancer drug deal licensing acquisition Keytruda Opdivo ADC checkpoint inhibitor" },
      { id: "cdmo", name: "CDMO & Manufacturing Orders", query: "CDMO contract manufacturing Lonza Catalent Samsung Biologics Wuxi Biologics order win capacity" },
      { id: "biotech-ma", name: "Biotech M&A & Licensing", query: "biotech acquisition licensing deal buyout Pfizer AbbVie Merck Amgen Biogen target premium" },
    ],
    tickers: [
      "LLY", "NVO", "JNJ", "ABBV", "MRK", "PFE", "BMY", "AZN", "RHHBY", "GILD", "BIIB", "AMGN", "REGN", "VRTX",
      "MDT", "ABT", "BSX", "EW", "ISRG", "SYK", "ZBH",
      "CTLT", "CDMO", "LCII",
      "SRPT", "MRNA", "BNTX", "INCY",
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
