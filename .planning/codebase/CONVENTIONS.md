# Coding Conventions

**Analysis Date:** 2026-01-12

## Naming Patterns

**Files:**
- kebab-case for utility files: `fingerprint-detector.ts`, `config-formatter.ts`, `profile-utils.ts`
- `page.tsx` for Next.js App Router pages
- `route.ts` for Next.js API routes
- PascalCase.js for Juggler modules: `SimpleChannel.js`, `Helper.js`
- snake_case for Python: `test_page_select_option.py`, `conftest.py`

**Functions:**
- camelCase for all functions: `detectNavigator()`, `detectScreen()`, `toPythonDict()`
- No special prefix for async functions
- `handle*` pattern not commonly used

**Variables:**
- camelCase for variables: `fingerprintConfig`, `canvasFingerprints`
- SCREAMING_SNAKE_CASE for constants: `DETECTOR_VERSION`, `SIMPLE_CHANNEL_MESSAGE_NAME`
- Underscore prefix for private fields in JS: `_name`, `_messageId`, `_handlers`

**Types:**
- PascalCase for interfaces: `CamoufoxConfig`, `BrowserAPIDetection`, `DetectionResult`
- PascalCase for type aliases: `CaptureStatus`
- No `I` prefix for interfaces (use `User`, not `IUser`)
- Union types for string literals: `"python" | "json"`, `"chrome" | "safari" | "firefox"`

## Code Style

**Formatting:**
- Prettier with `prettier.config.js` in `services/FE/`
- 4 space indentation in TypeScript/JavaScript
- Double quotes for strings
- Semicolons required
- Tailwind CSS plugin for class sorting

**Linting:**
- ESLint with `eslint.config.js`
- TypeScript ESLint with Next.js core web vitals
- Run: `bun run lint` or `bun run lint:fix`

**TypeScript:**
- Strict mode enabled in `tsconfig.json`
- ES modules (`"type": "module"`)
- Path alias `~` maps to `src/`

## Import Organization

**Order:**
1. React/Next.js imports
2. External packages (tRPC, Prisma, Zod)
3. Internal modules (`~/server/`, `~/lib/`)
4. Type imports (`import type { ... }`)

**Grouping:**
- Separate type imports with `import type { ... }`
- Group related imports together

**Path Aliases:**
- `~` maps to `src/` directory
- Usage: `import { api } from "~/trpc/react"`

## Error Handling

**Patterns:**
- `safeGet()` wrapper function for safe property access with fallbacks
- Try/catch blocks in async detection functions
- Silent failures with `catch { /* Skip */ }` for optional features
- tRPC handles validation errors via Zod

**Error Types:**
- Generic `Error` throws for missing resources
- Zod validation errors at API boundaries
- Error context logged before throwing in complex operations

## Logging

**Framework:**
- Console logging in development
- tRPC logger link with timing middleware
- No production APM

**Patterns:**
- `console.log` for development debugging
- Performance timing in tRPC middleware
- Error logging with context

## Comments

**When to Comment:**
- JSDoc blocks for exported functions
- Inline comments for complex logic
- Mozilla license headers in extension files

**JSDoc/TSDoc:**
- Multi-line documentation for exported functions:
```typescript
/**
 * Detect Navigator properties
 */
export async function detectNavigator(): Promise<NavigatorResult>
```

**TODO Comments:**
- Format: `// TODO: description`
- FIXME for known issues: `// FIXME: should inherit http credentials`

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Extract helpers for complex operations
- `safeGet<T>()` pattern for safe property access

**Parameters:**
- Options objects for multiple parameters: `{ skipGeolocation?: boolean }`
- Destructuring in function signatures

**Return Values:**
- Explicit return types for exported functions
- `Promise<T>` for async functions
- Early returns for guard clauses

## Module Design

**Exports:**
- Named exports preferred: `export async function detectAll()`
- Constants exported: `export const DETECTOR_VERSION = 5`
- Type exports: `export type { CamoufoxConfig }`

**Barrel Files:**
- Not heavily used
- Direct imports from specific files preferred

**tRPC Router Pattern:**
```typescript
export const canvasRouter = createTRPCRouter({
  upload: publicProcedure
    .input(z.object({ ... }))
    .mutation(async ({ input }) => { ... }),
});
```

**React Component Pattern:**
```typescript
"use client";

export default function PageName() {
  const [state, setState] = useState(...);
  // Component logic
  return <div>...</div>;
}
```

---

*Convention analysis: 2026-01-12*
*Update when patterns change*
