# Codebase Concerns

**Analysis Date:** 2026-01-12

## Tech Debt

**Duplicate Canvas Upload Logic:**
- Issue: Same canvas fingerprint upsert pattern appears in two places
- Files: `services/FE/src/server/api/routers/canvas.ts`, `services/FE/src/app/api/canvas/route.ts`
- Why: REST endpoint added alongside tRPC for simpler extension integration
- Impact: Changes to upload logic must be made in two places
- Fix approach: Extract shared upload function to `services/FE/src/lib/canvas-storage.ts`

**Manual Data Grouping Pattern:**
- Issue: JavaScript loops to group related data instead of using Prisma includes
- Files: `services/FE/src/server/api/routers/canvas.ts:88-92`, `services/FE/src/server/api/routers/profile.ts:160-164`
- Why: Initial implementation without Prisma relationship optimization
- Impact: Extra database queries, reduced performance
- Fix approach: Use Prisma `include` in queries to eager-load related data

## Known Bugs

**No Critical Bugs Identified**

The codebase appears stable for its current functionality.

## Security Considerations

**Unprotected DELETE Endpoint:**
- Risk: DELETE `/api/canvas` endpoint allows anyone to clear all canvas data
- File: `services/FE/src/app/api/canvas/route.ts:62-65`
- Current mitigation: None - endpoint is public
- Recommendations: Add authentication or remove endpoint; use tRPC deleteAll instead

**Unvalidated JSON in REST Endpoint:**
- Risk: POST `/api/canvas` accepts raw JSON without schema validation
- File: `services/FE/src/app/api/canvas/route.ts:30`
- Current mitigation: TypeScript interface cast (compile-time only)
- Recommendations: Add Zod validation to match tRPC patterns

**All Routes Public:**
- Risk: No authentication on any API endpoints
- Files: All tRPC routers use `publicProcedure`
- Current mitigation: Application is intended for local/trusted use
- Recommendations: Add optional auth for production deployments

## Performance Bottlenecks

**N+1 Query Pattern in Canvas List:**
- Problem: Fetching fingerprints and renders in separate queries
- File: `services/FE/src/server/api/routers/canvas.ts:79-97`
- Measurement: Not profiled, but pattern causes multiple DB roundtrips
- Cause: Two separate queries then JavaScript grouping
- Improvement path: Use Prisma `include: { renders: true }` in fingerprint query

**N+1 Query Pattern in Profile Config:**
- Problem: Similar separate query pattern for profile canvas data
- File: `services/FE/src/server/api/routers/canvas.ts:142-158`
- Measurement: Not profiled
- Cause: Separate queries for profile and canvas fingerprints
- Improvement path: Single query with Prisma includes

## Fragile Areas

**Large Juggler Files:**
- Files: `additions/juggler/TargetRegistry.js` (1,318 lines), `additions/juggler/protocol/Protocol.js` (1,023 lines), `additions/juggler/NetworkObserver.js` (1,003 lines)
- Why fragile: Complex state management with minimal inline documentation
- Common failures: Difficult to understand intent when debugging
- Safe modification: Read surrounding code carefully, add comments when editing
- Test coverage: Covered by Playwright integration tests

**Fingerprint Detector:**
- File: `services/FE/src/lib/fingerprint-detector.ts` (956 lines)
- Why fragile: Relies on browser API availability that varies by browser/version
- Common failures: New browser versions may change API signatures
- Safe modification: Use `safeGet()` wrapper for all new property access
- Test coverage: Manual testing via capture page

## Scaling Limits

**SQLite/D1 Database:**
- Current capacity: Suitable for single-user or small team use
- Limit: D1 has limits on database size and concurrent connections
- Symptoms at limit: Slow queries, connection timeouts
- Scaling path: Migrate to PostgreSQL for larger deployments

## Dependencies at Risk

**No High-Risk Dependencies Identified**

The codebase uses well-maintained packages:
- Next.js 16 (actively maintained)
- tRPC 11 (actively maintained)
- Prisma 7 (actively maintained)

## Missing Critical Features

**No Authentication:**
- Problem: All endpoints are public
- Current workaround: Run on localhost or trusted network
- Blocks: Cannot safely deploy to public internet
- Implementation complexity: Medium (add auth provider + session management)

## Test Coverage Gaps

**No TypeScript Unit Tests:**
- What's not tested: Frontend components, utility functions, tRPC routers
- Risk: Regressions in detection logic go unnoticed
- Priority: Medium
- Difficulty to test: Low - add Vitest and write tests

**No API Endpoint Tests:**
- What's not tested: REST and tRPC endpoints
- Risk: API changes break clients
- Priority: Medium
- Difficulty to test: Low - add API tests with test database

## TODO/FIXME Comments

**Juggler TODOs:**
- `additions/juggler/content/FrameTree.js:102` - FIXME: 'should inherit http credentials from browser context' fails without this
- `additions/juggler/content/PageAgent.js:227` - TODO: unify this with _onWindowOpen if possible
- `additions/juggler/protocol/PageHandler.js:361` - TODO(fission): browsingContext will change in case of cross-group navigation
- `additions/juggler/components/Juggler.js:63` - TODO: remove after Bug 1724251 is fixed

**Generic Error Messages:**
- `services/FE/src/server/api/routers/canvas.ts:115` - `throw new Error()` with no message for missing canvas
- `services/FE/src/server/api/routers/profile.ts:129, 151` - Similar generic errors for missing profiles
- Impact: Difficult to debug API errors
- Fix: Add descriptive error messages with context

---

*Concerns audit: 2026-01-12*
*Update as issues are fixed or new ones discovered*
