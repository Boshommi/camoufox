# Testing Patterns

**Analysis Date:** 2026-01-12

## Test Framework

**Runner (Python):**
- pytest with pytest-asyncio for async tests
- Config: `tests/pyproject.toml`
- Fixtures: `tests/conftest.py`

**TypeScript Testing:**
- No unit tests in TypeScript codebase
- Type checking via `tsc --noEmit`
- Linting via ESLint

**Run Commands:**
```bash
# Python tests
cd tests && ./run-tests.sh          # Run all tests
pytest tests/async/                  # Run async tests
pytest tests/async/test_page.py     # Single file

# TypeScript checks
bun run check                        # Lint + typecheck
bun run typecheck                    # Type check only
bun run lint                         # ESLint only
```

## Test File Organization

**Location:**
- Python tests: `tests/async/` directory (89 test files)
- No TypeScript unit tests (`.test.ts`, `.spec.ts` not present)

**Naming:**
- Python: `test_*.py` pattern
- Examples: `test_page_select_option.py`, `test_browser.py`, `test_navigation.py`

**Structure:**
```
tests/
├── conftest.py              # Pytest configuration and fixtures
├── server.py                # Local test HTTP server
├── utils.py                 # Test helper functions
├── async/                   # Async test files
│   ├── test_page_*.py      # Page operation tests
│   ├── test_browser*.py    # Browser tests
│   └── test_navigation.py  # Navigation tests
├── assets/                  # Test fixtures
│   ├── frames/             # Frame test HTML
│   ├── worker/             # Worker test files
│   └── react/              # React test fixtures
└── pyproject.toml          # Pytest configuration
```

## Test Structure

**Pytest Organization:**
```python
import pytest

@pytest.fixture
async def page(context):
    page = await context.new_page()
    yield page
    await page.close()

async def test_feature_name(page, server):
    """Test description."""
    await page.goto(server.PREFIX + "/page.html")
    result = await page.evaluate("() => window.result")
    assert result == expected_value
```

**Patterns:**
- Async/await throughout test files
- Fixtures for page, context, browser setup
- Server fixture provides test HTTP server
- Parametrized tests for browser-specific variants

## Mocking

**Framework:**
- pytest fixtures for dependency injection
- Real browser instances (Playwright)
- Local test server for HTTP fixtures

**Patterns:**
```python
# Server-based mocking
async def test_with_server(page, server):
    await server.set_route("/api", handler)
    await page.goto(server.PREFIX + "/page.html")
```

**What to Mock:**
- HTTP responses via test server routes
- File system operations (when needed)
- Time-sensitive operations

**What NOT to Mock:**
- Browser APIs (use real Playwright browser)
- Core detection logic (test actual behavior)

## Fixtures and Factories

**Test Data:**
- HTML fixtures in `tests/assets/`
- JavaScript test files in `tests/assets/`
- Server routes defined in test files

**Location:**
- Fixtures: `tests/assets/`
- Test utilities: `tests/utils.py`
- Configuration: `tests/conftest.py`

**Key Fixtures (conftest.py):**
- `browser` - Playwright browser instance
- `context` - Browser context per test
- `page` - Page per test
- `server` - Test HTTP server

## Coverage

**Requirements:**
- No enforced coverage target
- Focus on integration tests
- Critical paths tested via Playwright

**Configuration:**
- No coverage tooling configured for Python tests
- TypeScript relies on type checking, not coverage

## Test Types

**Integration Tests (Python):**
- Test full browser lifecycle
- 89 test files in `tests/async/`
- Real HTTP server for asset serving
- Playwright browser automation

**Type/Lint Checks (TypeScript):**
- `bun run check` - Combined lint + typecheck
- `bun run typecheck` - TypeScript only
- `bun run format:check` - Prettier check

**Test Categories:**
- Browser context: `test_browsercontext*.py`
- Page operations: `test_page_*.py`
- Navigation: `test_navigation.py`
- Screenshots: `test_screenshot.py`
- Accessibility: `test_accessibility.py`
- JavaScript evaluation: `test_jshandle.py`

## Common Patterns

**Async Testing:**
```python
async def test_async_operation(page):
    result = await page.evaluate("() => someAsyncOperation()")
    assert result == "expected"
```

**Navigation Testing:**
```python
async def test_navigation(page, server):
    await page.goto(server.PREFIX + "/page.html")
    assert page.url == server.PREFIX + "/page.html"
```

**Event Testing:**
```python
async def test_event(page):
    async with page.expect_event("dialog") as event_info:
        await page.evaluate("() => alert('test')")
    dialog = await event_info.value
    assert dialog.message == "test"
```

**Server Route Mocking:**
```python
async def test_api_route(page, server):
    await server.set_route("/api/data", lambda req: req.respond(
        status=200,
        body='{"key": "value"}'
    ))
    await page.goto(server.PREFIX + "/test.html")
```

## Build & Quality Tools

**Pre-commit Workflow:**
```bash
bun run format:check     # Prettier check
bun run lint             # ESLint check
bun run typecheck        # TypeScript check
bun run build            # Build validation
```

**Available Scripts (services/FE/package.json):**
- `build` - Next.js production build
- `check` - Lint + typecheck combined
- `dev` - Development server with Turbo
- `format:check` - Prettier validation
- `format:write` - Prettier auto-fix
- `lint` - ESLint validation
- `lint:fix` - ESLint auto-fix
- `typecheck` - TypeScript validation

---

*Testing analysis: 2026-01-12*
*Update when test patterns change*
