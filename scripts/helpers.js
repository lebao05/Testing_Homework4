// @ts-check
/**
 * Shared helpers for the FR-03 / FR-11 / FR-13 specs.
 *
 * - `registerFreshUser`  — POST /api/register, returns credentials.
 * - `loginViaApi`       — POST /api/login, returns the JWT.
 * - `seedOrders`        — mint N orders via /api/checkout, optionally flip
 *                          their status through the admin endpoint.
 * - `inputAfter`        — label-anchored locator (no `id`, no position).
 * - `waitForAlert`      — resolve next alert dialog and assert its message.
 * - `loginViaUi`        — drive /login through the real form (for FR-03).
 *
 * All helpers avoid fragile selectors (no XPath position indices, no
 * `placeholder=`), avoid `waitForTimeout`, and assert on observable state.
 */

const { request, expect } = require('@playwright/test');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

const ADMIN_EMAIL = 'admin@eshop.com';
const ADMIN_PASSWORD = 'Admin123!';
const SEED_EMAIL = 'test@eshop.com';
const SEED_PASSWORD = 'Test1234!';

/**
 * Register a throwaway user via /api/register. Returns { email, password }.
 * @param {string} suffix  - usually browser name to keep emails unique per worker
 */
async function registerFreshUser(suffix) {
  const ctx = await request.newContext({ baseURL: API_BASE });
  try {
    const email = `${suffix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@eshop.test`;
    const password = 'Seed Pass1'; // satisfies the SUT's whitespace-required regex
    const res = await ctx.post('/api/register', {
      data: { name: 'HW04 Fresh', email, password },
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
 * Login via /api/login and return the JWT.
 * @param {string} email
 * @param {string} password
 */
async function loginViaApi(email, password) {
  const ctx = await request.newContext({ baseURL: API_BASE });
  try {
    const res = await ctx.post('/api/login', { data: { email, password } });
    if (!res.ok()) {
      throw new Error(
        `Failed to login ${email}: ${res.status()} ${await res.text()}`,
      );
    }
    const body = await res.json();
    if (!body.token) throw new Error(`Login ${email} returned no token`);
    return /** @type {string} */ (body.token);
  } finally {
    await ctx.dispose();
  }
}

/**
 * Login a fresh user end-to-end (register + login) and return both the
 * credentials AND the JWT — useful when the test wants to drive the UI as
 * that fresh user.
 */
async function registerAndLogin(suffix) {
  const creds = await registerFreshUser(suffix);
  const token = await loginViaApi(creds.email, creds.password);
  return { ...creds, token };
}

/**
 * Mint N orders for the given user via POST /api/checkout.
 * The SUT sets `status='pending'` for every new order.
 *
 * Returns the array of new order IDs (ints).
 *
 * @param {string} token  - user JWT
 * @param {number} count
 * @param {number} totalAmount
 */
async function seedOrders(token, count, totalAmount = 100_000) {
  const ctx = await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  try {
    const ids = /** @type {number[]} */ ([]);
    for (let i = 0; i < count; i++) {
      const res = await ctx.post('/api/checkout', {
        data: {
          total_amount: totalAmount + i * 1000,
          shipping_address: `Seed address ${i + 1}`,
        },
      });
      if (!res.ok()) {
        throw new Error(
          `Failed to seed order ${i + 1}: ${res.status()} ${await res.text()}`,
        );
      }
      const body = await res.json();
      if (typeof body.orderId === 'number') ids.push(body.orderId);
    }
    return ids;
  } finally {
    await ctx.dispose();
  }
}

/**
 * Flip an order to a target status using the admin endpoint
 *   PUT /api/admin/orders/:id/status   body={ status }
 * The admin endpoint enforces a state machine:
 *   pending  → confirmed | canceled
 *   confirmed→ shipping  | canceled
 *   shipping → delivered
 *
 * @param {number} orderId
 * @param {string} targetStatus  one of: pending|confirmed|shipping|delivered|canceled
 */
async function adminSetOrderStatus(orderId, targetStatus) {
  const adminToken = await loginViaApi(ADMIN_EMAIL, ADMIN_PASSWORD);
  const ctx = await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${adminToken}` },
  });
  try {
    // Walk the state machine if the current status is unknown.
    const chain = ['pending', 'confirmed', 'shipping', 'delivered'];
    const targetIndex = chain.indexOf(targetStatus);
    if (targetIndex < 0) {
      // canceled can be set from pending or confirmed directly.
      const res = await ctx.put(`/api/admin/orders/${orderId}/status`, {
        data: { status: targetStatus },
      });
      if (!res.ok()) {
        throw new Error(
          `Failed to set order ${orderId} -> ${targetStatus}: ${res.status()} ${await res.text()}`,
        );
      }
      return;
    }
    for (let i = 1; i <= targetIndex; i++) {
      const res = await ctx.put(`/api/admin/orders/${orderId}/status`, {
        data: { status: chain[i] },
      });
      if (!res.ok()) {
        throw new Error(
          `Failed to set order ${orderId} -> ${chain[i]}: ${res.status()} ${await res.text()}`,
        );
      }
    }
  } finally {
    await ctx.dispose();
  }
}

/**
 * Cancel an order as the owning user (PUT /api/orders/:id/cancel).
 * @param {string} userToken
 * @param {number} orderId
 */
async function userCancelOrder(userToken, orderId) {
  const ctx = await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${userToken}` },
  });
  try {
    const res = await ctx.put(`/api/orders/${orderId}/cancel`, { data: {} });
    return { ok: res.ok(), body: await res.text() };
  } finally {
    await ctx.dispose();
  }
}

/**
 * Get the list of orders for a user (used for setup assertion).
 * @param {string} userToken
 */
async function listOrdersForUser(userToken) {
  const ctx = await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${userToken}` },
  });
  try {
    const res = await ctx.get('/api/orders/my-orders');
    if (!res.ok()) {
      throw new Error(`list orders failed: ${res.status()} ${await res.text()}`);
    }
    return /** @type {Array<{id:number,total_amount:number,status:string,shipping_address:string,created_at:string}>} */ (
      await res.json()
    );
  } finally {
    await ctx.dispose();
  }
}

/**
 * Drive the /login form via the real UI (used by FR-03 success-redirect tests).
 * Returns nothing — the caller asserts on the resulting URL.
 */
async function loginViaUi(page, email, password) {
  await page.locator('label:has-text("Username")')
    .locator('xpath=following-sibling::input[1]')
    .fill(email);
  await page.locator('label:has-text("Mật khẩu")')
    .locator('xpath=following-sibling::input[1]')
    .fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

/**
 * Inject an authenticated session by writing the JWT into localStorage
 * and navigating to /profile. The SUT reads `useAuth()` from React context,
 * which is rebuilt from localStorage on page load.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} token
 * @param {{email:string,name?:string,id?:number}} user  minimal user info
 */
async function injectAuth(page, token, user) {
  await page.addInitScript(
    ({ t, u }) => {
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    },
    { t: token, u: user },
  );
}

/**
 * Label-anchored input locator. Survives any styling change; the only
 * assumption is that the JSX renders the label and the input as siblings.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} labelText
 */
function inputAfter(page, labelText) {
  return page
    .locator(`label:has-text("${labelText}")`)
    .locator('xpath=following-sibling::input[1]');
}

/**
 * Wait for the next alert dialog, assert its message (regex or substring),
 * then dismiss it. Resolves with the message.
 *
 * @param {import('@playwright/test').Page} page
 * @param {RegExp|string} [expected]
 */
function waitForAlert(page, expected) {
  return /** @type {Promise<string>} */ (
    new Promise((resolve, reject) => {
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
    })
  );
}

module.exports = {
  API_BASE,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SEED_EMAIL,
  SEED_PASSWORD,
  registerFreshUser,
  loginViaApi,
  registerAndLogin,
  seedOrders,
  adminSetOrderStatus,
  userCancelOrder,
  listOrdersForUser,
  loginViaUi,
  injectAuth,
  inputAfter,
  waitForAlert,
};