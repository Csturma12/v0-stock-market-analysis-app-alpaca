// GICS 11 Sectors with sector ETFs (State Street SPDR) for price tracking,
// sub-industries, and trending tickers (top names by market cap / activity).

export type SubIndustry = {
  id: string
  name: string
  tickers: string[]
}

export type Sector = {
  id: string
  name: string
  etf: string // SPDR sector ETF for tracking performance
  description: string
  subIndustries: SubIndustry[]
}

export const SECTORS: Sector[] = [
  {
    id: "technology",
    name: "Technology",
    etf: "XLK",
    description: "Software, hardware, semiconductors, IT services, and internet platforms.",
    subIndustries: [
      {
        id: "semiconductors",
        name: "Semiconductors",
        tickers: ["NVDA", "AVGO", "AMD", "TSM", "INTC", "QCOM", "MU", "AMAT", "LRCX", "KLAC", "ASML", "MRVL", "ON", "ADI", "TXN"],
      },
      {
        id: "software",
        name: "Software & Cloud",
        tickers: ["MSFT", "ORCL", "CRM", "ADBE", "NOW", "INTU", "PLTR", "SNOW", "DDOG", "CRWD", "PANW", "FTNT", "NET", "MDB", "TEAM"],
      },
      {
        id: "internet",
        name: "Internet & Platforms",
        tickers: ["GOOGL", "META", "NFLX", "SPOT", "PINS", "SNAP", "RBLX", "DASH", "UBER", "ABNB"],
      },
      {
        id: "hardware",
        name: "Hardware & Devices",
        tickers: ["AAPL", "DELL", "HPQ", "ANET", "CSCO", "JNPR", "LOGI", "SMCI"],
      },
      {
        id: "it-services",
        name: "IT Services",
        tickers: ["ACN", "IBM", "INFY", "CTSH", "WIT", "EPAM", "GLOB"],
      },
    ],
  },
  {
    id: "health-care",
    name: "Health Care",
    etf: "XLV",
    description: "Pharma, biotech, medical devices, insurers, and health services.",
    subIndustries: [
      {
        id: "pharma",
        name: "Pharmaceuticals",
        tickers: ["LLY", "JNJ", "MRK", "PFE", "ABBV", "BMY", "NVS", "AZN", "GSK", "SNY"],
      },
      {
        id: "biotech",
        name: "Biotech",
        tickers: ["VRTX", "REGN", "AMGN", "GILD", "BIIB", "MRNA", "BNTX", "INCY", "CRSP", "BEAM"],
      },
      {
        id: "med-devices",
        name: "Medical Devices",
        tickers: ["ABT", "TMO", "DHR", "MDT", "SYK", "BDX", "ISRG", "BSX", "EW", "ZBH"],
      },
      {
        id: "insurers",
        name: "Health Insurers",
        tickers: ["UNH", "ELV", "CI", "HUM", "CVS", "CNC", "MOH"],
      },
      {
        id: "glp1",
        name: "GLP-1 / Obesity",
        tickers: ["LLY", "NVO", "AMGN", "VKTX", "ALT", "STRC"],
      },
    ],
  },
  {
    id: "financials",
    name: "Financials",
    etf: "XLF",
    description: "Banks, insurers, asset managers, exchanges, and fintech.",
    subIndustries: [
      {
        id: "big-banks",
        name: "Money Center Banks",
        tickers: ["JPM", "BAC", "WFC", "C", "GS", "MS", "USB", "PNC", "TFC", "COF"],
      },
      {
        id: "asset-mgmt",
        name: "Asset Management",
        tickers: ["BLK", "BX", "KKR", "APO", "ARES", "TROW", "BEN", "IVZ", "LAZ"],
      },
      {
        id: "exchanges",
        name: "Exchanges & Data",
        tickers: ["ICE", "CME", "NDAQ", "CBOE", "MSCI", "SPGI", "MCO"],
      },
      {
        id: "insurance",
        name: "Insurance",
        tickers: ["BRK.B", "PGR", "TRV", "ALL", "AIG", "MET", "PRU", "CB"],
      },
      {
        id: "fintech",
        name: "Fintech & Payments",
        tickers: ["V", "MA", "PYPL", "SQ", "FIS", "FISV", "COIN", "HOOD", "SOFI", "AFRM"],
      },
    ],
  },
  {
    id: "consumer-discretionary",
    name: "Consumer Discretionary",
    etf: "XLY",
    description: "Retail, autos, travel, restaurants, and luxury goods.",
    subIndustries: [
      {
        id: "ecommerce",
        name: "E-commerce & Retail",
        tickers: ["AMZN", "MELI", "SHOP", "EBAY", "ETSY", "W", "CHWY", "PDD", "BABA", "JD"],
      },
      {
        id: "autos-ev",
        name: "Autos & EVs",
        tickers: ["TSLA", "RIVN", "LCID", "F", "GM", "TM", "HMC", "STLA", "NIO", "XPEV", "LI"],
      },
      {
        id: "restaurants",
        name: "Restaurants",
        tickers: ["MCD", "SBUX", "CMG", "YUM", "DPZ", "QSR", "WEN", "BROS", "CAVA"],
      },
      {
        id: "travel",
        name: "Travel & Leisure",
        tickers: ["BKNG", "ABNB", "MAR", "HLT", "RCL", "CCL", "NCLH", "DAL", "UAL", "AAL", "LUV"],
      },
      {
        id: "apparel",
        name: "Apparel & Luxury",
        tickers: ["NKE", "LULU", "TJX", "ROST", "DECK", "ONON", "CROX", "VFC", "RL"],
      },
    ],
  },
  {
    id: "communication-services",
    name: "Communication Services",
    etf: "XLC",
    description: "Telecom, media, entertainment, and social platforms.",
    subIndustries: [
      {
        id: "telecom",
        name: "Telecom",
        tickers: ["T", "VZ", "TMUS", "CHTR", "CMCSA", "LUMN"],
      },
      {
        id: "media",
        name: "Media & Entertainment",
        tickers: ["DIS", "NFLX", "WBD", "PARA", "FOX", "FOXA", "LYV", "EA", "TTWO", "RBLX"],
      },
      {
        id: "advertising",
        name: "Advertising & Marketing",
        tickers: ["GOOGL", "META", "TTD", "OMC", "IPG", "WPP", "PUBGY"],
      },
    ],
  },
  {
    id: "industrials",
    name: "Industrials",
    etf: "XLI",
    description: "Aerospace, defense, machinery, transports, and construction.",
    subIndustries: [
      {
        id: "aerospace-defense",
        name: "Aerospace & Defense",
        tickers: ["BA", "LMT", "RTX", "NOC", "GD", "LHX", "TDG", "HEI", "HWM", "TXT"],
      },
      {
        id: "machinery",
        name: "Machinery & Equipment",
        tickers: ["CAT", "DE", "CMI", "PCAR", "ETN", "ITW", "EMR", "ROK", "DOV"],
      },
      {
        id: "transports",
        name: "Rails, Trucks & Logistics",
        tickers: ["UNP", "CSX", "NSC", "UPS", "FDX", "ODFL", "XPO", "JBHT", "CHRW"],
      },
      {
        id: "airlines",
        name: "Airlines",
        tickers: ["DAL", "UAL", "AAL", "LUV", "ALK", "JBLU"],
      },
      {
        id: "construction",
        name: "Construction & Engineering",
        tickers: ["CAT", "URI", "PWR", "FLR", "J", "MAS", "VMC", "MLM"],
      },
    ],
  },
  {
    id: "consumer-staples",
    name: "Consumer Staples",
    etf: "XLP",
    description: "Food, beverages, household products, and mass retail.",
    subIndustries: [
      {
        id: "beverages",
        name: "Beverages",
        tickers: ["KO", "PEP", "MNST", "KDP", "STZ", "BF.B", "TAP"],
      },
      {
        id: "food",
        name: "Packaged Food",
        tickers: ["MDLZ", "GIS", "K", "HSY", "CAG", "SJM", "CPB", "HRL", "TSN"],
      },
      {
        id: "household",
        name: "Household & Personal",
        tickers: ["PG", "CL", "KMB", "CHD", "CLX", "EL", "UL"],
      },
      {
        id: "mass-retail",
        name: "Mass Retail",
        tickers: ["WMT", "COST", "TGT", "DG", "DLTR", "KR", "BJ"],
      },
      {
        id: "tobacco",
        name: "Tobacco",
        tickers: ["PM", "MO", "BTI"],
      },
    ],
  },
  {
    id: "energy",
    name: "Energy",
    etf: "XLE",
    description: "Oil & gas producers, refiners, pipelines, and services.",
    subIndustries: [
      {
        id: "integrated",
        name: "Integrated Oil & Gas",
        tickers: ["XOM", "CVX", "SHEL", "BP", "TTE", "EQNR"],
      },
      {
        id: "ep",
        name: "Exploration & Production",
        tickers: ["COP", "EOG", "PXD", "OXY", "HES", "FANG", "DVN", "MRO", "APA"],
      },
      {
        id: "services",
        name: "Oilfield Services",
        tickers: ["SLB", "HAL", "BKR", "FTI", "NOV", "WFRD"],
      },
      {
        id: "midstream",
        name: "Midstream & Pipelines",
        tickers: ["KMI", "WMB", "OKE", "ET", "EPD", "MPLX", "LNG"],
      },
      {
        id: "refiners",
        name: "Refiners",
        tickers: ["MPC", "VLO", "PSX", "DK", "PBF"],
      },
    ],
  },
  {
    id: "utilities",
    name: "Utilities",
    etf: "XLU",
    description: "Electric, gas, water utilities, and renewables.",
    subIndustries: [
      {
        id: "electric",
        name: "Electric Utilities",
        tickers: ["NEE", "DUK", "SO", "AEP", "D", "EXC", "XEL", "PCG", "EIX", "SRE"],
      },
      {
        id: "renewables",
        name: "Renewables",
        tickers: ["NEE", "BEP", "AES", "CWEN", "ED", "ORA"],
      },
      {
        id: "gas-water",
        name: "Gas & Water",
        tickers: ["AWK", "WTRG", "ATO", "CNP", "WEC"],
      },
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    etf: "XLRE",
    description: "REITs across residential, commercial, industrial, and data centers.",
    subIndustries: [
      {
        id: "data-center",
        name: "Data Center REITs",
        tickers: ["EQIX", "DLR", "IRM"],
      },
      {
        id: "industrial",
        name: "Industrial REITs",
        tickers: ["PLD", "EXR", "PSA", "STAG", "REXR"],
      },
      {
        id: "residential",
        name: "Residential REITs",
        tickers: ["AVB", "EQR", "INVH", "MAA", "UDR", "ESS", "AMH"],
      },
      {
        id: "retail-reits",
        name: "Retail & Net Lease",
        tickers: ["SPG", "O", "REG", "KIM", "FRT", "NNN", "WPC"],
      },
      {
        id: "telco-reits",
        name: "Tower & Infrastructure",
        tickers: ["AMT", "CCI", "SBAC"],
      },
    ],
  },
  {
    id: "materials",
    name: "Materials",
    etf: "XLB",
    description: "Chemicals, metals, mining, construction materials, and packaging.",
    subIndustries: [
      {
        id: "chemicals",
        name: "Chemicals",
        tickers: ["LIN", "SHW", "APD", "ECL", "DD", "DOW", "LYB", "PPG", "FMC", "CE"],
      },
      {
        id: "metals-mining",
        name: "Metals & Mining",
        tickers: ["FCX", "NEM", "GOLD", "AA", "STLD", "NUE", "X", "CLF", "VALE", "RIO", "BHP"],
      },
      {
        id: "building",
        name: "Construction Materials",
        tickers: ["VMC", "MLM", "EXP", "SUM", "CX"],
      },
      {
        id: "packaging",
        name: "Packaging",
        tickers: ["IP", "PKG", "WRK", "BALL", "CCK", "SLGN", "AMCR"],
      },
    ],
  },
]

export function getSector(id: string): Sector | undefined {
  return SECTORS.find((s) => s.id === id)
}

export function getSubIndustry(sectorId: string, subId: string) {
  const sector = getSector(sectorId)
  if (!sector) return undefined
  return { sector, sub: sector.subIndustries.find((s) => s.id === subId) }
}

export const ALL_ETFS = SECTORS.map((s) => s.etf)
