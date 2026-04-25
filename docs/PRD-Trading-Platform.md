# Product Requirements Document (PRD)
## Subscription-Based AI Trading Platform

**Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Product Vision
Build a comprehensive, subscription-based AI trading platform that democratizes institutional-grade trading tools for retail investors. The platform combines autonomous and manual trading capabilities with real-time market intelligence, AI-powered signals, and an intuitive interface accessible across all devices.

### 1.2 Current State (Already Built)
The platform already has a robust foundation:
- **Market Intelligence Hub** — 11 GICS sectors, cross-cutting themes, sub-industry drill-down
- **Ticker Analysis** — Charts, technicals, fundamentals, dark pool activity, options flow, patterns
- **Dual AI Trade Ideas** — Claude + OpenAI parallel generation for stocks and options
- **Paper Trading** — Alpaca integration for positions, orders, and execution
- **Real-time Data** — Polygon, Finnhub, Unusual Whales integrations
- **Learning Memory** — Supabase-backed trade outcome tracking for AI improvement
- **Pattern Detection** — Autonomous watchlist with technical pattern scanning

### 1.3 Target Audience
| Tier | User Profile | Primary Needs |
|------|-------------|---------------|
| **Free** | Curious retail investors | Market overview, basic research |
| **Starter ($19/mo)** | Active traders | Full analysis, manual trading, limited AI |
| **Pro ($49/mo)** | Serious traders | Unlimited AI, real-time signals, autonomous mode |
| **Elite ($149/mo)** | Professional traders | White-glove features, priority execution, API access |

---

## 2. Core Features

### 2.1 Feature Matrix by Subscription Tier

| Feature | Free | Starter | Pro | Elite |
|---------|------|---------|-----|-------|
| Market overview & sectors | ✓ | ✓ | ✓ | ✓ |
| Basic ticker analysis | ✓ | ✓ | ✓ | ✓ |
| Real-time quotes | 15-min delay | ✓ | ✓ | ✓ |
| Watchlist | 5 tickers | 25 tickers | Unlimited | Unlimited |
| AI Trade Ideas (Claude) | 3/day | 20/day | Unlimited | Unlimited |
| AI Trade Ideas (OpenAI) | — | 10/day | Unlimited | Unlimited |
| Options AI Plays | — | 5/day | Unlimited | Unlimited |
| Dark Pool Activity | — | ✓ | ✓ | ✓ |
| Options Flow | — | ✓ | ✓ | ✓ |
| Pattern Detection | — | Basic | Advanced | Advanced + Custom |
| Paper Trading | — | ✓ | ✓ | ✓ |
| Autonomous Trading | — | — | ✓ | ✓ |
| Real-time Alerts | — | Email only | Push + SMS | Priority + Webhook |
| Learning Memory | — | — | ✓ | ✓ |
| API Access | — | — | — | ✓ |
| Dedicated Support | — | — | — | ✓ |

### 2.2 Existing Features (Implemented)

#### 2.2.1 Market Intelligence Dashboard
- **Home Page** — 3-column layout with account bar, watchlist pills, market status
- **Sector Grid** — 11 GICS sectors with SPDR ETF tracking
- **Theme Grid** — Cross-cutting themes (AI, GLP-1, Quantum, etc.)
- **Sub-industry Drill-down** — Trending tickers per sub-sector

#### 2.2.2 Ticker Analysis Suite
- **TickerChart** — Interactive price/volume charts
- **TickerTechnicals** — RSI, SMA, momentum indicators
- **TickerFundamentals** — P/E, revenue growth, margins (Finnhub)
- **TickerDarkPool** — Dark pool prints, block trades
- **TickerPatterns** — AI-detected technical patterns
- **TickerAnalystRatings** — Consensus buy/hold/sell
- **TickerSupportResistance** — Key levels derived from SMAs and 52w range
- **TickerCatalystsRisks** — AI-identified catalysts and risk factors

#### 2.2.3 Dual AI Trade Idea Generator
- **Stock/ETF Tab** — Claude vs OpenAI side-by-side trade ideas
- **Options Tab** — Multi-leg options strategies from both AIs
- **Hedge Tab** — Combined stock + protective option positions
- **Staging System** — Click to auto-populate order form with AI parameters
- **Persistence** — LocalStorage + React context survives page refresh

