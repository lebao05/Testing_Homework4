// @ts-check
/**
 * HW04 Playwright configuration (JavaScript)
 *
 * Multi-browser (Chrome / Edge / Firefox) — minimum 3 browsers.
 * Each feature runs on all three browsers → ≥ 9 browser runs in total.
 *
 * The HTML report visibly displays "Run by: {StudentID}" via:
 *   - the title template (HTML reporter)
 *   - project metadata embedded in every spec
 *   - a custom banner injected at page load time
 *
 * Required env vars (override via CI or .env):
 *   - STUDENT_ID     — your student ID, e.g. "25127001"
 *   - WEB_BASE_URL   — frontend web URL  (default http://localhost:5173)
 *   - ADMIN_BASE_URL — admin web URL   (default http://localhost:5174)
 *   - API_BASE_URL   — backend API URL  (default http://localhost:3000)
 *
 * Default credentials are the ones shipped with the EShop SUT:
 *   admin@eshop.com / Admin123!
 *   test@eshop.com  / Test1234!
 */

const { defineConfig, devices } = require('@playwright/test');

const STUDENT_ID = process.env.STUDENT_ID || '23127325';
const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:5173';
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || 'http://localhost:5174';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const ISO_TIMESTAMP = new Date().toISOString();

module.exports = defineConfig({
  testDir: './scripts',
  testMatch: /.*\.spec\.js$/,
  timeout: 15_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,        // shared SQLite SUT → sequential per project
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 5,
  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never',
      title: `HW04 EShop Automation — Run by: ${STUDENT_ID}`,
    }],
    ['json', { outputFile: 'reports/results.json' }],
  ],
  use: {
    baseURL: WEB_BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    extraHTTPHeaders: {
      'x-run-by': STUDENT_ID,
      'x-run-timestamp': ISO_TIMESTAMP,
    },
  },
  metadata: {
    studentId: STUDENT_ID,
    runTimestamp: ISO_TIMESTAMP,
    sut: 'EShop',
    homework: 'HW04-AI',
    features: ['FR03', 'FR11', 'FR13'],
    webBaseUrl: WEB_BASE_URL,
    adminBaseUrl: ADMIN_BASE_URL,
    apiBaseUrl: API_BASE_URL,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: WEB_BASE_URL,
        channel: 'chrome',
      },
      metadata: {
        studentId: STUDENT_ID,
        browser: 'Chrome',
        runTimestamp: ISO_TIMESTAMP,
      },
    },
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        baseURL: WEB_BASE_URL,
        channel: 'msedge',
      },
      metadata: {
        studentId: STUDENT_ID,
        browser: 'Edge',
        runTimestamp: ISO_TIMESTAMP,
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: WEB_BASE_URL,
      },
      metadata: {
        studentId: STUDENT_ID,
        browser: 'Firefox',
        runTimestamp: ISO_TIMESTAMP,
      },
    },
  ],
});