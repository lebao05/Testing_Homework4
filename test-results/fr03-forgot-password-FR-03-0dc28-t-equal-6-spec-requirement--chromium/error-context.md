# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fr03-forgot-password.spec.js >> FR-03 Forgot Password & Reset — Run by: 23127325 >> TC-FR03-B001 — OTP length must equal 6 (spec requirement)
- Location: scripts\fr03-forgot-password.spec.js:196:5

# Error details

```
Error: OTP must be 6 digits per spec

expect(received).toBe(expected) // Object.is equality

Expected: 6
Received: 4
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "EShop" [ref=e5] [cursor=pointer]:
      - /url: /
    - navigation [ref=e6]:
      - link "Giỏ hàng" [ref=e7] [cursor=pointer]:
        - /url: /cart
      - link "Đăng nhập" [ref=e8] [cursor=pointer]:
        - /url: /login
      - link "Đăng ký" [ref=e9] [cursor=pointer]:
        - /url: /register
  - main [ref=e10]:
    - generic [ref=e11]:
      - heading "Quên Mật Khẩu" [level=2] [ref=e12]
      - generic [ref=e13]:
        - generic [ref=e14]: "Mã OTP của bạn là: 1169"
        - generic [ref=e15]:
          - generic [ref=e16]: Mã OTP (4 số)
          - textbox [ref=e17]
        - generic [ref=e18]:
          - generic [ref=e19]: Mật khẩu mới
          - textbox [ref=e20]
        - button "Đặt lại mật khẩu" [ref=e21] [cursor=pointer]
        - button "← Quay lại" [ref=e22] [cursor=pointer]
  - contentinfo [ref=e23]: © 2026 EShop SUT. Dành cho mục đích kiểm thử.
```

# Test source

