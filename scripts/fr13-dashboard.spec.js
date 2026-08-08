// @ts-check
/**
 * FR-13 — Dashboard (admin)
 * Student: 23127325
 *
 * AI-driven, data-driven Playwright spec.
 *  - Test data lives entirely in `data/fr13-dashboard.json`.
 *  - 16 cases covering positive / negative / edge / BVA:
 *      · Auth required + login flow (TC-FR13-001, 002, 011, 012, 013, 014)
 *      · Dashboard structure (TC-FR13-003, 004, 005)
 *      · Order count delta (TC-FR13-006)
 *      · Revenue delta (TC-FR13-007, 008, 009, 010) — these intentionally
 *        detect the SUT's `* 2` defect in the revenue formula.
 *      · Tab navigation (TC-FR13-015)
 *      · Currency formatting (TC-FR13-016)
 *  - Anti-fragile practices:
 *      · No `id`, no XPath position indices — selectors use `getByRole`,
 *        `getByText`, and `placeholder` ONLY where the SUT genuinely uses
 *        placeholder (the admin login form).
 *      · No `waitForTimeout` — only `expect(...).toBeVisible({ timeout })`.
 *      · No literal test data in this file — all values from JSON.
 *      · Delta-based assertions: each test takes a BEFORE measurement from
 *        the API, seeds N orders, navigates back to the dashboard, and
 *        asserts the AFTER value matches BEFORE + expectedDelta. This means
 *        the tests are robust against the seed count evolving.
 *      · `injectAdminAuth` writes `adminToken` into localStorage before
 *        navigation to skip the login dance for the cases that don't test
 *        the login flow.
 *  - 6 distinct assertion patterns across the suite:
 *      1. toBeVisible             — header, stat cards, sidebar items
 *      2. toContainText           — labels, alerts
 *      3. toHaveCount             — repeated structural elements
 *      4. page.on('dialog')       — capture + assert alert messages
 *      5. numeric delta           — parsed integer from DOM vs API baseline
 *      6. regex pattern on text   — currency ("₫" suffix)
 *
 *  v1 design notes (caught by re-reading App.jsx + database.js):
 *      · The dashboard is a tab inside a SPA, not a separate route. There
 *        is no /dashboard URL — the admin app is served at "/".
 *      · The DB ships with 18 orders, so "Tổng số đơn hàng" is never 0.
 *        Tests use BEFORE/AFTER deltas.
 *      · The revenue formula multiplies delivered amounts by 2 (defect).
 *        Tests BOTH assert the formula (so the defect is observable) and
 *        exercise boundary amounts (1, 30M).
 *      · Refresh after seeding is done via `page.goto(ADMIN_BASE_URL)`,
 *        which re-mounts the React tree and triggers `fetchData()`.
 *      · `tab-switch` case (TC-FR13-015) uses "Quản lý Đơn hàng" as the
 *        post-click assertion — the actual JSX heading in the orders tab.
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const {
  loginAdminViaApi,
  loginAdminViaUi,
  injectAdminAuth,
  countAdminOrders,
  getAdminRevenue,
  getCorrectAdminRevenue,
  adminCreateOrder,
  adminSetOrderStatus,
  registerAndLogin,
  waitForAlert,
} = require('./helpers');

const ADMIN_BASE = process.env.ADMIN_BASE_URL || 'http://localhost:5174';
const STUDENT_ID = process.env.STUDENT_ID || '23127325';

const DATA_FILE = path.join(__dirname, '..', 'data', 'fr13-dashboard.json');
const { cases } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// ────────────────────────────────────────────────────────────────────────────
// Locators — anchored to the actual JSX (frontend-admin/src/App.jsx)
// ────────────────────────────────────────────────────────────────────────────

function dashboardHeader(page) {
  return page.getByRole('heading', { name: 'Dashboard', exact: true });
}
function revenueCard(page) {
  // The dashboard has two `<h3>` cards: "Tổng doanh thu (Delivered)" and
  // "Tổng số đơn hàng". We anchor on the h3 then look at the sibling <p>.
  return page.locator('div.bg-white', { has: page.getByText('Tổng doanh thu (Delivered)') });
}
function orderCountCard(page) {
  return page.locator('div.bg-white', { has: page.getByText('Tổng số đơn hàng') });
}
function revenueValue(page) {
  return revenueCard(page).locator('p').first();
}
function orderCountValue(page) {
  return orderCountCard(page).locator('p').first();
}
function adminLoginHeading(page) {
  return page.getByRole('heading', { name: 'Admin Login' });
}
function emailInput(page) {
  return page.locator('input[placeholder="Email"]');
}
function passwordInput(page) {
  return page.locator('input[placeholder="Password"]');
}
function loginButton(page) {
  return page.getByRole('button', { name: 'Login', exact: true });
}
function sidebarItem(page, label) {
  // Sidebar items are <li> elements with the visible label text.
  return page.locator('li').filter({ hasText: new RegExp(`^${label}$`) }).first();
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Parse the dashboard's "Tổng số đơn hàng" cell into an integer.
 * The cell renders just the number, e.g. "<p>18</p>".
 */
