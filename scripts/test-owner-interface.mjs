import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const pw = await import(process.env.TONEVAULT_PLAYWRIGHT_MODULE || "playwright");
const base = process.env.TONEVAULT_TEST_BASE || "http://localhost:3000";
const evidence = resolve(process.env.TONEVAULT_OWNER_EVIDENCE || "docs/evidence/owner-interface");
await mkdir(evidence, { recursive: true });
const results = [];
try {
  for (const engine of ["chromium", "webkit"]) for (const width of [1440, 390]) for (const reduced of [false, true]) {
    const browser = await pw[engine].launch(engine === "chromium" && process.env.TONEVAULT_BROWSER_EXECUTABLE ? { executablePath: process.env.TONEVAULT_BROWSER_EXECUTABLE } : {});
    try {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference" });
      const errors = [], api = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      page.on("request", request => { if (request.url().startsWith(base + "/api/")) api.push(request.url()); });
      await page.goto(base + "/owner");
      await page.getByRole("heading", { name: "Your storefront", exact: true }).waitFor();
      assert.deepEqual(await page.locator(".owner-metrics dt").allTextContents(), ["Total orders", "Total revenue", "Average order value", "Top-selling instrument", "Low-stock instruments"]);
      assert.equal(await page.locator(".metric-unavailable").count(), 5);
      await page.getByText("Owner access is not connected. Business metrics and private orders are unavailable.", { exact: true }).waitFor();
      assert.equal(await page.getByRole("columnheader").count(), 5);
      await page.getByRole("heading", { name: "Orders unavailable", exact: true }).waitFor();
      const nav = page.getByRole("navigation", { name: "Owner dashboard navigation", exact: true });
      await nav.getByRole("link", { name: "Orders", exact: true }).click();
      await page.waitForURL(base + "/owner#orders");
      await nav.getByRole("link", { name: "Overview", exact: true }).click();
      await page.waitForURL(base + "/owner#overview");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (engine === "chromium" && !reduced) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: join(evidence, `${width}-owner.png`), fullPage: true, caret: "initial" });
      }
      assert.deepEqual(api, []);
      await page.getByRole("link", { name: "Find a saved order", exact: true }).click();
      await page.getByRole("heading", { name: "Find your saved order", exact: true }).waitFor();
      // Start from a known control; native Safari Tab order depends on user settings.
      const reference = page.getByRole("textbox", { name: "Order reference", exact: true });
      await reference.focus();
      await page.keyboard.type("invalid-reference");
      await page.keyboard.press("Enter");
      await page.getByText("Enter a valid saved order reference.", { exact: true }).waitFor();
      assert.deepEqual(errors, []);
      assert.deepEqual(api, []);
      results.push({ engine, width, reduced, passed: true, ownerDataRequests: 0 });
      console.log(`PASS owner ${engine} ${width}px reduced=${reduced}: five unavailable metrics, orders table, anchors/keyboard lookup, no private-data access.`);
    } finally { await browser.close(); }
  }
} finally {
  await writeFile(join(evidence, "results.json"), JSON.stringify({ results, note: "UI-only owner shell; zero hardcoded business values or privileged/private-data requests. Authenticated Member 5 APIs are pending." }, null, 2) + "\n");
}
