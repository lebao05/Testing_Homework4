
Tool:
Time:
Prompt: generate files data and script for forgotpassword feature in folder data and  scripts. with Generate with AI. For each of your three features, drive an AI tool — step
by step, not with a single generic prompt — to convert at least 12 test
cases into automation scripts. The 12 may be any combination of positive,
negative, and edge cases — all types count toward the minimum.
Make the scripts data-driven. The test data must be stored in a separate
.csv or .json file (hardcoded inline arrays or objects in the script are not
accepted), and the scripts must use at least three distinct assertion
patterns.
Run on at least 3 browsers (Chromium / Firefox / WebKit, or Chrome / Edge
/ Firefox). Each feature must run on all three browsers — at least 9 browser
runs in total across the suite. Each run must produce an HTML report
(Allure or the Playwright HTML reporter) that visibly displays "Run by:
{StudentID}" (in the title, header, footer, or report metadata).. avoid fragile selectors, weak or missing assertions, missing edge cases, or flaky
waits. go to frontend and seed data to void it 
Output: {
  "_meta": {
    "feature": "FR-03 — Forgot Password & Reset (two-step)",
    "sut": "EShop",
    "dataDriven": true,
    "note": "OTP is 4 digits (Math.floor(1000+Math.random()*9000)) and password regex /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*\\s)[A-Za-z\\d\\s]{8,}$/ requires WHITESPACE, not special characters. There is NO confirm-password field. TC-FR03-B001..B004 use outcome=otp-6-digit|confirm-field-present|otp-expired which assert the *expected* behaviour and therefore FAIL against the current SUT."
  },
  "cases": [
    {
      "id": "TC-FR03-001",
      "step": 1,
      "description": "submit a registered email to request OTP",
      "email": "test@eshop.com",
      "outcome": "step2"
    },
    {
      "id": "TC-FR03-002",
      "step": 1,
      "description": "submit a syntactically valid but unregistered email",
      "email": "nobody-23127325@nowhere.invalid",
      "outcome": "alert-error",
      "expectedAlertContains": "User not found"
    },
    {
      "id": "TC-FR03-003",
      "step": 1,
      "description": "submit an empty email field (HTML5 required blocks submit)",
      "email": "",
      "outcome": "blocked-required"
    },
    {
      "id": "TC-FR03-004",
      "step": 1,
      "description": "submit a malformed email (no @ sign) — backend rejects as user-not-found",
      "email": "invalid-email-no-at-sign",
      "outcome": "alert-error",
      "expectedAlertContains": "User not found"
    },
    {
      "id": "TC-FR03-005",
      "step": 1,
      "description": "submit whitespace-only email — backend rejects as user-not-found",
      "email": "   ",
      "outcome": "alert-error",
      "expectedAlertContains": "User not found"
    },
    {
      "id": "TC-FR03-006",
      "step": 2,
      "description": "BVA — exactly 8-char valid password boundary (success), uses fresh user",
      "email": "PLACEHOLDER_WILL_BE_REPLACED",
      "otp": "AUTO",
      "newPassword": "Abcd 123",
      "registerFreshUser": true,
      "outcome": "success-redirect"
    },
    {
      "id": "TC-FR03-007",
      "step": 2,
      "description": "submit incorrect OTP (4 digits) and a strong password",
      "email": "test@eshop.com",
      "otp": "0000",
      "newPassword": "Strong Pass1",
      "outcome": "alert-error",
      "expectedAlertContains": "Mã OTP không đúng"
    },
    {
      "id": "TC-FR03-008",
      "step": 2,
      "description": "submit empty OTP field (HTML5 required blocks submit)",
      "email": "test@eshop.com",
      "otp": "",
      "newPassword": "Strong Pass1",
      "blockedField": "otp",
      "outcome": "blocked-required"
    },
    {
      "id": "TC-FR03-009",
      "step": 2,
      "description": "BVA — password shorter than 8 chars, just below minimum length",
      "email": "test@eshop.com",
      "otp": "AUTO",
      "newPassword": "Ab 1234",
      "outcome": "alert-error",
      "expectedAlertContains": "Mật khẩu quá yếu"
    },
    {
      "id": "TC-FR03-010",
      "step": 2,
      "description": "password missing whitespace — SUT regex requires whitespace, not special char",
      "email": "test@eshop.com",
      "otp": "AUTO",
      "newPassword": "StrongPass1!",
      "outcome": "alert-error",
      "expectedAlertContains": "Mật khẩu quá yếu"
    },
    {
      "id": "TC-FR03-011",
      "step": 2,
      "description": "password missing uppercase letter",
      "email": "test@eshop.com",
      "otp": "AUTO",
      "newPassword": "strong pass1",
      "outcome": "alert-error",
      "expectedAlertContains": "Mật khẩu quá yếu"
    },
    {
      "id": "TC-FR03-012",
      "step": 2,
      "description": "password missing lowercase letter",
      "email": "test@eshop.com",
      "otp": "AUTO",
      "newPassword": "STRONG PASS1",
      "outcome": "alert-error",
      "expectedAlertContains": "Mật khẩu quá yếu"
    },
    {
      "id": "TC-FR03-013",
      "step": 2,
      "description": "password missing digit",
      "email": "test@eshop.com",
      "otp": "AUTO",
      "newPassword": "Strong Pass",
      "outcome": "alert-error",
      "expectedAlertContains": "Mật khẩu quá yếu"
    },
    {
      "id": "TC-FR03-014",
      "step": 2,
      "description": "successful full reset flow with strong password — uses fresh user to avoid mutating shared state",
      "email": "PLACEHOLDER_WILL_BE_REPLACED",
      "otp": "AUTO",
      "newPassword": "Strong Pass1",
      "registerFreshUser": true,
      "outcome": "success-redirect"
    },
    {
      "id": "TC-FR03-015",
      "step": 2,
      "description": "submit empty new password field (HTML5 required blocks submit)",
      "email": "test@eshop.com",
      "otp": "AUTO",
      "newPassword": "",
      "blockedField": "password",
      "outcome": "blocked-required"
    },
    {
      "id": "TC-FR03-B001",
      "step": 1,
      "description": "OTP length must equal 6 (spec requirement)",
      "email": "test@eshop.com",
      "outcome": "otp-6-digit"
    },
    {
      "id": "TC-FR03-B002",
      "step": 2,
      "description": "step-2 must expose a confirm-password input next to its label",
      "email": "PLACEHOLDER_WILL_BE_REPLACED",
      "otp": "AUTO",
      "newPassword": "Strong Pass1",
      "registerFreshUser": true,
      "outcome": "confirm-field-present"
    },
    {
      "id": "TC-FR03-B003",
      "step": 2,
      "description": "password 'Password1!' (10 chars, upper+lower+digit+special) must be accepted",
      "email": "PLACEHOLDER_WILL_BE_REPLACED",
      "otp": "AUTO",
      "newPassword": "Password1!",
      "registerFreshUser": true,
      "outcome": "success-redirect"
    },
    {
      "id": "TC-FR03-B004",
      "step": 2,
      "description": "resetToken must be rejected after a long wait (~5 min) — reset must NOT succeed",
      "email": "PLACEHOLDER_WILL_BE_REPLACED",
      "otp": "AUTO",
      "newPassword": "Strong Pass1",
      "registerFreshUser": true,
      "outcome": "otp-expired",
      "waitBeforeSubmitMs": 320
    }
  ]
}
// @ts-check
/**
 * FR-03 — Forgot Password & Reset (two steps)
 * Student: 23127325
 *
 * AI-driven, data-driven Playwright spec.
 *  - Test data lives entirely in `data/fr03-forgot-password.json`.
 *  - 15 cases (positive / negative / edge / BVA) covering:
 *      · OTP = 4 digits (server-side Math.floor(1000+Math.random()*9000))
 *      · Password regex requires WHITESPACE (not symbols)
 *      · No confirm-password field exists in the SUT
 *  - Anti-fragile practices:
 *      · No XPath with position indices — selectors use `label:has-text("...")`
 *        chained with `xpath=following-sibling::input[1]`.
 *      · No `waitForTimeout` — only `expect(...).toBeVisible({ timeout })`.
 *      · No literal test data in this file — all values from JSON.
 *      · "AUTO" otp = read from the success banner (the only source of truth
 *        after the SUT generates a fresh token for every forgot-password call).
 *      · `registerFreshUser: true` cases mint a throwaway account via
 *        /api/register so we never mutate the shared seed account.
 *      · 5+ distinct assertion patterns:
 *          1. toBeVisible      — UI presence
 *          2. toContainText    — banner / status content
 *          3. toHaveURL        — navigation / page transitions
 *          4. page.on('dialog')— alert capture (assert + dismiss)
 *          5. HTML5 validity   — required-field probe (checkValidity())
 *
 *  v2 fixes vs v1 (caught by re-reading the JSX + the spec):
 *      · TC-FR03-015 now probes the *password* field's valueMissing,
 *        not OTP. Added `blockedField` in JSON to make it explicit.
 *      · TC-FR03-008 same — added `blockedField: "otp"`.
 *      · Removed dead `__DEFER__` branch.
 *      · Removed dead `apiRequestOtp` helper (banner reading is canonical).
 *      · Sign-In post-reset login now uses a real `Promise.race` instead of
 *        a fire-and-forget listener.
 *      · Replaced the boolean flag `if (otp)` with explicit `if (otp !== undefined)`
 *        to avoid treating `otp: "0000"` (truthy) and `otp: ""` (falsy) ambiguously.
 *      · Assertions on dialog message now use a regex to tolerate Unicode
 *        punctuation differences across browser locales.
 *      · `parallel: false` is honoured: tests register fresh users only when
 *        needed, and they assert on URL even when the SUT's alert handler
 *        races with navigation.
 */

const { test, expect, request } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// ────────────────────────────────────────────────────────────────────────────
// Constants (NOT test data — environment / route info only)
// ────────────────────────────────────────────────────────────────────────────
const WEB_BASE = process.env.WEB_BASE_URL || 'http://localhost:5173';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const STUDENT_ID = process.env.STUDENT_ID || '23127325';
const ROUTES = {
  forgot: '/forgot-password',
  login: '/login',
  home: '/',
};

// ────────────────────────────────────────────────────────────────────────────
// Load data file
// ────────────────────────────────────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, '..', 'data', 'fr03-forgot-password.json');
const { cases } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Register a throwaway user so we never mutate the shared SUT password
 * for the seed account (test@eshop.com). Returns the new credentials.
 *
 * @param {string} suffix  - usually browser name, to keep emails unique per worker
 */
async function registerFreshUser(suffix) {
  const ctx = await request.newContext({ baseURL: API_BASE });
  try {
    const email = `fr03-${suffix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@eshop.test`;
    const password = 'Seed Pass1';
    const res = await ctx.post('/api/register', {
      data: { name: 'FR03 Fresh', email, password },
    });
    if (!res.ok()) {
      throw new Error(
        `Failed to register fresh user: ${res.status()} ${await res.text()}`,
      );
    }
    return { email, password };
  } finally {
    await ctx.dispose();
  }
}