#### 2.2.4 AI Options Play Generator
- **Dual Engine** — Claude + OpenAI parallel generation
- **Expiry Filters** — Daily, Weekly, Monthly, Yearly
- **Strategy Types** — Call spreads, put spreads, iron condors, strangles, butterflies
- **Risk Metrics** — Max profit/loss, breakeven, probability of profit

#### 2.2.5 Paper Trading Platform
- **TradingAccount** — Equity, buying power, P&L display
- **TradingPositions** — Open positions with real-time P&L
- **TradingOrderForm** — Stock/ETF and Options order entry with AI source indicator
- **TradingDeck** — Trade history and performance tracking
- **TradingSettings** — Guardrails (kill switch, position limits, conviction thresholds)
- **AutonomousWatchlist** — Pattern-based automated idea generation

#### 2.2.6 Data Integrations
| Provider | Data Type | Current Usage |
|----------|-----------|---------------|
| Alpaca | Paper trading, positions, orders | Fully integrated |
| Polygon | Quotes, bars, options chain | Fully integrated |
| Finnhub | Fundamentals, analyst ratings | Fully integrated |
| Unusual Whales | Dark pool, options flow | Fully integrated |
| Tavily | Web search for news | Fully integrated |
| Supabase | Trade ideas, memory, settings | Fully integrated |

---

## 3. New Features Required

### 3.1 Authentication & User Management

#### 3.1.1 Supabase Auth Integration
```
NEW TABLES REQUIRED:
- users (extends auth.users)
  - id: uuid (FK to auth.users)
  - email: text
  - display_name: text
  - avatar_url: text
  - subscription_tier: enum (free, starter, pro, elite)
  - subscription_status: enum (active, canceled, past_due)
  - stripe_customer_id: text
  - created_at: timestamp
  - updated_at: timestamp

- user_preferences
  - user_id: uuid (FK)
  - theme: enum (dark, light, system)
  - default_chart_interval: text
  - notification_email: boolean
  - notification_push: boolean
  - notification_sms: boolean
  - timezone: text

- user_api_keys (Elite tier only)
  - id: uuid
  - user_id: uuid (FK)
  - key_hash: text
  - name: text
  - permissions: jsonb
  - last_used_at: timestamp
  - expires_at: timestamp
  - created_at: timestamp
```

#### 3.1.2 Auth Flows
- **Sign Up** — Email/password, Google OAuth, Apple OAuth
- **Sign In** — Email/password, magic link, OAuth
- **Password Reset** — Email-based flow
- **Email Verification** — Required for paid tiers
- **Session Management** — JWT with refresh tokens
- **Account Settings** — Profile, password change, 2FA (Pro+)

### 3.2 Subscription & Billing (Stripe Integration)

#### 3.2.1 Stripe Products
```
PRODUCTS:
- prod_starter: Starter Plan ($19/month, $190/year)
- prod_pro: Pro Plan ($49/month, $490/year)
- prod_elite: Elite Plan ($149/month, $1,490/year)

FEATURES:
- Free trial: 14 days for Starter/Pro
- Annual discount: ~17% off
- Proration on upgrades
- Immediate access on downgrade (end of period)
```

#### 3.2.2 Billing Tables
```
NEW TABLES:
- subscriptions
  - id: uuid
  - user_id: uuid (FK)
  - stripe_subscription_id: text
  - stripe_price_id: text
  - tier: enum
  - status: enum (trialing, active, canceled, past_due, unpaid)
  - current_period_start: timestamp
  - current_period_end: timestamp
  - cancel_at_period_end: boolean
  - created_at: timestamp

- invoices
  - id: uuid
  - user_id: uuid (FK)
  - stripe_invoice_id: text
  - amount_due: integer
  - amount_paid: integer
  - status: enum
  - invoice_pdf: text
  - created_at: timestamp

- usage_tracking
  - id: uuid
  - user_id: uuid (FK)
  - feature: text (e.g., 'ai_trade_idea_claude')
  - count: integer
  - period_start: date
  - period_end: date
```

#### 3.2.3 Billing UI Components
- **PricingPage** — Feature comparison, tier selection
- **CheckoutModal** — Stripe Elements embedded checkout
- **BillingDashboard** — Current plan, usage, invoices
- **UpgradePrompt** — Contextual upgrade CTAs when hitting limits
- **UsageIndicator** — Shows remaining AI calls, watchlist slots