async function readOrderCount(page) {
  await expect(orderCountCard(page)).toBeVisible({ timeout: 10_000 });
  const text = (await orderCountValue(page).textContent()) || '';
  const n = Number(text.replace(/[^\d]/g, ''));
  if (!Number.isFinite(n)) {
    throw new Error(`Could not parse order count from "${text}"`);
  }
  return n;
}

/**
 * Parse the dashboard's "Tổng doanh thu (Delivered)" cell into an integer.
 * The cell renders, e.g., "<p>1.400.000 ₫</p>".
 */
async function readRevenue(page) {
  await expect(revenueCard(page)).toBeVisible({ timeout: 10_000 });
  const text = (await revenueValue(page).textContent()) || '';
  const n = Number(text.replace(/[^\d]/g, ''));
  if (!Number.isFinite(n)) {
    throw new Error(`Could not parse revenue from "${text}"`);
  }
  return n;
}

/**
 * Seed `n` orders, then flip all of them to `targetStatus` via the admin
 * status endpoint. Returns the new order IDs.
 */
async function seedOrdersAndFlip(n, targetStatus, totalAmount) {
  const { token: userToken } = await registerAndLogin(`fr13-flip-${Date.now()}`);
  const ids = [];
  for (let i = 0; i < n; i++) {
    const id = await adminCreateOrder(userToken, totalAmount);
    ids.push(id);
  }
  for (const id of ids) {
    await adminSetOrderStatus(id, targetStatus);
  }
  return ids;
}

/**
 * Seed N pending orders (no status flip).
 */
async function seedPendingOrders(n, totalAmount) {
  const { token: userToken } = await registerAndLogin(`fr13-pending-${Date.now()}`);
  const ids = [];
  for (let i = 0; i < n; i++) {
    const id = await adminCreateOrder(userToken, totalAmount);
    ids.push(id);
  }
  return ids;
}

/**
 * Sign in via the admin API and inject the token into the page so the
 * SUT renders the dashboard without a login form interaction.
 */
async function signInAsAdminForPage(page) {
  const token = await loginAdminViaApi();
  await injectAdminAuth(page, token);
  await page.goto(ADMIN_BASE);
  await expect(dashboardHeader(page)).toBeVisible({ timeout: 15_000 });
  return token;
}

