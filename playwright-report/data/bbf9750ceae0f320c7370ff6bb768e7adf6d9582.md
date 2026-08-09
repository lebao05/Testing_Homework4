# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fr03-forgot-password.spec.js >> FR-03 Forgot Password & Reset — Run by: 23127325 >> TC-FR03-B003 — password 'Password1!' (10 chars, upper+lower+digit+special) must be accepted
- Location: scripts\fr03-forgot-password.spec.js:196:5

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /Đổi mật khẩu thành công/
Received string:  "Mật khẩu quá yếu! Phải dài tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và KÝ TỰ ĐẶC BIỆT."
```

```
Error: expect(received).toMatch(expected)

Expected pattern: /Đổi mật khẩu thành công/
Received string:  "Mật khẩu quá yếu! Phải dài tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và KÝ TỰ ĐẶC BIỆT."
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
        - generic [ref=e14]: "Mã OTP của bạn là: 6050"
        - generic [ref=e15]:
          - generic [ref=e16]: Mã OTP (4 số)
          - textbox [ref=e17]: "6050"
        - generic [ref=e18]:
          - generic [ref=e19]: Mật khẩu mới
          - textbox [ref=e20]: Password1!
        - button "Đặt lại mật khẩu" [active] [ref=e21] [cursor=pointer]
        - button "← Quay lại" [ref=e22] [cursor=pointer]
  - contentinfo [ref=e23]: © 2026 EShop SUT. Dành cho mục đích kiểm thử.
```

# Test source

```ts
  59  | };
  60  | 
  61  | // ────────────────────────────────────────────────────────────────────────────
  62  | // Load data file
  63  | // ────────────────────────────────────────────────────────────────────────────
  64  | const DATA_FILE = path.join(__dirname, '..', 'data', 'fr03-forgot-password.json');
  65  | const { cases } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  66  | 
  67  | // ────────────────────────────────────────────────────────────────────────────
  68  | // Helpers
  69  | // ────────────────────────────────────────────────────────────────────────────
  70  | 
  71  | /**
  72  |  * Register a throwaway user so we never mutate the shared SUT password
  73  |  * for the seed account (test@eshop.com). Returns the new credentials.
  74  |  *
  75  |  * @param {string} suffix  - usually browser name, to keep emails unique per worker
  76  |  */
  77  | async function registerFreshUser(suffix) {
  78  |   const ctx = await request.newContext({ baseURL: API_BASE });
  79  |   try {
  80  |     const email = `fr03-${suffix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@eshop.test`;
  81  |     const password = 'Seed Pass1';
  82  |     const res = await ctx.post('/api/register', {
  83  |       data: { name: 'FR03 Fresh', email, password },
  84  |     });
  85  |     if (!res.ok()) {
  86  |       throw new Error(
  87  |         `Failed to register fresh user: ${res.status()} ${await res.text()}`,
  88  |       );
  89  |     }
  90  |     return { email, password };
  91  |   } finally {
  92  |     await ctx.dispose();
  93  |   }
  94  | }
  95  | 
  96  | /**
  97  |  * Stable selectors that survive the real JSX (no `id`, no `placeholder`):
  98  |  *   <label>Nhập Email của bạn</label>  →  following input
  99  |  *   <label>Mã OTP (4 số)</label>       →  following input
  100 |  *   <label>Mật khẩu mới</label>       →  following input
  101 |  */
  102 | function inputAfter(/** @type {import('@playwright/test').Page} */ page, /** @type {string} */ labelText) {
  103 |   return page
  104 |     .locator(`label:has-text("${labelText}")`)
  105 |     .locator('xpath=following-sibling::input[1]');
  106 | }
  107 | 
  108 | /**
  109 |  * Wait for the next alert dialog. Returns the message. Always dismisses
  110 |  * so subsequent navigation / renders are not blocked.
  111 |  *
  112 |  * @param {import('@playwright/test').Page} page
  113 |  * @param {RegExp|string} [expected]  - assertion on the message (regex or substring)
  114 |  * @returns {Promise<string>}
  115 |  */
  116 | function waitForAlert(page, expected) {
  117 |   return new Promise(/** @returns {void} */ (resolve, reject) => {
  118 |     const timer = setTimeout(
  119 |       () => reject(new Error('Timed out waiting for alert dialog')),
  120 |       10_000,
  121 |     );
  122 |     page.once('dialog', async (dialog) => {
  123 |       clearTimeout(timer);
  124 |       try {
  125 |         expect(dialog.type()).toBe('alert');
  126 |         const msg = dialog.message();
  127 |         if (expected instanceof RegExp) {
  128 |           expect(msg, 'alert message').toMatch(expected);
  129 |         } else if (typeof expected === 'string' && expected.length > 0) {
  130 |           expect(msg, 'alert message').toContain(expected);
  131 |         }
  132 |         await dialog.dismiss();
  133 |         resolve(msg);
  134 |       } catch (err) {
  135 |         await dialog.dismiss().catch(() => {});
  136 |         reject(err);
  137 |       }
  138 |     });
  139 |   });
  140 | }
  141 | 
  142 | /**
  143 |  * Wait for the success alert ("Đổi mật khẩu thành công!"). The SUT calls
  144 |  * alert() *before* navigate('/login'), so dismissing unblocks navigation.
  145 |  *
  146 |  * @param {import('@playwright/test').Page} page
  147 |  * @returns {Promise<void>}
  148 |  */
  149 | function waitForSuccessAlert(page) {
  150 |   return new Promise(/** @returns {void} */ (resolve, reject) => {
  151 |     const timer = setTimeout(
  152 |       () => reject(new Error('Timed out waiting for success alert')),
  153 |       10_000,
  154 |     );
  155 |     page.once('dialog', async (dialog) => {
  156 |       clearTimeout(timer);
  157 |       try {
  158 |         expect(dialog.type()).toBe('alert');
> 159 |         expect(dialog.message()).toMatch(/Đổi mật khẩu thành công/);
      |                                  ^ Error: expect(received).toMatch(expected)
  160 |         await dialog.dismiss();
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
```