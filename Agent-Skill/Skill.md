# Agent-Skill — EShop Automation Test Generation

## Purpose

Use this skill when the user asks to **generate, extend, or audit Playwright automation tests** for the **EShop e-commerce SUT** in this repository. The skill teaches an agent how to:

1. Look at the project to find **selectors** (frontend components, routes, DOM landmarks).
2. Read the **API requirements** to understand what the SUT does.
3. Read `testcasesdesign.md` (per-feature test case design) to drive generation.
4. Produce the **two output files** (data + spec) following the project's existing data-driven pattern.

The skill is **read-only** with respect to the SUT — it never edits `eshop-sut/`. It only writes / edits files under `data/` and `scripts/`.

If there is no testcasesdesign.md, you can create test cases design by yourself.
---

## When to use this skill

Use this skill when the user asks any of:

- "Generate Playwright tests for FR-XX"
- "Add a new test case to FR-..."
- "Find the selector for ..."
- "What API does FR-... call?"
- "Audit FR-... against `testcasesdesign.md`"
- "Translate this manual test case into a data-driven spec"

Do **not** use this skill for:

- Running tests (use the terminal + `npx playwright test`).
- Editing the SUT itself (`eshop-sut/`).
- Generating non-Playwright test frameworks.

---

## Repository map (what to read, in what order)

The agent must read files in this exact order. Skipping a step leads to wrong selectors / wrong shape.

| Step | Path | Why |
|---:|---|---|
| 1 | `testcasesdesign.md` | Authoritative test case design — IDs, preconditions, expected text, type (Positive / Negative / Edge / BVA) |
| 2 | `eshop-sut/frontend-{user,admin}/src/App.jsx` | Frontend source — exact strings, headings, input names, button labels, class names, route paths |
| 3 | `eshop-sut/backend/server.js` (or `routes/*.js`) | API endpoints — paths, methods, request/response shape, auth, role checks |
| 4 | `eshop-sut/backend/database.js` (or `seed.js`) | Seed users / orders — used by tests to log in and to set up known backend state |
| 5 | One existing `data/frXX-*.json` | Pattern for the new data file — `cases[]` array, `outcome` discriminator, `expectedText`, `preconditions` |
| 6 | One existing `scripts/frXX-*.spec.js` | Pattern for the new spec — `for (const c of data.cases) { ... }`, dispatch by `c.outcome` |

The agent must **never** guess selectors or endpoint paths — every value must be grep-verified against the source above.

---

## Step 1 — Locate the feature spec

1. Open `testcasesdesign.md`.
2. Find the section for the target feature (e.g. `## FR-03 — Forgot Password & Reset`).
3. Capture for every test case:
   - `id` (e.g. `TC-FR03-001`)
   - `type` (Positive / Negative / Edge / BVA)
   - `description` (one short sentence)
   - `preconditions` (logged in as X, has N orders, etc.)
   - `steps` (the action sequence)
   - `expected` (text / status / URL / DOM state)
If there is no testcasesdesign.md, you can create test cases design by yourself.

---

## Step 2 — Identify frontend selectors

Search the frontend source (`eshop-sut/frontend-{user,admin}/src/App.jsx`) for the exact strings, IDs, and class names used by the test case. Use grep, not memory.

### Selector rules for this project

| Need | Preferred Playwright locator | Why |
|---|---|---|
| Submit button (text only) | `page.getByRole('button', { name: 'Đăng nhập', exact: true })` | Semantic; survives i18n |
| Input by label | `page.getByLabel('Email')` (when `<label>` wraps the input) | Accessibility-first |
| Input by placeholder | `page.getByPlaceholder('Nhập email...')` | When no label exists |
| Heading | `page.getByRole('heading', { name: 'Dashboard', exact: true })` | **Avoid ambiguous `getByText`** — `'Dashboard'` matches both sidebar item and `<h2>` (this caused a strict-mode failure in TC-FR13-002) |
| Status badge | `page.locator('span', { hasText: 'Chờ xác nhận' }).first()` | Bangles usually appear in table rows |
| Cell-to-row mapping | `page.locator('tr', { has: page.getByText('Đã giao') })` | Row-anchored assertions |
| Logout / nav | `page.getByRole('link', { name: 'Đăng xuất' })` | Same as submit |

### Hard rules

- **Never** use `page.getByText('Dashboard')` — it is known to be ambiguous in FR-13. Always scope with `getByRole('heading', { exact: true })` or `.first()`.
- **Never** hardcode a thousands separator (`100.000 ₫`) — the SUT uses the browser locale (commas in Chrome EN, dots in some VN-locale e2e). Use a regex like `/^[\d.,]+\s*₫$/` or compare the numeric value alone.
- Use `exact: true` whenever the label could be a substring of another element (e.g. `'Giao'` vs `'Đã giao'`).

---

## Step 3 — Identify backend API requirements

Go to api requirement.md for business rule
Search the backend for the exact endpoints and shapes used by the test case. Open `eshop-sut/backend/server.js` (or `routes/*.js`) and grep for the method + path.

