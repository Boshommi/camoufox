# Codebase Structure

**Analysis Date:** 2026-01-12

## Directory Layout

```
camoufox/
├── additions/              # Firefox customizations & Juggler protocol
│   ├── juggler/           # CDP-compatible automation interface
│   │   ├── protocol/      # Protocol handlers (Dispatcher, BrowserHandler)
│   │   ├── content/       # Frame & runtime tracking (FrameTree, PageAgent)
│   │   └── components/    # Juggler.js orchestrator
│   ├── browser/           # Firefox UI & preferences
│   └── camoucfg/          # Configuration modules
├── patches/               # Firefox fingerprint patches (42 files)
│   ├── 000-ghostery/      # Ghostery privacy patches
│   ├── 001-librewolf/     # LibreWolf hardening
│   ├── 002-playwright/    # Playwright integration
│   └── *.patch            # Individual patch files
├── services/              # Web services & extensions
│   ├── FE/                # Next.js fingerprint manager
│   └── canvas-extension/  # Browser extension (WXT)
├── scripts/               # Build & deployment scripts
├── tests/                 # Playwright test suite (Python)
├── playwright/            # Patched Playwright fork
├── pythonlib/             # Python package (camoufox)
├── legacy/                # Legacy code
└── Makefile               # Build targets
```

## Directory Purposes

**additions/juggler/**
- Purpose: CDP-compatible automation protocol for Playwright
- Contains: JavaScript modules for browser automation
- Key files: `components/Juggler.js`, `protocol/Dispatcher.js`, `TargetRegistry.js`, `NetworkObserver.js`
- Subdirectories: `protocol/` (handlers), `content/` (frame tracking)

**patches/**
- Purpose: Firefox source code patches for fingerprint spoofing
- Contains: 42 `.patch` files applied during Firefox build
- Key files: `015-fingerprint-injection.patch`, `010-canvas---spoofing.patch`, `006-audio-context-spoofing.patch`
- Subdirectories: `000-ghostery/`, `001-librewolf/`, `002-playwright/` (patch groups)

**services/FE/**
- Purpose: Next.js 16 web application for fingerprint management
- Contains: React pages, tRPC routers, Prisma schema
- Key files: `src/app/page.tsx`, `src/server/api/routers/canvas.ts`, `prisma/schema.prisma`
- Subdirectories: `src/app/`, `src/server/`, `src/lib/`, `src/trpc/`

**services/canvas-extension/**
- Purpose: Browser extension for canvas fingerprint capture
- Contains: WXT entrypoints, React popup, content scripts
- Key files: `entrypoints/background.ts`, `entrypoints/content.ts`, `entrypoints/popup/App.tsx`
- Subdirectories: `entrypoints/`, `public/`

**scripts/**
- Purpose: Build automation and developer utilities
- Contains: Python scripts for bootstrapping, packaging, patching
- Key files: `bootstrap.py`, `package.py`, `patch.py`, `developer.py`

**tests/**
- Purpose: Playwright integration tests (Python pytest)
- Contains: Test files, fixtures, test server
- Key files: `conftest.py`, `server.py`, `async/` test directory
- Subdirectories: `async/` (async tests), `assets/` (test fixtures)

**playwright/**
- Purpose: Patched Playwright source for Camoufox integration
- Contains: Modified Playwright packages
- Subdirectories: `packages/playwright-core/`, `packages/playwright-client/`

**pythonlib/**
- Purpose: Python package for Camoufox browser automation
- Contains: Main camoufox Python module

## Key File Locations

**Entry Points:**
- `services/FE/src/app/page.tsx` - Web app capture page
- `services/FE/src/app/api/trpc/[trpc]/route.ts` - tRPC API handler
- `services/canvas-extension/entrypoints/background.ts` - Extension service worker
- `additions/juggler/components/Juggler.js` - Playwright protocol entry

**Configuration:**
- `services/FE/tsconfig.json` - TypeScript configuration
- `services/FE/next.config.js` - Next.js configuration
- `services/FE/prisma/schema.prisma` - Database schema
- `services/FE/src/env.js` - Environment variable validation
- `Makefile` - Build targets

**Core Logic:**
- `services/FE/src/server/api/routers/canvas.ts` - Canvas API router
- `services/FE/src/server/api/routers/profile.ts` - Profile API router
- `services/FE/src/lib/fingerprint-detector.ts` - Browser detection (956 lines)
- `services/FE/src/lib/config-formatter.ts` - Config output formatting
- `additions/juggler/TargetRegistry.js` - Browser target management (1,318 lines)

**Testing:**
- `tests/conftest.py` - Pytest configuration and fixtures
- `tests/async/` - Async test files (89 files)
- `tests/assets/` - Test fixtures (HTML, JS files)

**Documentation:**
- `README.md` - Project overview
- `PATCH_CREATION_GUIDE.md` - Patch development guide
- `services/FE/README.md` - FE service documentation

## Naming Conventions

**Files:**
- `kebab-case.ts` - TypeScript modules (`fingerprint-detector.ts`, `config-formatter.ts`)
- `page.tsx` - Next.js App Router pages
- `route.ts` - Next.js API routes
- `PascalCase.js` - Juggler JavaScript modules (`SimpleChannel.js`, `Helper.js`)
- `test_*.py` - Python test files

**Directories:**
- `kebab-case` - Feature directories (`canvas-extension`)
- `lowercase` - Standard directories (`src`, `lib`, `app`)
- `[param]` - Dynamic route segments (`[trpc]`)

**Special Patterns:**
- `*.patch` - Firefox source patches (numbered sequence)
- `entrypoints/` - WXT extension entry points
- `routers/` - tRPC router definitions

## Where to Add New Code

**New Feature:**
- Primary code: `services/FE/src/app/[feature]/page.tsx`
- API logic: `services/FE/src/server/api/routers/[feature].ts`
- Tests: `tests/async/test_[feature].py`

**New tRPC Router:**
- Implementation: `services/FE/src/server/api/routers/[name].ts`
- Registration: Add to `services/FE/src/server/api/root.ts`
- Types: Auto-generated via tRPC

**New Detection Logic:**
- Implementation: `services/FE/src/lib/fingerprint-detector.ts`
- Helpers: `services/FE/src/lib/[name].ts`
- Version: Increment `DETECTOR_VERSION`

**New Patch:**
- Implementation: `patches/[number]-[name].patch`
- Follow: `PATCH_CREATION_GUIDE.md`

**Utilities:**
- Shared helpers: `services/FE/src/lib/`
- Type definitions: Inline in TypeScript files

## Special Directories

**additions/**
- Purpose: Firefox browser additions copied to source during build
- Source: Copied by `scripts/copy-additions.sh`
- Committed: Yes

**patches/**
- Purpose: Firefox source patches applied during build
- Source: Applied by `scripts/patch.py`
- Committed: Yes

**node_modules/**
- Purpose: NPM/Bun dependencies
- Source: Auto-generated by package manager
- Committed: No (gitignored)

**.planning/**
- Purpose: Project planning and codebase documentation
- Source: GSD workflow outputs
- Committed: Yes

---

*Structure analysis: 2026-01-12*
*Update when directory structure changes*