### 3.3 Access Control & Feature Gating

#### 3.3.1 Middleware Architecture
```typescript
// middleware.ts
- Check auth status on protected routes
- Redirect unauthenticated users to /login
- Inject user + subscription into request context

// lib/feature-flags.ts
export const TIER_FEATURES = {
  free: {
    watchlistLimit: 5,
    aiTradeIdeasDaily: 3,
    aiOptionsPlaysDaily: 0,
    realTimeQuotes: false,
    darkPool: false,
    autonomousTrading: false,
  },
  starter: { ... },
  pro: { ... },
  elite: { ... },
}

// hooks/useFeatureAccess.ts
export function useFeatureAccess(feature: Feature) {
  const { user } = useUser()
  const tier = user?.subscription_tier ?? 'free'
  return {
    hasAccess: TIER_FEATURES[tier][feature],
    limit: TIER_FEATURES[tier][`${feature}Limit`],
    usage: useUsage(feature),
    remaining: limit - usage,
  }
}
```

#### 3.3.2 Feature Gating UI Patterns
- **Blur + Lock** — Show blurred preview with upgrade CTA
- **Soft Limit** — Allow action but show "X of Y used" indicator
- **Hard Limit** — Block action with upgrade modal
- **Graceful Degradation** — Show delayed data instead of nothing

### 3.4 Real-Time Alerts & Notifications

#### 3.4.1 Alert Types
| Alert | Trigger | Free | Starter | Pro | Elite |
|-------|---------|------|---------|-----|-------|
| Price Alert | Price crosses threshold | — | Email | Push+Email | All+Webhook |
| Pattern Alert | Pattern detected on watchlist | — | — | Push+Email | All+Webhook |
| Trade Executed | Autonomous trade fills | — | — | Push+Email | All+Webhook |
| AI Signal | High-conviction idea generated | — | — | Push | All+Webhook |
| Earnings Alert | Earnings within 7 days | — | Email | Push+Email | All+Webhook |
| News Alert | Major news on watchlist | — | — | Push | All+Webhook |

#### 3.4.2 Notification Channels
```
NEW TABLES:
- alerts
  - id: uuid
  - user_id: uuid (FK)
  - type: enum
  - ticker: text (nullable)
  - condition: jsonb
  - is_active: boolean
  - last_triggered_at: timestamp
  - created_at: timestamp

- notifications
  - id: uuid
  - user_id: uuid (FK)
  - alert_id: uuid (FK, nullable)
  - channel: enum (email, push, sms, webhook)
  - title: text
  - body: text
  - data: jsonb
  - read_at: timestamp
  - created_at: timestamp
```

#### 3.4.3 Push Notification Infrastructure
- **Web Push** — Service worker + Push API
- **Mobile** — Expo push notifications (future React Native app)
- **SMS** — Twilio integration (Pro+)
- **Webhooks** — User-defined endpoints (Elite only)

### 3.5 Personalization & Preferences

#### 3.5.1 Dashboard Customization
- **Widget Layout** — Drag-and-drop dashboard builder
- **Default Views** — Save preferred chart intervals, indicators
- **Quick Actions** — Customizable shortcut bar
- **Keyboard Shortcuts** — Power user navigation

#### 3.5.2 Watchlist Enhancements
- **Multiple Watchlists** — Organize by strategy/sector
- **Watchlist Sharing** — Public/private watchlists
- **Watchlist Templates** — Pre-built sector/theme watchlists
- **Notes & Tags** — Add context to watchlist entries

### 3.6 Mobile Responsiveness

#### 3.6.1 Responsive Breakpoints
```css
/* Mobile-first approach */
sm: 640px   /* Phones landscape */
md: 768px   /* Tablets portrait */
lg: 1024px  /* Tablets landscape / small laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large monitors */
```

#### 3.6.2 Mobile-Specific Adaptations
- **Bottom Navigation** — Quick access on mobile
- **Swipe Gestures** — Navigate between sections
- **Compact Charts** — Touch-optimized interactions
- **Order Entry Sheet** — Bottom sheet for quick trades
- **Pull-to-Refresh** — Natural data refresh pattern

