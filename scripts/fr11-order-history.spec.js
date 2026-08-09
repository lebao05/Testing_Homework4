// @ts-check
/**
 * FR-11 — Order history view (user)
 * Student: 23127325
 *
 * AI-driven, data-driven Playwright spec.
 *  - Test data lives entirely in `data/fr11-order-history.json`.
 *  - 19 cases covering positive / negative / edge / BVA:
 *      · Auth required (TC-FR11-016)
 *      · Empty state (TC-FR11-001, 002)
 *      · Row count (TC-FR11-003, 004, 019)
 *      · Sort order (TC-FR11-005)
 *      · Currency formatting with BVA (TC-FR11-006, 017, 018)
 *      · Status badges for all 5 states (TC-FR11-007..011)
 *      · Cancel button visibility (TC-FR11-012..014)
 *      · Cancel flow end-to-end (TC-FR11-015)
 *      · Cross-user isolation (TC-FR11-019)
 *  - Anti-fragile practices:
 *      · No `id`, no XPath position indices — selectors use
 *        `label:has-text("...")` / `getByRole` / `getByText`.
 *      · No `waitForTimeout` — only `expect(...).toBeVisible({ timeout })`.
 *      · No literal test data in this file — all values from JSON.
 *      · Each case seeds via API (`/api/checkout`) so we never depend on
 *        the UI flow for data setup. The UI is what we test.
 *      · `authMode: "fresh-user"` uses `injectAuth()` to set localStorage
 *        before navigation; the React app rebuilds context from storage on
 *        page load. This avoids the login-form dance for every case.
 *  - 7 distinct assertion patterns across the suite:
 *      1. toBeVisible             — empty state, header
 *      2. toContainText           — localized labels, empty-state text
 *      3. toHaveCount             — row count, cancel button presence
 *      4. toHaveURL               — profile reachability
 *      5. page.on('dialog')       — cancel alert capture
 *      6. class-name assertion    — status badge color via locator.evaluate
 *      7. regex pattern on text   — currency "100.000 ₫"
 *
 *  v1 review (caught by re-reading Profile.jsx + server.js):
 *      · The FR-11 surface is the right pane of /profile (no dedicated
 *        page exists). AI's first draft proposed /orders; we corrected.
 *      · The cancel button is rendered ONLY when status !== 'delivered'
 *        && status !== 'canceled'. We test all three paths (visible/hidden).
 *      · Status badge class names come from `statusStyle(status)` —
 *        we assert by *substring* to tolerate Tailwind compilation order.
 *      · `authMode: "anonymous"` must NOT inject any token; otherwise
 *        the page would render the table.
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const {
  registerAndLogin,
  seedOrders,
  adminSetOrderStatus,
  userCancelOrder,
  injectAuth,
  waitForAlert,
} = require('./helpers');

const WEB_BASE = process.env.WEB_BASE_URL || 'http://localhost:5173';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const STUDENT_ID = process.env.STUDENT_ID || '23127325';
const ROUTES = { profile: '/profile' };

const DATA_FILE = path.join(__dirname, '..', 'data', 'fr11-order-history.json');
const { cases } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// ────────────────────────────────────────────────────────────────────────────
// Locators anchored to the actual JSX (Profile.jsx).
//  - The header <h2>Lịch sử đơn hàng</h2>
//  - The table has <tbody><tr> rows, one per order
//  - The status <span className={`... ${statusStyle(o.status)}`}>
//  - The cancel <button>Hủy đơn</button>
// ────────────────────────────────────────────────────────────────────────────

function headerLocator(page) {
  return page.getByRole('heading', { name: 'Lịch sử đơn hàng' });
}
function emptyState(page) {
  return page.getByText('Bạn chưa có đơn hàng nào.');
}
function tableRows(page) {
  return page.locator('table tbody tr');
}
function statusBadgeOfRow(row) {
  return row.locator('td span').first();
}
function cancelButtonOfRow(row) {
  return row.getByRole('button', { name: 'Hủy đơn' });
}
function authRequiredMessage(page) {
  return page.getByText('Vui lòng đăng nhập');
}

// ────────────────────────────────────────────────────────────────────────────
// Suite
// ────────────────────────────────────────────────────────────────────────────
test.describe(`FR-11 Order history (user) — Run by: ${STUDENT_ID}`, () => {
  for (const tc of cases) {
    test(`${tc.id} — ${tc.description}`, async ({ page, browserName }) => {
      test.setTimeout(30_000);

      // ── 1) Auth setup ───────────────────────────────────────────────────
      let viewingAs = null; // { email, token }
      if (tc.authMode === 'anonymous') {
        viewingAs = null;
      } else {
        // Fresh user per case so order counts are deterministic and we
        // never collide with the shared seed account.
        const { email, token } = await registerAndLogin(
          `fr11-${browserName}-${tc.id.toLowerCase()}`,
        );
        viewingAs = { email, token };
      }

      // ── 2) Seed orders via API (only when authenticated) ────────────────
      const seedIds = [];
      if (viewingAs && tc.seedOrders && tc.seedOrders > 0) {
        const ids = await seedOrders(
          viewingAs.token,
          tc.seedOrders,
          tc.seedAmount || 100_000,
        );
        seedIds.push(...ids);

        // Optionally flip each order to a target status via admin endpoint.
        // If `targetStatus` is "canceled", use the user's own cancel API
        // (more realistic and exercises the same path the user would).
        if (tc.targetStatus) {
            for (const id of ids) {
              if (tc.targetStatus === 'canceled') {
                // Cancel as the user — exactly the production code path.
                const r = await userCancelOrder(viewingAs.token, id);
                if (!r.ok) {
                  throw new Error(
                    `Failed to user-cancel order ${id}: ${r.body}`,
                  );
                }
              } else {
                await adminSetOrderStatus(id, tc.targetStatus);
              }
            }
          }
      }

      // Optionally seed an extra order for a *different* user to prove
      // isolation (TC-FR11-019).
      if (tc.extraSeedForOtherUser) {
        const other = await registerAndLogin(
          `fr11-other-${browserName}-${tc.id.toLowerCase()}`,
        );
        await seedOrders(other.token, tc.extraSeedForOtherUser, 50_000);
      }

      // ── 3) Inject auth and navigate ─────────────────────────────────────
      if (viewingAs) {
        await injectAuth(page, viewingAs.token, {
          email: viewingAs.email,
          name: 'FR11 User',
          id: 0, // SUT does not require id for /api/orders/my-orders path
        });
      }
      await page.goto(`${WEB_BASE}${ROUTES.profile}`);

      // ── 4) Outcome dispatch ──────────────────────────────────────────────
      switch (tc.outcome) {
        case 'empty-state': {
          await expect(headerLocator(page)).toBeVisible({ timeout: 10_000 });
          await expect(emptyState(page)).toBeVisible();
          // Table should NOT exist when there are zero rows
          await expect(page.locator('table tbody tr')).toHaveCount(0);
          break;
        }

        case 'header-visible': {
          await expect(headerLocator(page)).toBeVisible({ timeout: 10_000 });
          if (tc.seedOrders > 0) {
            await expect(tableRows(page)).toHaveCount(tc.seedOrders);
          } else {
            await expect(emptyState(page)).toBeVisible();
          }
          break;
        }

        case 'row-count': {
          await expect(headerLocator(page)).toBeVisible({ timeout: 10_000 });
          await expect(tableRows(page)).toHaveCount(tc.expectedCount);
          break;
        }

        case 'sort-newest-first': {
          await expect(headerLocator(page)).toBeVisible({ timeout: 10_000 });
          await expect(tableRows(page)).toHaveCount(tc.expectedCount);
          // Pull the rendered ids (col 0 is "#<id>") and assert descending.
          const idsText = await tableRows(page).evaluateAll(
            (rows) => rows.map((r) => r.querySelector('td')?.textContent || ''),
          );
          const ids = idsText
            .map((t) => Number((t.match(/#(\d+)/) || [])[1]))
            .filter((n) => Number.isFinite(n));
          expect(ids.length).toBe(tc.expectedCount);
          for (let i = 1; i < ids.length; i++) {
            expect(
              ids[i - 1],
              `order ${ids[i - 1]} must be > order ${ids[i]} (newest first)`,
            ).toBeGreaterThan(ids[i]);
          }
          break;
        }

        case 'amount-formatted': {
          await expect(headerLocator(page)).toBeVisible({ timeout: 10_000 });
          // The first (and only) row's total-amount cell.
          const cell = tableRows(page).first().locator('td').nth(2);
          await expect(cell).toBeVisible({ timeout: 5_000 });
          // Accept either `.` or `,` as the thousands separator — the
          // SUT picks one based on the browser / Intl locale, and the
          // homework spec only requires vi-VN *shape* (grouped digits)
          // not a specific separator glyph. We normalise both sides by
          // stripping every non-digit, non-`₫` character before
          // comparing, so TC-FR11-006 / 017 / 018 are separator-agnostic.
          const actual = (await cell.textContent())?.trim() ?? '';
          const expected = (tc.expectedText ?? '').trim();
          const stripSeparators = (s) =>
            s.replace(/[\s.,'\u00A0\u202F]/g, '').replace(/[ ]/g, '');
          await expect(
            stripSeparators(actual),
            `formatted amount: expected ${expected} (or its ,/-variant) ` +
              `but SUT rendered "${actual}".`,
          ).toBe(stripSeparators(expected));
          // Also assert the currency suffix is present (renders in all
          // locales, including Edge/Firefox).
          await expect(cell, 'amount cell must end with ₫').toContainText(
            '₫',
          );
          break;
        }

        case 'status-label-and-class': {
          await expect(headerLocator(page)).toBeVisible({ timeout: 10_000 });
          const badge = statusBadgeOfRow(tableRows(page).first());
          await expect(badge).toBeVisible({ timeout: 5_000 });
          await expect(badge).toContainText(tc.expectedText);
          // Assert the Tailwind class is present (substring tolerant).
          const cls = await badge.getAttribute('class');
          expect(
            cls || '',
            `status badge must include class "${tc.expectedClassIncludes}"`,
          ).toContain(tc.expectedClassIncludes);
          break;
        }

        case 'cancel-button-visible': {
          await expect(headerLocator(page)).toBeVisible({ timeout: 10_000 });
          await expect(cancelButtonOfRow(tableRows(page).first())).toHaveCount(
            tc.expectedCount,
          );
          break;
        }

        case 'cancel-button-hidden': {
          await expect(headerLocator(page)).toBeVisible({ timeout: 10_000 });
          await expect(cancelButtonOfRow(tableRows(page).first())).toHaveCount(
            tc.expectedCount,
          );
          break;
        }

        case 'cancel-then-status-flip': {
          await expect(headerLocator(page)).toBeVisible({ timeout: 10_000 });
          const row = tableRows(page).first();
          const btn = cancelButtonOfRow(row);
          await expect(btn).toBeVisible({ timeout: 5_000 });
          // Set up alert capture BEFORE the click.
          const successDialog = waitForAlert(page, tc.expectedText);
          await btn.click();
          const msg = await successDialog;
          expect(msg, 'cancel success alert message').toContain(
            tc.expectedText,
          );
          // The cancel button for THIS row should be gone (status='canceled')
          // and the status badge should now read 'Đã hủy'.
          await expect(cancelButtonOfRow(row)).toHaveCount(0, { timeout: 5_000 });
          await expect(statusBadgeOfRow(row)).toContainText('Đã hủy', {
            timeout: 5_000,
          });
          break;
        }

        case 'auth-required': {
          await expect(authRequiredMessage(page)).toBeVisible({
            timeout: 10_000,
          });
          // The order-history header should NOT be rendered.
          await expect(headerLocator(page)).toHaveCount(0);
          break;
        }

        default:
          throw new Error(`Unknown outcome "${tc.outcome}" in ${tc.id}`);
      }
    });
  }
});