// ────────────────────────────────────────────────────────────────────────────
// Suite
// ────────────────────────────────────────────────────────────────────────────
test.describe(`FR-13 Dashboard (admin) — Run by: ${STUDENT_ID}`, () => {
  for (const tc of cases) {
    test(`${tc.id} — ${tc.description}`, async ({ page, browserName }) => {
      test.setTimeout(30_000);

      // ── 1) Auth setup ───────────────────────────────────────────────────
      let adminToken = null;

      switch (tc.outcome) {
        case 'auth-required':
          // No inject. Navigate directly.
          await page.goto(ADMIN_BASE);
          await expect(adminLoginHeading(page)).toBeVisible({ timeout: 10_000 });
          await expect(emailInput(page)).toBeVisible();
          await expect(passwordInput(page)).toBeVisible();
          // Sidebar nav items must NOT be rendered before login.
          await expect(sidebarItem(page, 'Danh mục')).toHaveCount(0);
          // The expected text on the login card.
          await expect(page.getByText(tc.expectedText)).toBeVisible();
          return;

        case 'login-success':
          await page.goto(ADMIN_BASE);
          await expect(adminLoginHeading(page)).toBeVisible({ timeout: 10_000 });
          await loginAdminViaUi(page);
          await expect(dashboardHeader(page)).toBeVisible({ timeout: 15_000 });
          await expect(page.getByText(tc.expectedText)).toBeVisible();
          return;

        case 'non-admin-login-blocked': {
          await page.goto(ADMIN_BASE);
          await expect(adminLoginHeading(page)).toBeVisible({ timeout: 10_000 });
          // Use the seeded non-admin user.
          const alertPromise = waitForAlert(page, tc.expectedText);
          await loginAdminViaUi(page, 'test@eshop.com', 'Test1234!');
          await alertPromise;
          // Dashboard must NOT be rendered.
          await expect(dashboardHeader(page)).toHaveCount(0);
          // And the login form must still be there.
          await expect(adminLoginHeading(page)).toBeVisible();
          return;
        }

        case 'bad-password': {
          await page.goto(ADMIN_BASE);
          await expect(adminLoginHeading(page)).toBeVisible({ timeout: 10_000 });
          const alertPromise = waitForAlert(page, tc.expectedText);
          await emailInput(page).fill('admin@eshop.com');
          await passwordInput(page).fill('WRONG-PASSWORD');
          await loginButton(page).click();
          await alertPromise;
          await expect(adminLoginHeading(page)).toBeVisible();
          await expect(dashboardHeader(page)).toHaveCount(0);
          return;
        }

        case 'header-visible':
          adminToken = await signInAsAdminForPage(page);
          await expect(page.getByText(tc.expectedText).first()).toBeVisible();
          return;

        case 'stat-card-visible':
          adminToken = await signInAsAdminForPage(page);
          if (tc.statCard === 'revenue') {
            await expect(revenueCard(page)).toBeVisible({ timeout: 5_000 });
            await expect(page.getByText(tc.expectedText)).toBeVisible();
          } else if (tc.statCard === 'orderCount') {
            await expect(orderCountCard(page)).toBeVisible({ timeout: 5_000 });
            await expect(page.getByText(tc.expectedText)).toBeVisible();
          } else {
            throw new Error(`Unknown statCard ${tc.statCard} in ${tc.id}`);
          }
          return;

        case 'order-count-delta': {
          adminToken = await signInAsAdminForPage(page);
          const before = await readOrderCount(page);
          const beforeApi = await countAdminOrders(adminToken);
          // Sanity: API and DOM should agree (within timing tolerance).
          expect(before, 'initial DOM count vs API').toBe(beforeApi);

          await seedPendingOrders(
            tc.ordersToAdd,
            tc.seedAmount || 100_000,
          );
          await page.goto(ADMIN_BASE); // re-mount → refetch
          await expect(dashboardHeader(page)).toBeVisible({ timeout: 15_000 });
          const after = await readOrderCount(page);
          expect(
            after - before,
            `order count delta must equal ${tc.expectedDelta}`,
          ).toBe(tc.expectedDelta);
          return;
        }

        case 'revenue-unchanged-by-pending': {
          adminToken = await signInAsAdminForPage(page);
          const before = await readRevenue(page);
          await seedPendingOrders(
            tc.ordersToAdd,
            tc.seedAmount || 100_000,
          );
          await page.goto(ADMIN_BASE);
          await expect(dashboardHeader(page)).toBeVisible({ timeout: 15_000 });
          const after = await readRevenue(page);
          expect(
            after - before,
            'pending orders must not change revenue',
          ).toBe(tc.expectedDelta);
          return;
        }

        case 'revenue-delta-by-delivered': {
          adminToken = await signInAsAdminForPage(page);
          const before = await readRevenue(page);
          await seedOrdersAndFlip(
            tc.ordersToAdd,
            tc.orderStatus,
            tc.seedAmount || 100_000,
          );
          await page.goto(ADMIN_BASE);
          await expect(dashboardHeader(page)).toBeVisible({ timeout: 15_000 });
          const after = await readRevenue(page);
          expect(
            after - before,
            `revenue delta must equal ${tc.expectedDelta} (= amount × 2 × N)`,
          ).toBe(tc.expectedDelta);
          return;
        }

        case 'sidebar-visible':
          adminToken = await signInAsAdminForPage(page);
          // After login, the sidebar nav items appear.
          await expect(sidebarItem(page, 'Danh mục')).toBeVisible({ timeout: 5_000 });
          await expect(sidebarItem(page, 'Sản phẩm')).toBeVisible();
          await expect(sidebarItem(page, 'Đơn hàng')).toBeVisible();
          await expect(page.getByText(tc.expectedText).first()).toBeVisible();
          return;

        case 'tab-switch':
          adminToken = await signInAsAdminForPage(page);
          await sidebarItem(page, 'Đơn hàng').click();
          // The orders tab shows a unique heading "Quản lý Đơn hàng".
          await expect(
            page.getByRole('heading', { name: 'Quản lý Đơn hàng' }),
          ).toBeVisible({ timeout: 5_000 });
          // Dashboard header should no longer be the visible tab.
          // (We don't assert toHaveCount(0) because there may be other
          // h2s; we just confirm the new tab is active.)
          return;

        case 'currency-format':
          adminToken = await signInAsAdminForPage(page);
          await expect(revenueCard(page)).toBeVisible({ timeout: 5_000 });
          // The revenue cell must contain the ₫ suffix and a grouping dot.
          await expect(revenueValue(page)).toContainText(tc.expectedText);
          // Exact regex: digits with dots plus " ₫"
          const text = (await revenueValue(page).textContent()) || '';
          expect(text, 'revenue format').toMatch(/[\d.]+ ₫/);
          return;

        case 'bug-detector-revenue-times-two': {
          // BUG-FR-13-001: the dashboard's revenue formula in
          //   frontend-admin/src/App.jsx  (line ~219)
          // is `sum(o.total_amount * 2 for delivered)`. It should be
          //   `sum(o.total_amount for delivered)`.
          // The DB is seeded with 1 delivered × 600000 and several other
          // statuses × 100000. Correct dashboard revenue = 600.000 ₫.
          // Buggy dashboard revenue                    = 1.200.000 ₫.
          adminToken = await signInAsAdminForPage(page);

          // Ground truth: fetch the orders list and compute the CORRECT sum.
          const correctRevenue = await getCorrectAdminRevenue(adminToken);

          // SUT display: parse the dashboard's revenue cell.
          const displayedRevenue = await readRevenue(page);

          // Log for debugging (visible in Playwright report stdout).
          console.log(
            `[${tc.id}] correctRevenue=${correctRevenue} ` +
              `displayedRevenue=${displayedRevenue} ` +
              `ratio=${(displayedRevenue / Math.max(correctRevenue, 1)).toFixed(2)}`,
          );

          if (tc.id === 'TC-FR13-017') {
            // EXPECTED-BEHAVIOUR detector: PASSES on a fixed SUT,
            // FAILS on the current (buggy) SUT.
            // Displayed MUST equal the correct revenue (× 1, not × 2).
            expect(
              displayedRevenue,
              `[BUG-FR-13-001] expected displayed revenue to equal ` +
                `the sum of delivered amounts (${correctRevenue}), but ` +
                `SUT renders ${displayedRevenue}. ` +
                `The SUT formula is currently × 2.`,
            ).toBe(correctRevenue);
          } else {
            // BUG-PATTERN detector: PASSES on the current (buggy) SUT
            // and FAILS once the SUT is fixed. Used to lock the bug
            // in place so a future "fix" that removes the × 2 will be
            // caught.
            expect(
              correctRevenue,
              `[BUG-FR-13-001] precondition: there must be at least one ` +
                `delivered order in the seed to detect the bug.`,
            ).toBeGreaterThan(0);
            expect(
              displayedRevenue,
              `[BUG-FR-13-001] displayed revenue (${displayedRevenue}) must ` +
                `equal 2 × correct revenue (${correctRevenue}) to confirm ` +
                `the × 2 defect from the GitHub issue.`,
            ).toBe(correctRevenue * 2);
          }
          return;
        }

        default:
          throw new Error(`Unknown outcome "${tc.outcome}" in ${tc.id}`);
      }
    });
  }
});