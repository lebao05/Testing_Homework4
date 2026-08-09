# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fr13-dashboard.spec.js >> FR-13 Dashboard (admin) — Run by: 23127325 >> TC-FR13-006 — adding N pending orders increases the dashboard's total order count by exactly N
- Location: scripts\fr13-dashboard.spec.js:191:5

# Error details

```
Error: order count delta must equal 3

expect(received).toBe(expected) // Object.is equality

Expected: 3
Received: 9
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - generic [ref=f1e4]:
    - heading "EShop Admin" [level=1] [ref=f1e5]
    - list [ref=f1e6]:
      - listitem [ref=f1e7] [cursor=pointer]: Dashboard
      - listitem [ref=f1e8] [cursor=pointer]: Danh mục
      - listitem [ref=f1e9] [cursor=pointer]: Sản phẩm
      - listitem [ref=f1e10] [cursor=pointer]: Mã Giảm Giá
      - listitem [ref=f1e11] [cursor=pointer]: Đơn hàng
      - listitem [ref=f1e12] [cursor=pointer]: Người dùng
      - listitem [ref=f1e13] [cursor=pointer]: Đăng xuất
  - generic [ref=f1e15]:
    - heading "Dashboard" [level=2] [ref=f1e16]
    - generic [ref=f1e17]:
      - generic [ref=f1e18]:
        - heading "Tổng doanh thu (Delivered)" [level=3] [ref=f1e19]
        - paragraph [ref=f1e20]: 1,400,000 ₫
      - generic [ref=f1e21]:
        - heading "Tổng số đơn hàng" [level=3] [ref=f1e22]
        - paragraph [ref=f1e23]: "39"
```

# Test source