---

## 4. Technical Architecture

### 4.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 16 App Router                                          │
│  ├── React Server Components (RSC)                              │
│  ├── Client Components (interactivity)                          │
│  ├── SWR (data fetching + caching)                              │
│  └── Tailwind CSS + shadcn/ui                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (/app/api/*)                                │
│  ├── /auth/* — Supabase Auth endpoints                          │
│  ├── /trade-idea/* — AI generation (Claude + OpenAI)            │
│  ├── /options-play/* — Options AI                               │
│  ├── /trading/* — Alpaca paper trading                          │
│  ├── /alerts/* — Alert CRUD + trigger                           │
│  ├── /billing/* — Stripe webhooks + portal                      │
│  └── /v1/* — Public API (Elite tier)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA & AI LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Supabase                  │  External APIs                     │
│  ├── Auth                  │  ├── Alpaca (trading)              │
│  ├── PostgreSQL            │  ├── Polygon (market data)         │
│  ├── Realtime              │  ├── Finnhub (fundamentals)        │
│  └── Storage               │  ├── Unusual Whales (flow)         │
│                            │  ├── Tavily (news search)          │
│  AI Providers              │  └── Stripe (billing)              │
│  ├── Anthropic (Claude)    │                                    │
│  └── OpenAI (GPT-4)        │                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Real-Time Data Streaming

#### 4.2.1 WebSocket Connections
```typescript
// Current: Polling every 15-30 seconds
// Future: WebSocket streaming

CONNECTIONS:
1. Supabase Realtime — Database changes, presence
2. Polygon WebSocket — Real-time quotes (Pro+)
3. Alpaca WebSocket — Order updates, fills
```

#### 4.2.2 Supabase Realtime Subscriptions
```sql
-- Subscribe to trade execution updates
supabase
  .channel('trades')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'trades',
    filter: `user_id=eq.${userId}`
  }, handleNewTrade)
  .subscribe()

-- Subscribe to alert triggers
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, handleNotification)
  .subscribe()
```

### 4.3 Security Architecture

#### 4.3.1 Authentication Flow
```
1. User signs in via Supabase Auth
2. JWT issued with claims: { sub, email, tier, role }
3. Middleware validates JWT on every request
4. RLS policies enforce data isolation
5. API routes check tier for feature access
```

#### 4.3.2 Row Level Security (RLS)
```sql
-- All user-specific tables must have RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own preferences"
ON user_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 4.3.3 API Security
- **Rate Limiting** — Per-user, per-endpoint limits
- **Input Validation** — Zod schemas on all endpoints
- **CORS** — Strict origin allowlist
- **API Keys** — Hashed storage, scoped permissions (Elite)

### 4.4 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Time to First Byte (TTFB) | < 200ms | ~300ms |
| Largest Contentful Paint (LCP) | < 2.5s | ~3s |
| First Input Delay (FID) | < 100ms | ~50ms |
| Cumulative Layout Shift (CLS) | < 0.1 | ~0.05 |
| API Response Time (p95) | < 500ms | ~400ms |
| WebSocket Latency | < 100ms | N/A |

### 4.5 Scalability Considerations

#### 4.5.1 Database Scaling
- **Connection Pooling** — Supabase PgBouncer
- **Read Replicas** — For high-read endpoints
- **Partitioning** — Time-series tables (trades, notifications)
- **Indexes** — Optimized for common query patterns

#### 4.5.2 Caching Strategy
```
L1: React Query / SWR (client)
L2: Vercel Edge Cache (CDN)
L3: Supabase analysis_cache table
L4: Redis (future, for session/rate limiting)
```

---

## 5. User Flows

### 5.1 New User Onboarding

```
1. Landing Page
   └── CTA: "Start Free Trial"
   
2. Sign Up
   ├── Email/Password
   ├── Google OAuth
   └── Apple OAuth
   
3. Email Verification
   └── Magic link to verify
   
4. Onboarding Wizard
   ├── Step 1: Trading experience level
   ├── Step 2: Investment goals
   ├── Step 3: Risk tolerance
   ├── Step 4: Connect broker (optional)
   └── Step 5: Build first watchlist
   
5. Dashboard
   └── Guided tour of key features
```

### 5.2 Trade Idea to Execution Flow

```
1. Generate AI Trade Idea
   ├── Select ticker or paste context
   ├── Choose AI engine (Claude/OpenAI)
   └── Click "Generate"
   
2. Review Idea
   ├── View entry/stop/target
   ├── Review catalysts/risks
   └── Check conviction score
   
3. Stage Trade
   └── Click "Stage Stock Leg" or "Stage Options Leg"
   
4. Order Form (Auto-populated)
   ├── Adjust parameters if needed
   ├── Confirm within guardrails
   └── Submit order
   
5. Execution
   ├── Order sent to Alpaca
   ├── Real-time status updates
   └── Notification on fill
   
6. Position Management
   ├── View in open positions
   ├── Monitor P&L
   └── Close when ready
```

### 5.3 Subscription Upgrade Flow

```
1. Trigger
   ├── Hit feature limit
   ├── Click "Upgrade" button
   └── Visit pricing page
   
2. Plan Selection
   ├── Compare features
   ├── Toggle monthly/annual
   └── Select plan
   
3. Checkout
   ├── Stripe Elements form
   ├── Apply promo code (if any)
   └── Confirm payment
   
4. Activation
   ├── Instant access to new features
   ├── Welcome email
   └── Onboarding for new features
```

---

## 6. Design System

### 6.1 Color Palette

```css
:root {
  /* Background */
  --background: 0 0% 3.9%;        /* Near black */
  --foreground: 0 0% 98%;         /* Near white */
  
  /* Cards & Surfaces */
  --card: 0 0% 6%;
  --card-foreground: 0 0% 98%;
  
  /* Primary (Green accent) */
  --primary: 142 76% 45%;         /* Bull green */
  --primary-foreground: 0 0% 98%;
  
  /* Semantic Colors */
  --bull: 142 76% 45%;            /* Green - profits/bullish */
  --bear: 0 84% 60%;              /* Red - losses/bearish */
  --neutral: 220 14% 50%;         /* Gray - neutral */
  
  /* Accent Colors */
  --claude: 270 70% 60%;          /* Purple - Claude AI */
  --openai: 142 70% 50%;          /* Green - OpenAI */
  --warning: 38 92% 50%;          /* Amber - warnings */
}
```

### 6.2 Typography

```css
/* Headings: Geist Sans */
--font-sans: 'Geist', sans-serif;

/* Monospace: Geist Mono (numbers, code, labels) */
--font-mono: 'Geist Mono', monospace;

/* Scale */
text-xs:   0.75rem / 12px   /* Labels, badges */
text-sm:   0.875rem / 14px  /* Secondary text */
text-base: 1rem / 16px      /* Body text */
text-lg:   1.125rem / 18px  /* Subheadings */
text-xl:   1.25rem / 20px   /* Section titles */
text-2xl:  1.5rem / 24px    /* Card titles */
text-3xl:  1.875rem / 30px  /* Page titles */
text-4xl:  2.25rem / 36px   /* Hero text */
text-5xl:  3rem / 48px      /* Landing hero */
```

### 6.3 Component Library

Built on **shadcn/ui** with custom trading-specific components:

| Category | Components |
|----------|------------|
| **Layout** | SiteNav, SidePanel, BottomSheet, Grid layouts |
| **Data Display** | DataTable, Chart, Sparkline, Badge, Stat card |
| **Trading** | OrderForm, PositionRow, TradeCard, PriceDisplay |
| **AI** | IdeaCard, DualColumn, ConfidenceMeter, StagingButton |
| **Feedback** | Toast, Alert, Skeleton, LoadingSpinner |
| **Forms** | Input, Select, Slider, Toggle, SearchCommand |

### 6.4 Iconography

- **Lucide React** — Primary icon set
- **Custom trading icons** — Bull/bear, chart patterns, order types

---

## 7. API Specification (Elite Tier)

### 7.1 Public API Overview

```
Base URL: https://api.tradingplatform.com/v1
Auth: Bearer token (API key)
Rate Limit: 1000 req/min
```

### 7.2 Endpoints

#### Market Data
```
GET /v1/quote/{symbol}
GET /v1/bars/{symbol}?interval=1D&limit=100
GET /v1/options/chain/{symbol}?expiry=2024-12-20
```

#### AI Trade Ideas
```
POST /v1/trade-idea/generate
Body: { symbol, context?, engine: 'claude' | 'openai' }

