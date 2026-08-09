# HW04 – Automation Testing

23127325
Lê Gia Bảo

## Test Summary Report

| Metric | Value |
|---|---:|
| Number of features | 3 |
| Number of test cases automated | 55 |
| Number of test cases executed | 165 |
| Number of test cases passed | 153 |
| Number of test cases failed | 12 |
| Number of browser runs | 165 |
| Number of bugs | 4 |
| Pass rate | 92.7% |


---

## Self-Assessment

| Criterion | Self-Assessment | Evidence |
|---|---|---|
| AI-first process: AI was used to read test cases, generate JSON data, and generate Playwright scripts before human review. | Met | `data/*.json`; `scripts/*.spec.js`; process documented in commit history |
| All three features (FR-03, FR-11, FR-13) automated as data-driven Playwright specs. | Met | 3 specs × 19 / 19 / 17 cases = 55 cases total |
| JSON test data separated from implementation; adding a case is a JSON-only change. | Met | `data/` folder next to `scripts/` specs |
| Coverage of positive, negative, and boundary-value cases for each feature. | Met | Type column in `testcases.md` / `data/*.json` for every case |
| Multi-browser execution across Chromium, Firefox, Edge (≥ 3 browsers). | Met | 55 cases × 3 browsers = 165 browser runs |
| Playwright HTML reports available and identified by student ID (`23127325`). | Met | `STUDENT_ID` in `playwright.config.js` — "Run by: 23127325" in every report |
| Human review of AI-generated code; documented gaps and corrections. | Met | Locators & assertions were reviewed and corrected against the actual SUT |
| Bugs found during automation are reported as GitHub Issues. | Met | 4 issues filed (TC-FR03-B001, B002, B003, B004) |
| Total test count and pass/fail statistics are reported. | Met | Test Summary Report above — 165 executed, 153 passed, 12 failed |
| Demo video link provided. | **TODO** | Replace `[DEMO_VIDEO_LINK]` in Test Summary Report before submission |



Agent-Skill Demo Link:
Playwright Demo Link: