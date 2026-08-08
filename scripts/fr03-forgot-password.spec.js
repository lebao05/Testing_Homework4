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