POST /v1/options-play/generate
Body: { symbol, expiry: 'WEEKLY' | 'MONTHLY' | 'YEARLY', context? }
```

#### Trading
```
GET /v1/account
GET /v1/positions
GET /v1/orders
POST /v1/orders
DELETE /v1/orders/{orderId}
```

#### Watchlist
```
GET /v1/watchlists
POST /v1/watchlists
GET /v1/watchlists/{id}
PUT /v1/watchlists/{id}
DELETE /v1/watchlists/{id}
```

#### Alerts
```
GET /v1/alerts
POST /v1/alerts
PUT /v1/alerts/{id}
DELETE /v1/alerts/{id}
```

### 7.3 Webhooks (Elite)

```
Events:
- trade.executed
- alert.triggered
- idea.generated
- subscription.changed

Payload:
{
  "event": "trade.executed",
  "timestamp": "2024-...",
  "data": { ... }
}
```

---

## 8. Implementation Roadmap

### Phase 1: Authentication & Billing (2-3 weeks)
- [ ] Supabase Auth integration
- [ ] User management tables & RLS
- [ ] Sign up / Sign in / Password reset flows
- [ ] Stripe integration (products, checkout, webhooks)
- [ ] Subscription management UI
- [ ] Feature gating middleware

### Phase 2: Access Control & Usage Tracking (1-2 weeks)
- [ ] Usage tracking tables
- [ ] Per-feature limit enforcement
- [ ] Upgrade prompts & modals
- [ ] Billing dashboard

### Phase 3: Alerts & Notifications (2-3 weeks)
- [ ] Alert CRUD system
- [ ] Notification tables & delivery
- [ ] Web push infrastructure
- [ ] Email templates (Resend)
- [ ] SMS integration (Twilio) for Pro+

### Phase 4: Real-Time Enhancements (2 weeks)
- [ ] Supabase Realtime subscriptions
- [ ] WebSocket for quotes (Pro+)
- [ ] Live position updates
- [ ] Notification toasts

### Phase 5: Mobile Optimization (1-2 weeks)
- [ ] Responsive audit & fixes
- [ ] Bottom navigation
- [ ] Touch-optimized charts
- [ ] Bottom sheet order entry

### Phase 6: Public API (Elite) (2-3 weeks)
- [ ] API key management
- [ ] Rate limiting
- [ ] API documentation
- [ ] Webhook system

### Phase 7: Polish & Launch (1-2 weeks)
- [ ] Performance optimization
- [ ] Error monitoring (Sentry)
- [ ] Analytics (PostHog)
- [ ] Landing page
- [ ] Launch marketing

---

## 9. Success Metrics

### 9.1 Business KPIs
| Metric | Target (Month 6) |
|--------|------------------|
| Monthly Active Users (MAU) | 10,000 |
| Paid Subscribers | 1,000 |
| Monthly Recurring Revenue (MRR) | $40,000 |
| Churn Rate | < 5% |
| Trial-to-Paid Conversion | > 15% |

### 9.2 Product KPIs
| Metric | Target |
|--------|--------|
| Daily Active Users (DAU) | 30% of MAU |
| AI Ideas Generated/User/Day | 3+ |
| Trades Executed/User/Week | 5+ |
| Feature Adoption (Dark Pool) | 60% of paid |
| NPS Score | > 40 |

### 9.3 Technical KPIs
| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| API Error Rate | < 0.1% |
| P95 Latency | < 500ms |
| WebSocket Uptime | 99.5% |

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Alpaca API downtime | High | Medium | Fallback UI, graceful degradation |
| AI model rate limits | Medium | Medium | Queue system, caching |
| Data provider cost overrun | High | Medium | Usage monitoring, tier-based limits |
| Security breach | Critical | Low | RLS, audit logs, pen testing |
| Feature creep | Medium | High | Strict PRD adherence, user validation |

---

## 11. Appendices

### A. Database Schema Diagram
*See separate ERD document*

### B. API Documentation
*See /docs/api folder*

### C. Design Mockups
*See Figma link*

### D. Competitive Analysis
*See separate competitive analysis document*

---

**Document History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Apr 2026 | v0 | Initial PRD |
