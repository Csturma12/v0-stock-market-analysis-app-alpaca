# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

This is **Market Intel** — a Next.js 16 (App Router) stock market intelligence and paper-trading terminal. Single service, no Docker, no local databases. All state is in hosted Supabase; market data comes from external APIs (Polygon, Finnhub, Unusual Whales, etc.).

### Running the app

- `pnpm dev` starts the dev server on `localhost:3000`.
- All API keys are injected as environment variables. A `.env.local` file must map them for Next.js to pick up `NEXT_PUBLIC_*` client-side variables. Generate it from the environment at startup if missing.
- The health endpoint at `/api/health/providers` reports which providers are configured vs missing.

### Linting and type checking

- The `package.json` `lint` script (`eslint .`) does **not** work — ESLint is not installed as a dependency (pre-existing gap).
- TypeScript strict checking (`tsc --noEmit`) reports errors; the build ignores them via `typescript.ignoreBuildErrors: true` in `next.config.mjs`.
- `pnpm build` is the reliable compilation check.

### Key env variable mappings

Some environment secret names differ from what the app expects. The env-registry (`lib/env-registry.ts`) checks multiple alternative names per provider using `requiredAny`. When creating `.env.local`, map:

- `ALPACA_SECRET_API_KEY` → also set as `ALPACA_API_SECRET_KEY`
- `FLASH_ALPHA_API_KEY` is accepted (alternative to `FLASHALPHA_API_KEY`)
- `TAVILY_API_KEY` is expected but the injected secret may be named differently — Tavily is optional

### Database

SQL migrations live in `/scripts/` (`001_init.sql`, `003-stock-patterns.sql`, `004-broker-connections.sql`). These run against the hosted Supabase project, not locally.

### No automated test suite

The project has no test framework or test files. Validation is done via build + manual testing of the UI and API endpoints.