```ts
  189 | test.describe(`FR-13 Dashboard (admin) — Run by: ${STUDENT_ID}`, () => {
  190 |   for (const tc of cases) {
  191 |     test(`${tc.id} — ${tc.description}`, async ({ page, browserName }) => {
  192 |       test.setTimeout(30_000);
  193 | 
  194 |       // ── 1) Auth setup ───────────────────────────────────────────────────
  195 |       let adminToken = null;
  196 | 
  197 |       switch (tc.outcome) {
  198 |         case 'auth-required':
  199 |           // No inject. Navigate directly.
  200 |           await page.goto(ADMIN_BASE);
  201 |           await expect(adminLoginHeading(page)).toBeVisible({ timeout: 10_000 });
  202 |           await expect(emailInput(page)).toBeVisible();
  203 |           await expect(passwordInput(page)).toBeVisible();
  204 |           // Sidebar nav items must NOT be rendered before login.
  205 |           await expect(sidebarItem(page, 'Danh mục')).toHaveCount(0);
  206 |           // The expected text on the login card.
  207 |           await expect(page.getByText(tc.expectedText)).toBeVisible();
  208 |           return;
  209 | 
  210 |         case 'login-success':
  211 |           await page.goto(ADMIN_BASE);
  212 |           await expect(adminLoginHeading(page)).toBeVisible({ timeout: 10_000 });
  213 |           await loginAdminViaUi(page);
  214 |           await expect(dashboardHeader(page)).toBeVisible({ timeout: 15_000 });
  215 |           // The dashboard default-tab assertion: there are TWO elements
  216 |           // with the literal text "Dashboard" on the post-login page
  217 |           // (a sidebar nav item AND the page <h1> heading). Use
  218 |           // getByRole('heading', { exact: true }) so we hit ONLY the
  219 |           // <h1>/<h2> heading and not the nav text. A non-strict
  220 |           // getByText('Dashboard') would be ambiguous and toBeVisible()
  221 |           // would throw a strict-mode violation.
  222 |           await expect(
  223 |             page.getByRole('heading', { name: tc.expectedText, exact: true }),
  224 |           ).toBeVisible();
  225 |           return;
  226 | 
  227 |         case 'non-admin-login-blocked': {
  228 |           await page.goto(ADMIN_BASE);
  229 |           await expect(adminLoginHeading(page)).toBeVisible({ timeout: 10_000 });
  230 |           // Use the seeded non-admin user.
  231 |           const alertPromise = waitForAlert(page, tc.expectedText);
  232 |           await loginAdminViaUi(page, 'test@eshop.com', 'Test1234!');
  233 |           await alertPromise;
  234 |           // Dashboard must NOT be rendered.
  235 |           await expect(dashboardHeader(page)).toHaveCount(0);
  236 |           // And the login form must still be there.
  237 |           await expect(adminLoginHeading(page)).toBeVisible();
  238 |           return;
  239 |         }
  240 | 
  241 |         case 'bad-password': {
  242 |           await page.goto(ADMIN_BASE);
  243 |           await expect(adminLoginHeading(page)).toBeVisible({ timeout: 10_000 });
  244 |           const alertPromise = waitForAlert(page, tc.expectedText);
  245 |           await emailInput(page).fill('admin@eshop.com');
  246 |           await passwordInput(page).fill('WRONG-PASSWORD');
  247 |           await loginButton(page).click();
  248 |           await alertPromise;
  249 |           await expect(adminLoginHeading(page)).toBeVisible();
  250 |           await expect(dashboardHeader(page)).toHaveCount(0);
  251 |           return;
  252 |         }
  253 | 
  254 |         case 'header-visible':
  255 |           adminToken = await signInAsAdminForPage(page);
  256 |           await expect(page.getByText(tc.expectedText).first()).toBeVisible();
  257 |           return;
  258 | 
  259 |         case 'stat-card-visible':
  260 |           adminToken = await signInAsAdminForPage(page);
  261 |           if (tc.statCard === 'revenue') {
  262 |             await expect(revenueCard(page)).toBeVisible({ timeout: 5_000 });
  263 |             await expect(page.getByText(tc.expectedText)).toBeVisible();
  264 |           } else if (tc.statCard === 'orderCount') {
  265 |             await expect(orderCountCard(page)).toBeVisible({ timeout: 5_000 });
  266 |             await expect(page.getByText(tc.expectedText)).toBeVisible();
  267 |           } else {
  268 |             throw new Error(`Unknown statCard ${tc.statCard} in ${tc.id}`);
  269 |           }
  270 |           return;
  271 | 
  272 |         case 'order-count-delta': {
  273 |           adminToken = await signInAsAdminForPage(page);
  274 |           const before = await readOrderCount(page);
  275 |           const beforeApi = await countAdminOrders(adminToken);
  276 |           // Sanity: API and DOM should agree (within timing tolerance).
  277 |           expect(before, 'initial DOM count vs API').toBe(beforeApi);
  278 | 
  279 |           await seedPendingOrders(
  280 |             tc.ordersToAdd,
  281 |             tc.seedAmount || 100_000,
  282 |           );
  283 |           await page.goto(ADMIN_BASE); // re-mount → refetch
  284 |           await expect(dashboardHeader(page)).toBeVisible({ timeout: 15_000 });
  285 |           const after = await readOrderCount(page);
  286 |           expect(
  287 |             after - before,
  288 |             `order count delta must equal ${tc.expectedDelta}`,
> 289 |           ).toBe(tc.expectedDelta);
      |             ^ Error: order count delta must equal 3
  290 |           return;
  291 |         }
  292 | 
  293 |         case 'revenue-unchanged-by-pending': {
  294 |           adminToken = await signInAsAdminForPage(page);
  295 |           const before = await readRevenue(page);
  296 |           await seedPendingOrders(
  297 |             tc.ordersToAdd,
  298 |             tc.seedAmount || 100_000,
  299 |           );
  300 |           await page.goto(ADMIN_BASE);
  301 |           await expect(dashboardHeader(page)).toBeVisible({ timeout: 15_000 });
  302 |           const after = await readRevenue(page);
  303 |           expect(
  304 |             after - before,
  305 |             'pending orders must not change revenue',
  306 |           ).toBe(tc.expectedDelta);
  307 |           return;
  308 |         }
  309 | 
  310 |         case 'revenue-delta-by-delivered': {
  311 |           adminToken = await signInAsAdminForPage(page);
  312 |           const before = await readRevenue(page);
  313 |           await seedOrdersAndFlip(
  314 |             tc.ordersToAdd,
  315 |             tc.orderStatus,
  316 |             tc.seedAmount || 100_000,
  317 |           );
  318 |           await page.goto(ADMIN_BASE);
  319 |           await expect(dashboardHeader(page)).toBeVisible({ timeout: 15_000 });
  320 |           const after = await readRevenue(page);
  321 |           expect(
  322 |             after - before,
  323 |             `revenue delta must equal ${tc.expectedDelta} (= amount × 2 × N)`,
  324 |           ).toBe(tc.expectedDelta);
  325 |           return;
  326 |         }
  327 | 
  328 |         case 'sidebar-visible':
  329 |           adminToken = await signInAsAdminForPage(page);
  330 |           // After login, the sidebar nav items appear.
  331 |           await expect(sidebarItem(page, 'Danh mục')).toBeVisible({ timeout: 5_000 });
  332 |           await expect(sidebarItem(page, 'Sản phẩm')).toBeVisible();
  333 |           await expect(sidebarItem(page, 'Đơn hàng')).toBeVisible();
  334 |           await expect(page.getByText(tc.expectedText).first()).toBeVisible();
  335 |           return;
  336 | 
  337 |         case 'tab-switch':
  338 |           adminToken = await signInAsAdminForPage(page);
  339 |           await sidebarItem(page, 'Đơn hàng').click();
  340 |           // The orders tab shows a unique heading "Quản lý Đơn hàng".
  341 |           await expect(
  342 |             page.getByRole('heading', { name: 'Quản lý Đơn hàng' }),
  343 |           ).toBeVisible({ timeout: 5_000 });
  344 |           // Dashboard header should no longer be the visible tab.
  345 |           // (We don't assert toHaveCount(0) because there may be other
  346 |           // h2s; we just confirm the new tab is active.)
  347 |           return;
  348 | 
  349 |         case 'currency-format':
  350 |           adminToken = await signInAsAdminForPage(page);
  351 |           await expect(revenueCard(page)).toBeVisible({ timeout: 5_000 });
  352 |           const text = (await revenueValue(page).textContent()) || '';
  353 |           // This test is about *format* (vi-VN shape + ₫ suffix), not
  354 |           // the *value* — the value is asserted by TC-FR13-008/009/010
  355 |           // and the bug detector TC-FR13-017. So we only check
  356 |           // structural properties:
  357 |           //   1. Contains at least one digit (it IS a number).
  358 |           //   2. Locale-grouped: digits separated by `.` or `,` at
  359 |           //      thousand boundaries. The rendered text must match
  360 |           //      vi-VN shape: at least one digit, optional grouping
  361 |           //      separators, then the ₫ glyph.
  362 |           const digits = text.replace(/\D/g, '');
  363 |           expect(
  364 |             digits.length,
  365 |             `revenue cell must contain digits, but SUT rendered "${text}"`,
  366 |           ).toBeGreaterThan(0);
  367 |           expect(
  368 |             text,
  369 |             `revenue cell must be vi-VN-shaped (digits with . or , grouping), ` +
  370 |               `but SUT rendered "${text}"`,
  371 |           ).toMatch(/\d[\d.,\s]*\s*₫/);
  372 |           expect(
  373 |             text,
  374 |             `revenue cell must end with ₫, but SUT rendered "${text}"`,
  375 |           ).toMatch(/₫\s*$/);
  376 |           return;
  377 | 
  378 |         case 'bug-detector-revenue-times-two': {
  379 |           // BUG-FR-13-001: dashboard revenue formula is incorrect.
  380 |           // Ground-truth = sum of total_amount of delivered orders.
  381 |           // This test asserts the SUT's displayed revenue equals the
  382 |           // correct sum — if they ever differ, the SUT is wrong.
  383 |           // The test does NOT encode any specific bug shape, so fixing
  384 |           // the formula (whatever the cause) makes the test pass.
  385 |           adminToken = await signInAsAdminForPage(page);
  386 | 
  387 |           // Ground truth from the API.
  388 |           const correctRevenue = await getCorrectAdminRevenue(adminToken);
  389 |           // SUT display from the dashboard's revenue cell.
```