Capture for every API the test will call:

| Field | Where to find it |
|---|---|
| HTTP method + path | `app.post('/api/auth/...', ...)` in `server.js` |
| Request body | The `req.body` destructuring in the handler |
| Auth requirements | `Authorization: Bearer <token>` header check, or `req.user.role === 'admin'` |
| Response shape | `res.json({ ... })` — confirm field names match the test's assertions |
| Side effects | DB writes (used for isolation / cleanup) |

### Hard rules

- **Never** call an endpoint without verifying it exists in `server.js`. If the same behavior is achieved via DB writes (e.g. direct `INSERT INTO orders`), the test must use that path — not a non-existent API call.
- If the test depends on a 401 from a missing token, verify the endpoint actually returns 401 (some endpoints fall through to 200).
- For admin endpoints, the test must attach the `adminToken` from `localStorage.getItem('adminToken')` — confirm the header name in the SUT code.

---

## Step 4 — Identify seed data

Open `eshop-sut/backend/database.js` (or `seed.js`). Grep for the user / order fixtures the test depends on.

Capture:

- **User fixture**: `email`, `password`, `role` (regular vs admin). The test must use an existing seed user whenever one is available; only create a fresh user when the test mutates state (e.g. FR-03 password reset).
- **Order fixture**: `id`, `user_id`, `status`, `amount`, `created_at`. The test must seed orders with the exact `status` and `amount` the assertion expects.
- **Reset-OTP fixture**: how the OTP is generated, how it is stored, and the TTL (`5 * 60 * 1000` ms typical). Use this for TC-FR03-B004 (token expiration).

### Hard rules