```ts
  161 |         resolve();
  162 |       } catch (err) {
  163 |         await dialog.dismiss().catch(() => {});
  164 |         reject(err);
  165 |       }
  166 |     });
  167 |   });
  168 | }
  169 | 
  170 | /**
  171 |  * Probe an HTML5 required-field block. Returns the validation state.
  172 |  */
  173 | async function probeRequired(/** @type {import('@playwright/test').Locator} */ input) {
  174 |   return input.evaluate(
  175 |     /** @type {(el: HTMLInputElement) => {blocked: boolean, valueMissing: boolean, message: string}} */ ((el) => ({
  176 |       blocked: !el.checkValidity(),
  177 |       valueMissing: el.validity && el.validity.valueMissing === true,
  178 |       message: el.validationMessage || '',
  179 |     })),
  180 |   );
  181 | }
  182 | 
  183 | // ────────────────────────────────────────────────────────────────────────────
  184 | // Suite
  185 | // ────────────────────────────────────────────────────────────────────────────
  186 | test.describe(`FR-03 Forgot Password & Reset — Run by: ${STUDENT_ID}`, () => {
  187 |   test.beforeEach(async ({ page }) => {
  188 |     await page.goto(`${WEB_BASE}${ROUTES.forgot}`);
  189 |     await expect(page).toHaveURL(
  190 |       new RegExp(ROUTES.forgot.replace('/', '\\/')),
  191 |     );
  192 |   });
  193 | 
  194 |   // ── DATA LOOP ─────────────────────────────────────────────────────────────
  195 |   for (const tc of cases) {
  196 |     test(`${tc.id} — ${tc.description}`, async ({ page, browserName }) => {
  197 |       // BUG-004 needs >5 min of real time. Default for the rest is 20 s.
  198 |       const ttl = tc.outcome === 'otp-expired'
  199 |         ? 10 * 60 * 1000
  200 |         : 20_000;
  201 |       test.setTimeout(ttl);
  202 | 
  203 |       // 1) Decide email + OTP. If the case says registerFreshUser, mint a
  204 |       //    throwaway account first.
  205 |       let email = tc.email;
  206 |       let otp = tc.otp;
  207 | 
  208 |       if (tc.registerFreshUser) {
  209 |         const fresh = await registerFreshUser(browserName);
  210 |         email = fresh.email;
  211 |       }
  212 | 
  213 |       // ───── STEP 1 ─────
  214 |       if (tc.step === 1) {
  215 |         const emailInput = inputAfter(page, 'Nhập Email của bạn');
  216 |         await expect(emailInput).toBeVisible({ timeout: 10_000 });
  217 | 
  218 |         if (tc.outcome === 'blocked-required') {
  219 |           // HTML5 `required` will block submit. Probe validity API.
  220 |           await emailInput.fill('');
  221 |           const state = await probeRequired(emailInput);
  222 |           expect(state.blocked).toBe(true);
  223 |           expect(state.valueMissing).toBe(true);
  224 |           await expect(page).toHaveURL(
  225 |             new RegExp(ROUTES.forgot.replace('/', '\\/')),
  226 |           );
  227 |           return;
  228 |         }
  229 | 
  230 |         await emailInput.fill(email);
  231 | 
  232 |         if (tc.outcome === 'alert-error') {
  233 |           const alertMsg = waitForAlert(page, tc.expectedAlertContains);
  234 |           await page.getByRole('button', { name: 'Lấy mã OTP' }).click();
  235 |           const msg = await alertMsg;
  236 |           // The SUT's alert text is "Lỗi: <err.message>"; we already asserted
  237 |           // it matches the expected substring. Also confirm we did NOT advance.
  238 |           await expect(page).toHaveURL(
  239 |             new RegExp(ROUTES.forgot.replace('/', '\\/')),
  240 |           );
  241 |           await expect(inputAfter(page, 'Nhập Email của bạn')).toBeVisible();
  242 |           expect(msg).toBeTruthy();
  243 |           return;
  244 |         }
  245 | 
  246 |         // ── OTP length must equal 6 (per spec) ──────────────────────────
  247 |         if (tc.outcome === 'otp-6-digit') {
  248 |           await page.getByRole('button', { name: 'Lấy mã OTP' }).click();
  249 |           const banner = page.getByText(/Mã OTP của bạn là:/);
  250 |           await expect(banner).toBeVisible({ timeout: 10_000 });
  251 |           const text = await banner.textContent();
  252 |           const match = text && text.match(/(\d+)/);
  253 |           if (!match) {
  254 |             throw new Error(`Could not read OTP from banner: ${text}`);
  255 |           }
  256 |           const otpFromBanner = match[1];
  257 |           // Spec requires 6 digits. If the banner exposes fewer, this fails.
  258 |           expect(
  259 |             otpFromBanner.length,
  260 |             'OTP must be 6 digits per spec',
> 261 |           ).toBe(6);
      |             ^ Error: OTP must be 6 digits per spec
  262 |           return;
  263 |         }
  264 | 
  265 |         // tc.outcome === 'step2'
  266 |         await page.getByRole('button', { name: 'Lấy mã OTP' }).click();
  267 |         await expect(page.getByText(/Mã OTP của bạn là:/)).toBeVisible({
  268 |           timeout: 10_000,
  269 |         });
  270 |         await expect(inputAfter(page, 'Mã OTP (4 số)')).toBeVisible();
  271 |         await expect(inputAfter(page, 'Mật khẩu mới')).toBeVisible();
  272 |         // No confirm-password field exists on the current SUT. This
  273 |         // assertion documents the *current* state; the strict spec
  274 |         // assertion lives in outcome === 'confirm-field-present' below.
  275 |         await expect(page.locator('label:has-text("Xác nhận")')).toHaveCount(0);
  276 |         return;
  277 |       }
  278 | 
  279 |       // ───── STEP 2 ─────
  280 |       if (!email) throw new Error(`Step-2 case ${tc.id} missing email`);
  281 | 
  282 |       // Reach step 2 via the real UI — exact path a real user would take.
  283 |       await inputAfter(page, 'Nhập Email của bạn').fill(email);
  284 |       await page.getByRole('button', { name: 'Lấy mã OTP' }).click();
  285 |       await expect(page.getByText(/Mã OTP của bạn là:/)).toBeVisible({
  286 |         timeout: 10_000,
  287 |       });
  288 | 
  289 |       // ── Confirm-password field must be present (per spec) ─────────────
  290 |       // The label "Xác nhận ..." must exist AND have a sibling input. This
  291 |       // fails on the current SUT because no confirm field is rendered.
  292 |       if (tc.outcome === 'confirm-field-present') {
  293 |         const confirmLabel = page.locator('label:has-text("Xác nhận")').first();
  294 |         await expect(
  295 |           confirmLabel,
  296 |           'step-2 must expose a confirm-password field',
  297 |         ).toBeVisible({ timeout: 5_000 });
  298 |         const confirmInput = confirmLabel.locator(
  299 |           'xpath=following-sibling::input[1]',
  300 |         );
  301 |         await expect(
  302 |           confirmInput,
  303 |           'confirm field must be a real input',
  304 |         ).toBeVisible();
  305 |         return;
  306 |       }
  307 | 
  308 |       // OTP resolution:
  309 |       //   "AUTO"  → read from the success banner (canonical source of truth)
  310 |       //   literal → use as-is (intentionally wrong OTPs, e.g. TC-FR03-007)
  311 |       //   ""      → used by TC-FR03-008 for HTML5-required block
  312 |       if (otp === 'AUTO') {
  313 |         const bannerText = await page
  314 |           .getByText(/Mã OTP của bạn là:/)
  315 |           .textContent();
  316 |         const match = bannerText && bannerText.match(/(\d{4})/);
  317 |         if (!match) {
  318 |           throw new Error(`Could not read OTP from banner: ${bannerText}`);
  319 |         }
  320 |         otp = match[1];
  321 |       }
  322 | 
  323 |       const otpInput = inputAfter(page, 'Mã OTP (4 số)');
  324 |       const pwInput = inputAfter(page, 'Mật khẩu mới');
  325 | 
  326 |       await expect(otpInput).toBeVisible();
  327 |       await expect(pwInput).toBeVisible();
  328 | 
  329 |       // ── OTP must expire after a long wait (per spec) ────────────────────
  330 |       if (tc.outcome === 'otp-expired') {
  331 |         const waitMs = Number(tc.waitBeforeSubmitMs) || 320_000;
  332 |         // The only acceptable use of page.waitForTimeout: SUT behaviour is
  333 |         // genuinely time-based, and we are validating the expiry invariant.
  334 |         // eslint-disable-next-line no-restricted-syntax
  335 |         await page.waitForTimeout(waitMs);
  336 | 
  337 |         // Re-fetch the OTP from the banner just before submit, in case the
  338 |         // SUT re-rendered the form during the long wait.
  339 |         const bannerText = await page
  340 |           .getByText(/Mã OTP của bạn là:/)
  341 |           .textContent();
  342 |         const match = bannerText && bannerText.match(/(\d{4})/);
  343 |         if (match) otp = match[1];
  344 | 
  345 |         await otpInput.fill(otp || '');
  346 |         await pwInput.fill(tc.newPassword || 'Strong Pass1');
  347 | 
  348 |         // Accept any wording that signals rejection: wrong OTP, expired token,
  349 |         // not found, etc. A success alert here means the expiry is missing.
  350 |         const rejected = waitForAlert(
  351 |           page,
  352 |           /(Mã OTP không đúng|hết hạn|expired|invalid|OTP sai)/i,
  353 |         ).catch(() => null);
  354 |         await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
  355 |         const rejectionMsg = await rejected;
  356 | 
  357 |         if (!rejectionMsg) {
  358 |           throw new Error(
  359 |             `OTP did NOT expire after ${waitMs / 1000}s — reset still succeeded. ` +
  360 |               `Expected an "expired / invalid OTP" alert.`,
  361 |           );
```