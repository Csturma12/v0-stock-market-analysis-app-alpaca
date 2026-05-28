# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a Next.js 16.2 (App Router + Turbopack) stock market intelligence app. It is a purely serverless frontend that connects to external SaaS APIs (Supabase, Polygon, Finnhub, OpenAI, Anthropic, etc.). No Docker or background workers needed.

### Running the dev server

```bash
pnpm dev
```

Starts on http://localhost:3000. The app will load and render UI even without valid API keys — external data calls will fail gracefully but the UI structure remains navigable.

### Lint

```bash
pnpm lint
```

Uses ESLint 9 with `eslint-config-next` (flat config in `eslint.config.mjs`). Pre-existing lint errors exist in the codebase (primarily `react-hooks/set-state-in-effect` warnings).

### Build

```bash
pnpm build
```

TypeScript errors are ignored during build (`typescript.ignoreBuildErrors: true` in `next.config.mjs`).

### Environment variables

A `.env.local` file is required. See `.env.example` for the full list. At minimum, the dev server needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (can be placeholder values for UI-only work).

### Key gotchas

- The project was missing `eslint` and `eslint-config-next` from `devDependencies` and had no ESLint config file. These were added (`eslint@^9`, `eslint-config-next@latest`, and `eslint.config.mjs`).
- pnpm may warn about `sharp` build scripts being ignored. This is safe to ignore for development (image optimization is disabled in `next.config.mjs`).
- No automated test suite exists in this codebase (no test framework configured).