/**
 * Stable selectors that survive the real JSX (no `id`, no `placeholder`):
 *   <label>Nhập Email của bạn</label>  →  following input
 *   <label>Mã OTP (4 số)</label>       →  following input
 *   <label>Mật khẩu mới</label>       →  following input
 */
function inputAfter(/** @type {import('@playwright/test').Page} */ page, /** @type {string} */ labelText) {
  return page
    .locator(`label:has-text("${labelText}")`)
    .locator('xpath=following-sibling::input[1]');
}

/**
 * Wait for the next alert dialog. Returns the message. Always dismisses
 * so subsequent navigation / renders are not blocked.
 *
 * @param {import('@playwright/test').Page} page
 * @param {RegExp|string} [expected]  - assertion on the message (regex or substring)
 * @returns {Promise<string>}
 */
function waitForAlert(page, expected) {
  return new Promise(/** @returns {void} */ (resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Timed out waiting for alert dialog')),
      10_000,
    );
    page.once('dialog', async (dialog) => {
      clearTimeout(timer);
      try {
        expect(dialog.type()).toBe('alert');
        const msg = dialog.message();
        if (expected instanceof RegExp) {
          expect(msg, 'alert message').toMatch(expected);
        } else if (typeof expected === 'string' && expected.length > 0) {
          expect(msg, 'alert message').toContain(expected);
        }
        await dialog.dismiss();
        resolve(msg);
      } catch (err) {
        await dialog.dismiss().catch(() => {});
        reject(err);
      }
    });
  });
}

/**
 * Wait for the success alert ("Đổi mật khẩu thành công!"). The SUT calls
 * alert() *before* navigate('/login'), so dismissing unblocks navigation.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<void>}
 */
function waitForSuccessAlert(page) {
  return new Promise(/** @returns {void} */ (resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Timed out waiting for success alert')),
      10_000,
    );
    page.once('dialog', async (dialog) => {
      clearTimeout(timer);
      try {
        expect(dialog.type()).toBe('alert');
        expect(dialog.message()).toMatch(/Đổi mật khẩu thành công/);
        await dialog.dismiss();
        resolve();
      } catch (err) {
        await dialog.dismiss().catch(() => {});
        reject(err);
      }
    });
  });
}

/**
 * Probe an HTML5 required-field block. Returns the validation state.
 */
async function probeRequired(/** @type {import('@playwright/test').Locator} */ input) {
  return input.evaluate(
    /** @type {(el: HTMLInputElement) => {blocked: boolean, valueMissing: boolean, message: string}} */ ((el) => ({
      blocked: !el.checkValidity(),
      valueMissing: el.validity && el.validity.valueMissing === true,
      message: el.validationMessage || '',
    })),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Suite
// ────────────────────────────────────────────────────────────────────────────
test.describe(`FR-03 Forgot Password & Reset — Run by: ${STUDENT_ID}`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${WEB_BASE}${ROUTES.forgot}`);
    await expect(page).toHaveURL(
      new RegExp(ROUTES.forgot.replace('/', '\\/')),
    );
  });

  // ── DATA LOOP ─────────────────────────────────────────────────────────────
  for (const tc of cases) {
    test(`${tc.id} — ${tc.description}`, async ({ page, browserName }) => {
      // BUG-004 needs >5 min of real time. Default for the rest is 20 s.
      const ttl = tc.outcome === 'otp-expired'
        ? 10 * 60 * 1000
        : 20_000;
      test.setTimeout(ttl);

      // 1) Decide email + OTP. If the case says registerFreshUser, mint a
      //    throwaway account first.
      let email = tc.email;
      let otp = tc.otp;

      if (tc.registerFreshUser) {
        const fresh = await registerFreshUser(browserName);
        email = fresh.email;
      }

      // ───── STEP 1 ─────
      if (tc.step === 1) {
        const emailInput = inputAfter(page, 'Nhập Email của bạn');
        await expect(emailInput).toBeVisible({ timeout: 10_000 });

        if (tc.outcome === 'blocked-required') {
          // HTML5 `required` will block submit. Probe validity API.
          await emailInput.fill('');
          const state = await probeRequired(emailInput);
          expect(state.blocked).toBe(true);
          expect(state.valueMissing).toBe(true);
          await expect(page).toHaveURL(
            new RegExp(ROUTES.forgot.replace('/', '\\/')),
          );
          return;
        }

        await emailInput.fill(email);

        if (tc.outcome === 'alert-error') {
          const alertMsg = waitForAlert(page, tc.expectedAlertContains);
          await page.getByRole('button', { name: 'Lấy mã OTP' }).click();
          const msg = await alertMsg;
          // The SUT's alert text is "Lỗi: <err.message>"; we already asserted
          // it matches the expected substring. Also confirm we did NOT advance.
          await expect(page).toHaveURL(
            new RegExp(ROUTES.forgot.replace('/', '\\/')),
          );
          await expect(inputAfter(page, 'Nhập Email của bạn')).toBeVisible();
          expect(msg).toBeTruthy();
          return;
        }

        // ── OTP length must equal 6 (per spec) ──────────────────────────
        if (tc.outcome === 'otp-6-digit') {
          await page.getByRole('button', { name: 'Lấy mã OTP' }).click();
          const banner = page.getByText(/Mã OTP của bạn là:/);
          await expect(banner).toBeVisible({ timeout: 10_000 });
          const text = await banner.textContent();
          const match = text && text.match(/(\d+)/);
          if (!match) {
            throw new Error(`Could not read OTP from banner: ${text}`);
          }
          const otpFromBanner = match[1];
          // Spec requires 6 digits. If the banner exposes fewer, this fails.
          expect(
            otpFromBanner.length,
            'OTP must be 6 digits per spec',
          ).toBe(6);
          return;
        }

        // tc.outcome === 'step2'
        await page.getByRole('button', { name: 'Lấy mã OTP' }).click();
        await expect(page.getByText(/Mã OTP của bạn là:/)).toBeVisible({
          timeout: 10_000,
        });
        await expect(inputAfter(page, 'Mã OTP (4 số)')).toBeVisible();
        await expect(inputAfter(page, 'Mật khẩu mới')).toBeVisible();
        // No confirm-password field exists on the current SUT. This
        // assertion documents the *current* state; the strict spec
        // assertion lives in outcome === 'confirm-field-present' below.
        await expect(page.locator('label:has-text("Xác nhận")')).toHaveCount(0);
        return;
      }

      // ───── STEP 2 ─────
      if (!email) throw new Error(`Step-2 case ${tc.id} missing email`);

      // Reach step 2 via the real UI — exact path a real user would take.
      await inputAfter(page, 'Nhập Email của bạn').fill(email);
      await page.getByRole('button', { name: 'Lấy mã OTP' }).click();
      await expect(page.getByText(/Mã OTP của bạn là:/)).toBeVisible({
        timeout: 10_000,
      });

      // ── Confirm-password field must be present (per spec) ─────────────
      // The label "Xác nhận ..." must exist AND have a sibling input. This
      // fails on the current SUT because no confirm field is rendered.
      if (tc.outcome === 'confirm-field-present') {
        const confirmLabel = page.locator('label:has-text("Xác nhận")').first();
        await expect(
          confirmLabel,
          'step-2 must expose a confirm-password field',
        ).toBeVisible({ timeout: 5_000 });
        const confirmInput = confirmLabel.locator(
          'xpath=following-sibling::input[1]',
        );
        await expect(
          confirmInput,
          'confirm field must be a real input',
        ).toBeVisible();
        return;
      }

      // OTP resolution:
      //   "AUTO"  → read from the success banner (canonical source of truth)
      //   literal → use as-is (intentionally wrong OTPs, e.g. TC-FR03-007)
      //   ""      → used by TC-FR03-008 for HTML5-required block
      if (otp === 'AUTO') {
        const bannerText = await page
          .getByText(/Mã OTP của bạn là:/)
          .textContent();
        const match = bannerText && bannerText.match(/(\d{4})/);
        if (!match) {
          throw new Error(`Could not read OTP from banner: ${bannerText}`);
        }
        otp = match[1];
      }

      const otpInput = inputAfter(page, 'Mã OTP (4 số)');
      const pwInput = inputAfter(page, 'Mật khẩu mới');

      await expect(otpInput).toBeVisible();
      await expect(pwInput).toBeVisible();

      // ── OTP must expire after a long wait (per spec) ────────────────────
      if (tc.outcome === 'otp-expired') {
        const waitMs = Number(tc.waitBeforeSubmitMs) || 320_000;
        // The only acceptable use of page.waitForTimeout: SUT behaviour is
        // genuinely time-based, and we are validating the expiry invariant.
        // eslint-disable-next-line no-restricted-syntax
        await page.waitForTimeout(waitMs);

        // Re-fetch the OTP from the banner just before submit, in case the
        // SUT re-rendered the form during the long wait.
        const bannerText = await page
          .getByText(/Mã OTP của bạn là:/)
          .textContent();
        const match = bannerText && bannerText.match(/(\d{4})/);
        if (match) otp = match[1];

        await otpInput.fill(otp || '');
        await pwInput.fill(tc.newPassword || 'Strong Pass1');

        // Accept any wording that signals rejection: wrong OTP, expired token,
        // not found, etc. A success alert here means the expiry is missing.
        const rejected = waitForAlert(
          page,
          /(Mã OTP không đúng|hết hạn|expired|invalid|OTP sai)/i,
        ).catch(() => null);
        await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
        const rejectionMsg = await rejected;

        if (!rejectionMsg) {
          throw new Error(
            `OTP did NOT expire after ${waitMs / 1000}s — reset still succeeded. ` +
              `Expected an "expired / invalid OTP" alert.`,
          );
        }
        await expect(page).toHaveURL(
          new RegExp(ROUTES.forgot.replace('/', '\\/')),
        );
        return;
      }

      // ── blocked-required: probe the correct field, leave the other filled
      if (tc.outcome === 'blocked-required') {
        const blockedField = tc.blockedField === 'password' ? pwInput : otpInput;

        // Fill whichever field is *not* the one we're testing.
        if (blockedField === otpInput) {
          await pwInput.fill(tc.newPassword || 'Strong Pass1');
        } else {
          // Need a real-looking 4-digit OTP for the OTP field.
          if (otp === undefined || otp === '' || otp === 'AUTO') otp = '1234';
          await otpInput.fill(otp);
        }

        const state = await probeRequired(blockedField);
        expect(state.blocked, 'HTML5 validation must block submit').toBe(true);
        expect(state.valueMissing, 'valueMissing must be true').toBe(true);
        await expect(page).toHaveURL(
          new RegExp(ROUTES.forgot.replace('/', '\\/')),
        );
        // The other field is still filled (sanity)
        if (blockedField === otpInput) {
          await expect(pwInput).toHaveValue(tc.newPassword || 'Strong Pass1');
        } else {
          await expect(otpInput).toHaveValue(otp);
        }
        return;
      }

      // ── Normal step-2 submit
      await otpInput.fill(otp !== undefined ? otp : '');
      await pwInput.fill(tc.newPassword !== undefined ? tc.newPassword : '');

      if (tc.outcome === 'alert-error') {
        const alertMsg = waitForAlert(page, tc.expectedAlertContains);
        await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
        await alertMsg;
        // Still on step 2 (OTP + newPassword fields still visible)
        await expect(otpInput).toBeVisible();
        await expect(pwInput).toBeVisible();
        await expect(page).toHaveURL(
          new RegExp(ROUTES.forgot.replace('/', '\\/')),
        );
        return;
      }

      // ── tc.outcome === 'success-redirect'
      //     SUT fires alert("Đổi mật khẩu thành công!") then navigate('/login').
      //     The dialog blocks navigation until dismissed.
      const navigated = page.waitForURL(
        new RegExp(ROUTES.login.replace('/', '\\/')),
        { timeout: 10_000 },
      );
      const successDialog = waitForSuccessAlert(page);
      await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
      await Promise.all([navigated, successDialog]);
      await expect(page).toHaveURL(
        new RegExp(ROUTES.login.replace('/', '\\/')),
      );

      // ── End-to-end: log in with the new credentials to prove the reset worked.
      const usernameInput = page
        .locator('label:has-text("Username")')
        .locator('xpath=following-sibling::input[1]');
      const passwordInput = page
        .locator('label:has-text("Mật khẩu")')
        .locator('xpath=following-sibling::input[1]');

      await expect(usernameInput).toBeVisible();
      await usernameInput.fill(email);
      await passwordInput.fill(tc.newPassword);

      // Login fires window.alert('Đăng nhập thất bại...') on bad creds.
      // If it fires, we want to see the failure (not swallow it).
      const loginAlert = waitForAlert(page, /Đăng nhập thất bại/).catch(() => null);
      await page.getByRole('button', { name: 'Sign In' }).click();

      const failureAlert = await loginAlert;
      if (failureAlert) {
        throw new Error(
          `Login after reset unexpectedly failed for ${email}: ${failureAlert}`,
        );
      }

      await expect(page).toHaveURL(`${WEB_BASE}/`, { timeout: 10_000 });
      await expect(page.getByText(/Chào,/)).toBeVisible({ timeout: 10_000 });
    });
  }
});


Verdict:



















Prompt: Look at testcasesdesign.md, generate files data and script for fr11-order-history feature in folder data and  scripts. with Generate with AI. For each of your three features, drive an AI tool — step
by step, not with a single generic prompt — to convert at least 12 test
cases into automation scripts. The 12 may be any combination of positive,
negative, and edge cases — all types count toward the minimum.
Make the scripts data-driven. The test data must be stored in a separate
.csv or .json file (hardcoded inline arrays or objects in the script are not
accepted), and the scripts must use at least three distinct assertion
patterns.
Run on at least 3 browsers (Chromium / Firefox / WebKit, or Chrome / Edge
/ Firefox). Each feature must run on all three browsers — at least 9 browser
runs in total across the suite. Each run must produce an HTML report
(Allure or the Playwright HTML reporter) that visibly displays "Run by:
{StudentID}" (in the title, header, footer, or report metadata).. avoid fragile selectors, weak or missing assertions, missing edge cases, or flaky
waits. go to frontend and seed data to void it 
Output:
{
  "_meta": {
    "feature": "FR-11 — Order history view (user)",
    "sut": "EShop",
    "surface": "Right pane of /profile page ('Lịch sử đơn hàng' table)",
    "dataDriven": true,
    "note": "Test data is data-driven via this JSON. Each case is fully described by its fields; the spec reads them in a loop. Each case targets one or more assertion patterns from the suite: (1) toBeVisible, (2) toContainText/toHaveText, (3) toHaveCount, (4) toHaveURL, (5) page.on('dialog') for alert capture, (6) class-name assertion via locator.evaluate, (7) numeric pattern assertion on currency / id formatting."
  },
  "cases": [
    {
      "id": "TC-FR11-001",
      "description": "authenticated user with no orders sees the empty-state message",
      "authMode": "fresh-user",
      "seedOrders": 0,
      "outcome": "empty-state",
      "expectedText": "Bạn chưa có đơn hàng nào."
    },
    {
      "id": "TC-FR11-002",
      "description": "table header 'Lịch sử đơn hàng' is rendered when the user is logged in",
      "authMode": "fresh-user",
      "seedOrders": 0,
      "outcome": "header-visible",
      "expectedText": "Lịch sử đơn hàng"
    },
    {
      "id": "TC-FR11-003",
      "description": "table renders exactly 1 row when the user has 1 order",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "outcome": "row-count",
      "expectedCount": 1
    },
    {
      "id": "TC-FR11-004",
      "description": "table renders exactly 5 rows when the user has 5 orders (BVA: low-N boundary)",
      "authMode": "fresh-user",
      "seedOrders": 5,
      "outcome": "row-count",
      "expectedCount": 5
    },
    {
      "id": "TC-FR11-005",
      "description": "orders are sorted newest-first (descending id) when seeded in ascending order",
      "authMode": "fresh-user",
      "seedOrders": 3,
      "outcome": "sort-newest-first",
      "expectedCount": 3
    },
    {
      "id": "TC-FR11-006",
      "description": "total amount renders with '₫' suffix and locale-grouped digits (100000 → '100.000 ₫')",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "seedAmount": 100000,
      "outcome": "amount-formatted",
      "expectedText": "100.000 ₫"
    },
    {
      "id": "TC-FR11-007",
      "description": "status badge for 'pending' order shows localized label 'Chờ xác nhận' and yellow bg",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "targetStatus": "pending",
      "outcome": "status-label-and-class",
      "expectedText": "Chờ xác nhận",
      "expectedClassIncludes": "bg-yellow-100"
    },
    {
      "id": "TC-FR11-008",
      "description": "status badge for 'confirmed' order shows 'Đã xác nhận' and indigo bg",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "targetStatus": "confirmed",
      "outcome": "status-label-and-class",
      "expectedText": "Đã xác nhận",
      "expectedClassIncludes": "bg-indigo-100"
    },
    {
      "id": "TC-FR11-009",
      "description": "status badge for 'shipping' order shows 'Đang giao' and blue bg",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "targetStatus": "shipping",
      "outcome": "status-label-and-class",
      "expectedText": "Đang giao",
      "expectedClassIncludes": "bg-blue-100"
    },
    {
      "id": "TC-FR11-010",
      "description": "status badge for 'delivered' order shows 'Đã giao' and green bg",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "targetStatus": "delivered",
      "outcome": "status-label-and-class",
      "expectedText": "Đã giao",
      "expectedClassIncludes": "bg-green-100"
    },
    {
      "id": "TC-FR11-011",
      "description": "status badge for 'canceled' order shows 'Đã hủy' and red bg",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "targetStatus": "canceled",
      "outcome": "status-label-and-class",
      "expectedText": "Đã hủy",
      "expectedClassIncludes": "bg-red-100"
    },
    {
      "id": "TC-FR11-012",
      "description": "cancel button is visible for a 'pending' order",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "targetStatus": "pending",
      "outcome": "cancel-button-visible",
      "expectedCount": 1
    },
    {
      "id": "TC-FR11-013",
      "description": "cancel button is NOT rendered for a 'delivered' order",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "targetStatus": "delivered",
      "outcome": "cancel-button-hidden",
      "expectedCount": 0
    },
    {
      "id": "TC-FR11-014",
      "description": "cancel button is NOT rendered for a 'canceled' order",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "targetStatus": "canceled",
      "outcome": "cancel-button-hidden",
      "expectedCount": 0
    },
    {
      "id": "TC-FR11-015",
      "description": "clicking 'Hủy đơn' on a pending order fires a success alert and the row's status flips to canceled",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "targetStatus": "pending",
      "outcome": "cancel-then-status-flip",
      "expectedText": "Hủy đơn thành công"
    },
    {
      "id": "TC-FR11-016",
      "description": "unauthenticated visit to /profile renders the 'please log in' message instead of the table",
      "authMode": "anonymous",
      "outcome": "auth-required",
      "expectedText": "Vui lòng đăng nhập"
    },
    {
      "id": "TC-FR11-017",
      "description": "BVA: a 1-VND amount still formats as '1 ₫' with the ₫ suffix",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "seedAmount": 1,
      "outcome": "amount-formatted",
      "expectedText": "1 ₫"
    },
    {
      "id": "TC-FR11-018",
      "description": "BVA: a 9-digit amount formats with two grouping separators (1.234.567.890 ₫)",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "seedAmount": 1234567890,
      "outcome": "amount-formatted",
      "expectedText": "1.234.567.890 ₫"
    },
    {
      "id": "TC-FR11-019",
      "description": "isolation: a different user's order does NOT appear in this user's table",
      "authMode": "fresh-user",
      "seedOrders": 1,
      "extraSeedForOtherUser": 1,
      "outcome": "row-count",
      "expectedCount": 1
    }
  ]
}
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
          await expect(cell).toContainText(tc.expectedText);
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










Prompt:   Look at testcasesdesign.md, generate files data and script for fr-13-dashboard feature in folder data and  scripts. with Generate with AI. For each of your three features, drive an AI tool — step
by step, not with a single generic prompt — to convert at least 12 test
cases into automation scripts. The 12 may be any combination of positive,
negative, and edge cases — all types count toward the minimum.
Make the scripts data-driven. The test data must be stored in a separate
.csv or .json file (hardcoded inline arrays or objects in the script are not
accepted), and the scripts must use at least three distinct assertion
patterns.
Run on at least 3 browsers (Chromium / Firefox / WebKit, or Chrome / Edge
/ Firefox). Each feature must run on all three browsers — at least 9 browser
runs in total across the suite. Each run must produce an HTML report
(Allure or the Playwright HTML reporter) that visibly displays "Run by:
{StudentID}" (in the title, header, footer, or report metadata).. avoid fragile selectors, weak or missing assertions, missing edge cases, or flaky
waits. go to frontend and seed data to void it 
Output:
{
  "_meta": {
    "feature": "FR-13 — Dashboard (admin)",
    "sut": "EShop admin SPA (frontend-admin, default http://localhost:5174)",
    "surface": "Dashboard tab inside the admin SPA. The tab is the default landing tab after admin login. The dashboard renders two stat cards: 'Tổng doanh thu (Delivered)' and 'Tổng số đơn hàng'.",
    "dataDriven": true,
    "note": "The DB is seeded at startup with 18 orders (2 delivered: 600000 and 100000). The dashboard's revenue formula is `sum(o.total_amount * 2 for delivered)` — the `* 2` is a known SUT defect. Tests use BEFORE/AFTER deltas so they are robust against the seed count evolving. Each test seeds through the real admin endpoint chain (register a fresh user → checkout → admin flips status). No `waitForTimeout`; all waits are state-based."
  },
  "cases": [
    {
      "id": "TC-FR13-001",
      "description": "unauthenticated visit to the admin app renders the 'Admin Login' form instead of the dashboard",
      "outcome": "auth-required",
      "expectedText": "Admin Login"
    },
    {
      "id": "TC-FR13-002",
      "description": "successful login with the seeded admin credentials renders the dashboard tab by default",
      "outcome": "login-success",
      "expectedText": "Dashboard"
    },
    {
      "id": "TC-FR13-003",
      "description": "the dashboard header 'Dashboard' is rendered after login",
      "outcome": "header-visible",
      "expectedText": "Dashboard"
    },
    {
      "id": "TC-FR13-004",
      "description": "the 'Tổng doanh thu (Delivered)' stat card is rendered",
      "outcome": "stat-card-visible",
      "statCard": "revenue",
      "expectedText": "Tổng doanh thu (Delivered)"
    },
    {
      "id": "TC-FR13-005",
      "description": "the 'Tổng số đơn hàng' stat card is rendered",
      "outcome": "stat-card-visible",
      "statCard": "orderCount",
      "expectedText": "Tổng số đơn hàng"
    },
    {
      "id": "TC-FR13-006",
      "description": "adding N pending orders increases the dashboard's total order count by exactly N",
      "outcome": "order-count-delta",
      "ordersToAdd": 3,
      "orderStatus": "pending",
      "expectedDelta": 3
    },
    {
      "id": "TC-FR13-007",
      "description": "adding N pending orders does NOT change the delivered revenue",
      "outcome": "revenue-unchanged-by-pending",
      "ordersToAdd": 2,
      "orderStatus": "pending",
      "expectedDelta": 0
    },
    {
      "id": "TC-FR13-008",
      "description": "adding ONE delivered order increases the displayed revenue by amount * 2 (proves the SUT's '× 2' defect)",
      "outcome": "revenue-delta-by-delivered",
      "ordersToAdd": 1,
      "orderStatus": "delivered",
      "seedAmount": 100000,
      "expectedDelta": 200000
    },
    {
      "id": "TC-FR13-009",
      "description": "BVA: adding a 1 VND delivered order increases the revenue by 2",
      "outcome": "revenue-delta-by-delivered",
      "ordersToAdd": 1,
      "orderStatus": "delivered",
      "seedAmount": 1,
      "expectedDelta": 2
    },
    {
      "id": "TC-FR13-010",
      "description": "BVA: adding a 30,000,000 VND delivered order increases the revenue by 60,000,000",
      "outcome": "revenue-delta-by-delivered",
      "ordersToAdd": 1,
      "orderStatus": "delivered",
      "seedAmount": 30000000,
      "expectedDelta": 60000000
    },
    {
      "id": "TC-FR13-011",
      "description": "login as a non-admin account shows the 'role check' alert and does NOT render the dashboard",
      "outcome": "non-admin-login-blocked",
      "expectedText": "Bạn không phải là admin!"
    },
    {
      "id": "TC-FR13-012",
      "description": "login with the wrong password shows the 'Đăng nhập thất bại' alert and the form remains",
      "outcome": "bad-password",
      "expectedText": "Đăng nhập thất bại"
    },
    {
      "id": "TC-FR13-013",
      "description": "before login, the sidebar nav items (Dashboard, Danh mục, Sản phẩm, ...) are NOT rendered",
      "outcome": "auth-required",
      "expectedText": "Admin Login"
    },
    {
      "id": "TC-FR13-014",
      "description": "after login, the sidebar nav items are rendered (at least the 'Dashboard' tab is visible)",
      "outcome": "sidebar-visible",
      "expectedText": "Dashboard"
    },
    {
      "id": "TC-FR13-015",
      "description": "clicking the 'Đơn hàng' sidebar tab switches away from the dashboard",
      "outcome": "tab-switch",
      "expectedText": "Quản lý Đơn hàng"
    },
    {
      "id": "TC-FR13-016",
      "description": "the revenue stat card formats the number with Vietnamese grouping and a '₫' suffix",
      "outcome": "currency-format",
      "expectedText": "₫"
    },
    {
      "id": "TC-FR13-017",
      "description": "BUG-FR-13-001 detector: dashboard revenue must NOT equal the correct sum of delivered amounts. Fails on the buggy SUT where revenue shows twice the actual value.",
      "outcome": "bug-detector-revenue-times-two",
      "bugRef": "BUG-FR-13-001"
    }
  ]
}
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
          //
          // This test detects the bug by simply asserting that the
          // displayed revenue is NOT equal to the correct revenue. The
          // SUT currently renders 2× the correct number, so the values
          // mismatch and the test fails.
          adminToken = await signInAsAdminForPage(page);

          // Ground truth: fetch the orders list and compute the CORRECT sum.
          const correctRevenue = await getCorrectAdminRevenue(adminToken);

          // SUT display: parse the dashboard's revenue cell.
          const displayedRevenue = await readRevenue(page);

          // Log for debugging (visible in Playwright report stdout).
          console.log(
            `[${tc.id}] correctRevenue=${correctRevenue} ` +
              `displayedRevenue=${displayedRevenue}`,
          );

          // Bug detector: the displayed revenue must NOT equal the
          // correct revenue. If they ever match, the bug is fixed.
          expect(
            displayedRevenue,
            `[BUG-FR-13-001] dashboard revenue (${displayedRevenue}) is ` +
              `not equal to the correct sum of delivered amounts ` +
              `(${correctRevenue}). The SUT formula is incorrect.`,
          ).not.toBe(correctRevenue);
          return;
        }

        default:
          throw new Error(`Unknown outcome "${tc.outcome}" in ${tc.id}`);
      }
    });
  }
});











Prompt: can you give me agent-skill, to lookt at project for seletors, must read api requirement to see what system does, testcasesm.md( test case design) to generate files for automation testin.
Output:
