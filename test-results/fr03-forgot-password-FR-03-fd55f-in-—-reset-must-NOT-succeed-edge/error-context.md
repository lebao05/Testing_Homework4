# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fr03-forgot-password.spec.js >> FR-03 Forgot Password & Reset — Run by: 23127325 >> TC-FR03-B004 — resetToken must be rejected after a long wait (~5 min) — reset must NOT succeed
- Location: scripts\fr03-forgot-password.spec.js:196:5

# Error details

```
Error: OTP did NOT expire after 0.32s — reset still succeeded. Expected an "expired / invalid OTP" alert.
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
      - heading "Đăng Ký" [level=2] [ref=e12]
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]: Username
          - textbox [ref=e16]
        - generic [ref=e17]:
          - generic [ref=e18]: Mật khẩu
          - textbox [ref=e19]
        - link "Quên mật khẩu?" [ref=e21] [cursor=pointer]:
          - /url: /forgot-password
        - button "Sign In" [ref=e22] [cursor=pointer]
        - generic [ref=e23]:
          - text: Chưa có tài khoản?
          - link "Đăng ký ngay" [ref=e24] [cursor=pointer]:
            - /url: /register
  - contentinfo [ref=e25]: © 2026 EShop SUT. Dành cho mục đích kiểm thử.
```

# Test source

```ts
  258 |           expect(
  259 |             otpFromBanner.length,
  260 |             'OTP must be 6 digits per spec',
  261 |           ).toBe(6);
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
> 358 |           throw new Error(
      |                 ^ Error: OTP did NOT expire after 0.32s — reset still succeeded. Expected an "expired / invalid OTP" alert.
  359 |             `OTP did NOT expire after ${waitMs / 1000}s — reset still succeeded. ` +
  360 |               `Expected an "expired / invalid OTP" alert.`,
  361 |           );
  362 |         }
  363 |         await expect(page).toHaveURL(
  364 |           new RegExp(ROUTES.forgot.replace('/', '\\/')),
  365 |         );
  366 |         return;
  367 |       }
  368 | 
  369 |       // ── blocked-required: probe the correct field, leave the other filled
  370 |       if (tc.outcome === 'blocked-required') {
  371 |         const blockedField = tc.blockedField === 'password' ? pwInput : otpInput;
  372 | 
  373 |         // Fill whichever field is *not* the one we're testing.
  374 |         if (blockedField === otpInput) {
  375 |           await pwInput.fill(tc.newPassword || 'Strong Pass1');
  376 |         } else {
  377 |           // Need a real-looking 4-digit OTP for the OTP field.
  378 |           if (otp === undefined || otp === '' || otp === 'AUTO') otp = '1234';
  379 |           await otpInput.fill(otp);
  380 |         }
  381 | 
  382 |         const state = await probeRequired(blockedField);
  383 |         expect(state.blocked, 'HTML5 validation must block submit').toBe(true);
  384 |         expect(state.valueMissing, 'valueMissing must be true').toBe(true);
  385 |         await expect(page).toHaveURL(
  386 |           new RegExp(ROUTES.forgot.replace('/', '\\/')),
  387 |         );
  388 |         // The other field is still filled (sanity)
  389 |         if (blockedField === otpInput) {
  390 |           await expect(pwInput).toHaveValue(tc.newPassword || 'Strong Pass1');
  391 |         } else {
  392 |           await expect(otpInput).toHaveValue(otp);
  393 |         }
  394 |         return;
  395 |       }
  396 | 
  397 |       // ── Normal step-2 submit
  398 |       await otpInput.fill(otp !== undefined ? otp : '');
  399 |       await pwInput.fill(tc.newPassword !== undefined ? tc.newPassword : '');
  400 | 
  401 |       if (tc.outcome === 'alert-error') {
  402 |         const alertMsg = waitForAlert(page, tc.expectedAlertContains);
  403 |         await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
  404 |         await alertMsg;
  405 |         // Still on step 2 (OTP + newPassword fields still visible)
  406 |         await expect(otpInput).toBeVisible();
  407 |         await expect(pwInput).toBeVisible();
  408 |         await expect(page).toHaveURL(
  409 |           new RegExp(ROUTES.forgot.replace('/', '\\/')),
  410 |         );
  411 |         return;
  412 |       }
  413 | 
  414 |       // ── tc.outcome === 'success-redirect'
  415 |       //     SUT fires alert("Đổi mật khẩu thành công!") then navigate('/login').
  416 |       //     The dialog blocks navigation until dismissed.
  417 |       const navigated = page.waitForURL(
  418 |         new RegExp(ROUTES.login.replace('/', '\\/')),
  419 |         { timeout: 10_000 },
  420 |       );
  421 |       const successDialog = waitForSuccessAlert(page);
  422 |       await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
  423 |       await Promise.all([navigated, successDialog]);
  424 |       await expect(page).toHaveURL(
  425 |         new RegExp(ROUTES.login.replace('/', '\\/')),
  426 |       );
  427 | 
  428 |       // ── End-to-end: log in with the new credentials to prove the reset worked.
  429 |       const usernameInput = page
  430 |         .locator('label:has-text("Username")')
  431 |         .locator('xpath=following-sibling::input[1]');
  432 |       const passwordInput = page
  433 |         .locator('label:has-text("Mật khẩu")')
  434 |         .locator('xpath=following-sibling::input[1]');
  435 | 
  436 |       await expect(usernameInput).toBeVisible();
  437 |       await usernameInput.fill(email);
  438 |       await passwordInput.fill(tc.newPassword);
  439 | 
  440 |       // Login fires window.alert('Đăng nhập thất bại...') on bad creds.
  441 |       // If it fires, we want to see the failure (not swallow it).
  442 |       const loginAlert = waitForAlert(page, /Đăng nhập thất bại/).catch(() => null);
  443 |       await page.getByRole('button', { name: 'Sign In' }).click();
  444 | 
  445 |       const failureAlert = await loginAlert;
  446 |       if (failureAlert) {
  447 |         throw new Error(
  448 |           `Login after reset unexpectedly failed for ${email}: ${failureAlert}`,
  449 |         );
  450 |       }
  451 | 
  452 |       await expect(page).toHaveURL(`${WEB_BASE}/`, { timeout: 10_000 });
  453 |       await expect(page.getByText(/Chào,/)).toBeVisible({ timeout: 10_000 });
  454 |     });
  455 |   }
  456 | });
```