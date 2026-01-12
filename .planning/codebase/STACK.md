# Technology Stack

**Analysis Date:** 2026-01-12

## Languages

**Primary:**
- C/C++ - Firefox browser engine (`camoufox-144.0.2-bluetaka.27/`)
- Python 3.8+ - Core package, build system, automation (`pythonlib/camoufox/`, `scripts/`)
- TypeScript 5.8+ - Web services, browser extension (`services/FE/`, `services/canvas-extension/`)
- JavaScript - Firefox modules, React components, configuration

**Secondary:**
- Rust - Firefox performance-critical components (`camoufox-144.0.2-bluetaka.27/Cargo.toml`)
- Shell/Bash - Build scripts, utilities (`Makefile`, `scripts/`)

## Runtime

**Environment:**
- Node.js 18+ - Frontend and extension development (`playwright/package.json`)
- Bun 1.3.5+ - JavaScript runtime for services (`services/FE/package.json`)
- Python 3.8-3.12 - CLI and automation (`pythonlib/pyproject.toml`)
- Mozilla Mach - Firefox build system (`camoufox-144.0.2-bluetaka.27/mach`)

**Package Managers:**
- npm - JavaScript packages (`playwright/package-lock.json`)
- Poetry - Python dependencies (`pythonlib/pyproject.toml`, `tests/pyproject.toml`)
- Cargo - Rust packages (`camoufox-144.0.2-bluetaka.27/Cargo.lock`)

## Frameworks

**Core:**
- Next.js 16.0.6 - Full-stack React framework (`services/FE/package.json`)
- Playwright 1.57.0 - Browser automation (internal fork) (`playwright/package.json`)
- React 19.2.0 - UI framework (`services/FE/`, `services/canvas-extension/`)
- tRPC 11.0.0 - Type-safe API framework (`services/FE/src/server/api/trpc.ts`)
- WXT 0.20.6 - Browser extension framework (`services/canvas-extension/package.json`)

**Testing:**
- Pytest - Python test framework (`tests/pyproject.toml`)
- Playwright Test - Browser testing (`playwright/tests/`)

**Build/Dev:**
- Vite 6.4.1 - Build tool for Playwright (`playwright/package.json`)
- TypeScript 5.8.2+ - Type checking (`services/FE/package.json`)
- ESLint 9.34.0+ - JavaScript linting (`services/FE/eslint.config.js`)
- Prettier 3.5.3+ - Code formatting (`services/FE/prettier.config.js`)
- Make - Build orchestration (`Makefile`)

## Key Dependencies

**Critical (Python):**
- `browserforge ^1.2.1` - Browser fingerprint generation (`pythonlib/camoufox/fingerprints.py`)
- `playwright` (main branch) - Browser automation (`pythonlib/camoufox/sync_api.py`)
- `click` - CLI framework (`pythonlib/camoufox/__main__.py`)
- `orjson` - Fast JSON serialization (`pythonlib/pyproject.toml`)
- `geoip2` (optional) - MaxMind GeoIP2 (`pythonlib/camoufox/locale.py`)
- `ua_parser` - User agent parsing (`pythonlib/pyproject.toml`)

**Critical (Node/TypeScript):**
- `@prisma/client ^7.2.0` - Database ORM (`services/FE/src/server/db.ts`)
- `@prisma/adapter-d1 7.0.1` - Cloudflare D1 adapter (`services/FE/package.json`)
- `@trpc/server`, `@trpc/client` - tRPC framework (`services/FE/package.json`)
- `@opennextjs/cloudflare 1.14.0` - Cloudflare Workers adapter (`services/FE/package.json`)
- `zod 3.24.2` - Schema validation (`services/FE/package.json`)
- `@t3-oss/env-nextjs 0.12.0` - Environment validation (`services/FE/src/env.js`)

**Infrastructure:**
- `@tanstack/react-query 5.69.0` - Server state management (`services/FE/package.json`)
- `superjson 2.2.1` - JSON serialization with types (`services/FE/src/server/api/trpc.ts`)
- Tailwind CSS 4.0.15 - Utility CSS framework (`services/FE/package.json`)

## Configuration

**Environment:**
- `.env` files for runtime configuration (`services/FE/.env`)
- `@t3-oss/env-nextjs` for validation with Zod schemas (`services/FE/src/env.js`)
- Required vars: `DATABASE_URL`, `NEXT_PUBLIC_BASE_URL`

**Build:**
- `next.config.js` - Next.js configuration (`services/FE/next.config.js`)
- `wxt.config.ts` - WXT extension config (`services/canvas-extension/wxt.config.ts`)
- `tsconfig.json` - TypeScript config (multiple locations)
- `mozconfig` - Firefox build config (`mozconfig`)
- `Makefile` - Build orchestration (20KB, 60+ targets)

## Platform Requirements

**Development:**
- macOS/Linux preferred (Windows possible with WSL)
- Node.js 18+, Python 3.8+, Rust toolchain
- Docker (optional for Firefox builds)
- ~1GB RAM per core for parallel builds

**Production:**
- Firefox builds: Linux/macOS/Windows native binaries
- Frontend service: Cloudflare Workers (OpenNext)
- Python package: pip installable (`pip install camoufox`)

---

*Stack analysis: 2026-01-12*
*Update after major dependency changes*
