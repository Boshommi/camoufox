# Architecture

**Analysis Date:** 2026-01-12

## Pattern Overview

**Overall:** Multi-Tier Anti-Detect Browser System with Specialized Services

**Key Characteristics:**
- Firefox browser core with fingerprint injection patches
- Web services for fingerprint profile management (Next.js + tRPC)
- Browser extension for canvas fingerprint capture
- CDP-compatible automation via Juggler protocol
- Playwright integration for browser automation

## Layers

**Browser Core (Firefox Patches):**
- Purpose: Apply fingerprint spoofing at the Firefox engine level
- Contains: 42 patch files for canvas, audio, network, media query spoofing
- Location: `patches/`
- Key files: `patches/015-fingerprint-injection.patch` (main injection), `patches/010-canvas---spoofing.patch`
- Depends on: Firefox source, Camoufox configuration
- Used by: End users running Camoufox browser

**Juggler Protocol Layer:**
- Purpose: CDP-compatible automation interface for Playwright
- Contains: Protocol handlers, frame tracking, network observation
- Location: `additions/juggler/`
- Key files: `additions/juggler/components/Juggler.js`, `additions/juggler/protocol/Dispatcher.js`
- Depends on: Firefox internals, Mozilla actor system
- Used by: Playwright automation clients

**Web Service Layer (FE):**
- Purpose: Fingerprint profile management and UI
- Contains: tRPC routers, React pages, detection utilities
- Location: `services/FE/src/`
- Key files: `services/FE/src/server/api/routers/canvas.ts`, `services/FE/src/server/api/routers/profile.ts`
- Depends on: Prisma ORM, Cloudflare D1
- Used by: End users via web browser

**Browser Extension Layer:**
- Purpose: Capture canvas fingerprints from visited pages
- Contains: Background script, content scripts, popup UI
- Location: `services/canvas-extension/`
- Key files: `services/canvas-extension/entrypoints/background.ts`, `services/canvas-extension/entrypoints/content.ts`
- Depends on: WXT framework, browser APIs
- Used by: Extension popup for fingerprint viewing

**Utility Layer:**
- Purpose: Shared helpers, detection logic, formatting
- Contains: Fingerprint detector, config formatter, profile utilities
- Location: `services/FE/src/lib/`
- Key files: `services/FE/src/lib/fingerprint-detector.ts`, `services/FE/src/lib/config-formatter.ts`
- Depends on: Browser APIs
- Used by: Web service pages

## Data Flow

**Fingerprint Capture Flow:**

1. User visits capture page at `/` in web service
2. `fingerprint-detector.ts` runs `detectAll()` function
3. Detects 100+ browser properties (navigator, screen, window, etc.)
4. Canvas rendered and fingerprints captured
5. Profile saved via tRPC (`profile.save` mutation)
6. Data stored in Prisma D1 database
7. Profile available for export (Python dict or JSON format)

**Configuration Application Flow:**

1. User loads Camoufox with config dict
2. Firefox patches intercept browser API calls
3. `015-fingerprint-injection.patch` injects configuration values
4. Canvas spoofing returns pre-rendered dataURLs
5. Website receives spoofed fingerprint values
6. Bot detection bypassed

**State Management:**
- File-based state in `.planning/` directory for project context
- Database-backed profiles via Prisma
- No persistent in-memory state across requests

## Key Abstractions

**Service (tRPC Router):**
- Purpose: Encapsulate business logic for API domains
- Examples: `services/FE/src/server/api/routers/canvas.ts`, `services/FE/src/server/api/routers/profile.ts`
- Pattern: tRPC procedures with Zod validation

**Detector (Utility Module):**
- Purpose: Browser fingerprint detection functions
- Examples: `detectNavigator()`, `detectScreen()`, `detectWindow()` in `fingerprint-detector.ts`
- Pattern: Async functions with safe property access

**Template (Config Format):**
- Purpose: Output format for Camoufox configuration
- Examples: Python dict format, JSON format in `config-formatter.ts`
- Pattern: Recursive value conversion with type handling

**Protocol Handler:**
- Purpose: CDP command handling for Playwright
- Examples: `BrowserHandler.js`, `PageHandler.js` in `additions/juggler/protocol/`
- Pattern: Actor-based message passing

## Entry Points

**Web Application:**
- Location: `services/FE/src/app/page.tsx`
- Triggers: HTTP request to `/`
- Responsibilities: Render capture UI, run detection, save profiles

**tRPC API:**
- Location: `services/FE/src/app/api/trpc/[trpc]/route.ts`
- Triggers: HTTP POST to `/api/trpc/*`
- Responsibilities: Route tRPC calls to routers

**Canvas API:**
- Location: `services/FE/src/app/api/canvas/route.ts`
- Triggers: HTTP GET/POST/DELETE to `/api/canvas`
- Responsibilities: Canvas fingerprint CRUD operations

**Browser Extension:**
- Location: `services/canvas-extension/entrypoints/background.ts`
- Triggers: Browser startup, extension messages
- Responsibilities: Store captured fingerprints, badge updates

**Playwright Entry:**
- Location: `additions/juggler/components/Juggler.js`
- Triggers: CDP connection from Playwright
- Responsibilities: Initialize protocol handlers, manage sessions

## Error Handling

**Strategy:** Throw exceptions, catch at boundaries, safe fallbacks for detection

**Patterns:**
- `safeGet()` wrapper function for property access with fallbacks
- Try/catch blocks in async detection functions
- tRPC error propagation with Zod validation errors
- Generic Error throws for missing resources (needs improvement)

## Cross-Cutting Concerns

**Logging:**
- Console logging in development mode
- tRPC logger link with timing middleware
- No production APM integration

**Validation:**
- Zod schemas at tRPC procedure inputs
- `@t3-oss/env-nextjs` for environment variable validation
- Type-safe Prisma queries

**Type Safety:**
- Full TypeScript in web service
- End-to-end type inference with tRPC
- Global type declarations for browser APIs

---

*Architecture analysis: 2026-01-12*
*Update when major patterns change*