- Tests **must not** mutate shared seed users (e.g. change the admin's password). Always create a fresh user via `POST /api/auth/register` for tests that need a unique state.
- Tests **must not** assume a specific `id` value for an order — only assertions about relative ordering (newest first) or count delta are safe.

---

## Step 5 — Write the data file (`data/frXX-*.json`)

Follow the structure of an existing data file (`data/fr03-forgot-password.json` is the canonical example). The schema is:

```json
{
  "feature": "FR-XX",
  "description": "One-line summary",
  "shared": {
    "frontendBaseUrl": "http://localhost:5173",
    "adminBaseUrl": "http://localhost:5174",
    "apiBaseUrl": "http://localhost:3000/api"
  },
  "cases": [
    {
      "id": "TC-FRXX-001",
      "type": "Positive",
      "description": "Short description",
      "outcome": "step2",
      "expectedText": "...",
      "preconditions": "Logged out; current url is /forgot-password"
    }
  ]
}
```

### Field rules

- `id` must match `testcasesdesign.md` exactly.
- `type` must be one of `Positive`, `Negative`, `Edge`, `Edge (BVA)`, `Bug`.
- `outcome` is the **dispatch key** the spec loops on. It must be **unique per outcome** within the file — different cases with the same outcome means the spec cannot distinguish them.
- `expectedText` is the literal string the SUT must render for the test to pass. Copy it byte-for-byte from the SUT (`App.jsx` or `server.js`).
- `preconditions` is a free-form string the spec parses to set up state (e.g. `seed orders: 1 pending, 1 delivered 100000`).
- Add a new case = add a new JSON object + a new `if` branch in the spec. **No script edit is required if the new case reuses an existing `outcome`.**

### Common outcomes used in this project

| Outcome | Meaning |
|---|---|
| `step2` | Forgot password → submit email → OTP form rendered |
| `success-redirect` | Form submission succeeds, browser navigates to a new URL |
| `alert-error` | SUT shows an error alert (Bootstrap `alert-danger` or Vue `text-red-500`) |
| `blocked-required` | HTML5 `required` attribute blocks submission — assert URL unchanged |
| `auth-required` | Unauthenticated visit renders login / role-check message |
| `currency-format` | Amount cell formatted with `₫` suffix (use regex, not exact string) |
| `header-visible` | Page heading rendered |
| `row-count` | Number of `<tr>` in body matches expected |
| `status-label-and-class` | Status badge text + CSS class both match |
| `cancel-button-visible` / `cancel-button-hidden` | Cancel button visibility per status |
| `empty-state` | Empty-state message rendered when list is empty |
| `sort-newest-first` | First row has the highest `id` |
| `login-success` / `bad-password` / `non-admin-login-blocked` | Login form outcomes |
| `stat-card-visible` | Dashboard stat card rendered |
| `order-count-delta` / `revenue-delta-by-delivered` / `revenue-unchanged-by-pending` | Dashboard metrics after seeding |
| `sidebar-visible` / `tab-switch` | Sidebar nav rendering and behaviour |
| `bug-detector-revenue-times-two` | Asserts the BUG-FR-13-001 defect is present (revenue = sum × 2) |
| `otp-6-digit` / `otp-expired` / `confirm-field-present` | FR-03 OTP edge cases |

---

## Step 6 — Write the spec file (`scripts/frXX-*.spec.js`)

Follow the structure of an existing spec (`scripts/fr03-forgot-password.spec.js` is the canonical example).

### Skeleton

```js
// scripts/frXX-...spec.js
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const STUDENT_ID = '23127325';

const data = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '..', 'data', 'frXX-....json'),
    'utf8'
  )
);

const ENV = {
  user: { ...data.shared, baseUrl: data.shared.frontendBaseUrl },
  admin: { ...data.shared, baseUrl: data.shared.adminBaseUrl },
};

test.describe(`FR-XX — <Feature name> (Run by: ${STUDENT_ID})`, () => {
  for (const c of data.cases) {
    test(`${c.id} — ${c.description}`, async ({ page, request }) => {
      // 1. Set up preconditions via API (request) — assert HTTP status only
      // 2. Open the page
      // 3. Dispatch on c.outcome
      switch (c.outcome) {
        case 'step2': /* ... */ break;
        case 'alert-error': /* ... */ break;
        // ...
      }
    });
  }
});
```
Do not run test, let me run myself
### Hard rules

- **One `test()` per JSON case** — `for (const c of data.cases)` is the only loop.
- **Dispatch by `c.outcome`** — never by `c.id`, never by index. Adding a case = JSON-only.
- **Use `request` fixture for API setup, `page` for UI** — split cleanly so failures point to the right layer.
- **No `console.log` debug noise** — use `test.info().annotations` if you need to attach context.
- **Use `await page.waitForURL(/.../i)` instead of `waitForTimeout`** — explicit > implicit.
- **Use `toContainText` / regex, not exact string match** for currency / locale-dependent text.
- **Always `await page.evaluate(...)` to clear `localStorage` between tests** when the test relies on a clean session.
- **Use `data.test.use({ storageState: '...' })` only if a fixture is required**; otherwise default to a fresh browser context per test.

### Selector usage inside the spec

- Refer to the JSON `outcome` first; only fall back to a hardcoded selector when the outcome is unique.
- For ambiguous selectors, use `.first()` or scope to a row: `page.locator('tr', { has: ... })`.
- **Never** re-introduce `page.getByText('Dashboard')` — the FR-13 fix is `page.getByRole('heading', { name: 'Dashboard', exact: true })`.

---

## Output expectations

The agent must produce exactly **two files** per feature:

| Path | Purpose |
|---|---|
| `data/frXX-<feature>.json` | Test data — one entry per case, includes `outcome` discriminator |
| `scripts/frXX-<feature>.spec.js` | Playwright spec — single `for` loop over `data.cases`, dispatch on `outcome` |

The agent must **not** produce:

- Standalone Playwright projects (the project already has `playwright.config.js`).
- Helper utilities outside `scripts/` and `data/`.
- README updates (unless the user explicitly asks).
- Changes to `eshop-sut/`.

---

## Example: generating a new test case end-to-end

**User asks:** "Add a test case for FR-03: OTP field should reject 7 digits with an error alert."

**Agent does:**

1. `Read testcasesdesign.md` → find the next FR-03 case slot, assign `TC-FR03-B005`.
2. `Grep eshop-sut/frontend-user/src/App.jsx` for `OTP` and `digits` → confirm the input has `maxLength=6` and the SUT rejects 7 digits with `'Mã OTP phải có 6 chữ số'`.
3. `Grep eshop-sut/backend/server.js` for `verify-otp` → confirm the endpoint returns 400 with the same message.
4. `Read data/fr03-forgot-password.json` → copy the structure of `TC-FR03-007` (closest analog: `incorrect OTP`).
5. Append to `data/fr03-forgot-password.json`:
   ```json
   {
     "id": "TC-FR03-B005",
     "type": "Negative",
     "description": "OTP is 7 digits → error alert",
     "outcome": "alert-error",
     "expectedText": "Mã OTP phải có 6 chữ số",
     "preconditions": "Logged in as registered user; on /forgot-password step 2"
   }
   ```
6. `Read scripts/fr03-forgot-password.spec.js` → confirm the existing `case 'alert-error':` branch already handles arbitrary OTP rejection — no script change needed.
7. Run the Step 7 self-check.
8. Report: "Added TC-FR03-B005 to `data/fr03-forgot-password.json`. No script change required. Run `npx playwright test scripts/fr03-forgot-password.spec.js --grep 'TC-FR03-B005'` to verify."

---

## Summary

| Step | Action | Tool |
|---:|---|---|
| 1 | Read test case design | `Read testcasesdesign.md` |
| 2 | Find selectors | `Grep eshop-sut/frontend-*/src/App.jsx` |
| 3 | Find API endpoints | `Grep eshop-sut/backend/server.js` |
| 4 | Find seed data | `Grep eshop-sut/backend/database.js` |
| 5 | Read existing JSON pattern | `Read data/frXX-*.json` |
| 6 | Read existing spec pattern | `Read scripts/frXX-*.spec.js` |
| 7 | Write new data file | `Write data/frXX-*.json` |
| 8 | Write new spec file (or extend existing) | `Write scripts/frXX-*.spec.js` |
| 9 | Self-check | `node -c`, `npx playwright test --list`, `git diff eshop-sut/` |
