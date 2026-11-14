import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

// Optional external test tooling; no Playwright dependency is added to the app.
const browsers = await import(process.env.TONEVAULT_PLAYWRIGHT_MODULE || "playwright");
const base = "http://localhost:3000";
const evidence = resolve(process.env.TONEVAULT_EVIDENCE_DIR || "docs/evidence/local-preview");
await mkdir(evidence, { recursive: true });
const results = [];
const engines = (process.env.TONEVAULT_TEST_ENGINES || "chromium").split(",");
const id = (n) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const prsTitle = "2016 PRS Custom 24";

async function run(engine, width) {
  const browser = await browsers[engine].launch({ headless: true,
    ...(engine === "chromium" && process.env.TONEVAULT_BROWSER_EXECUTABLE ? { executablePath: process.env.TONEVAULT_BROWSER_EXECUTABLE } : {}),
  });
  try {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const pageErrors = [], consoleErrors = [], orderRequests = [];
    let negativeCase = false;
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error" && !negativeCase) consoleErrors.push(message.text()); });
    page.on("request", (request) => { if (request.url().endsWith("/api/orders") && request.method() === "POST") orderRequests.push(request.url()); });
    const api = await context.request.get(`${base}/api/products`);
    assert.equal(api.headers()["x-tonevault-data-source"], "local-sample", "Refuse order tests unless server explicitly identifies sample data");
    assert.equal((await api.json()).count, 7);
    const overflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${engine}/${width}: horizontal overflow on ${page.url()}`);
    async function shot(name) {
      const capture = (engine === "chromium" && (width === 1440 || width === 390)) || name === "cart";
      if (capture) await page.screenshot({ path: join(evidence, `${engine}-${width}-${name}.png`), fullPage: true, caret: "initial" });
    }
    async function count(n) { await page.waitForFunction((expected) => [...document.querySelectorAll('main a[href^="/products/"]')].filter((link) => link.getClientRects().length > 0).length === expected, n); }
    async function qty(n) { await page.waitForFunction((expected) => [...document.querySelectorAll('input[type="number"]')].find((input) => input.getClientRects().length > 0)?.value === String(expected), n); }
    async function decodedImages() {
      const images = page.locator("main img:visible");
      for (let i = 0; i < await images.count(); i++) { await images.nth(i).scrollIntoViewIfNeeded(); await images.nth(i).evaluate((image) => image.decode()); }
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    await page.goto(`${base}/`);
    await page.getByRole("heading", { name: "Find your sound. Know its story." }).waitFor();
    await page.getByRole("complementary", { name: "Sample data preview" }).waitFor();
    await decodedImages(); await overflow(); if (width === 1440) await shot("home");
    await page.getByRole("link", { name: "Browse the vault", exact: true }).click();
    await count(7); await decodedImages(); await overflow(); if (width === 1440) await shot("browse");
    await page.getByRole("combobox", { name: "Brand", exact: true }).selectOption("PRS"); await count(1);
    await page.getByRole("combobox", { name: "Price", exact: true }).selectOption("0-250000"); await count(1);
    await page.getByRole("combobox", { name: "Verification", exact: true }).selectOption("Unverified"); await count(1);
    await page.getByRole("combobox", { name: "Condition", exact: true }).selectOption("checking");
    await page.getByText("No instruments match these filters.", { exact: true }).waitFor();
    await page.getByRole("combobox", { name: "Condition", exact: true }).selectOption(""); await count(1);
    await page.getByRole("textbox", { name: "Search instruments" }).fill("no-such-guitar");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByText("No instruments match these filters.", { exact: true }).waitFor();
    await page.getByRole("textbox", { name: "Search instruments" }).fill("Custom 24");
    await page.getByRole("button", { name: "Search", exact: true }).click(); await count(1);
    await page.locator('main a[href^="/products/"]:visible').click();
    await page.getByRole("heading", { name: prsTitle, exact: true }).waitFor();
    const first = page.getByRole("button", { name: `Show photo 1 of ${prsTitle}`, exact: true });
    const second = page.getByRole("button", { name: `Show photo 2 of ${prsTitle}`, exact: true });
    await first.focus(); await page.keyboard.press("ArrowRight"); assert.equal(await second.getAttribute("aria-pressed"), "true");
    await page.keyboard.press("Home"); assert.equal(await first.getAttribute("aria-pressed"), "true");
    await page.keyboard.press("End"); assert.equal(await second.getAttribute("aria-pressed"), "true");
    await page.getByRole("button", { name: "Next photograph", exact: true }).click();
    assert.equal(await first.getAttribute("aria-pressed"), "true");
    await decodedImages(); await overflow(); if (width === 1440) await shot("detail");
    await page.getByRole("button", { name: "Add to cart", exact: true }).click();
    await page.getByRole("button", { name: "Open cart, 1 instruments", exact: true }).waitFor();
    await page.getByRole("button", { name: "Add another", exact: true }).click();
    await page.getByRole("button", { name: "Open cart, 2 instruments", exact: true }).waitFor();
    await page.getByRole("button", { name: "Buy now", exact: true }).click();
    await page.waitForURL(`${base}/cart`); await qty(2);
    const q = page.getByRole("spinbutton", { name: `Quantity for ${prsTitle}`, exact: true });
    const more = page.getByRole("button", { name: `Increase quantity for ${prsTitle}`, exact: true });
    const less = page.getByRole("button", { name: `Decrease quantity for ${prsTitle}`, exact: true });
    await more.click(); await qty(3); assert.equal(await more.isDisabled(), true);
    await less.click(); await qty(2);
    for (const invalid of ["0", "4", "1.5"]) {
      await q.fill(invalid); await q.blur();
      await page.getByText("Enter a whole number from 1 to 3.", { exact: true }).waitFor(); await qty(2);
    }
    await q.fill("1"); await q.press("Enter"); await qty(1); assert.equal(await less.isDisabled(), true);
    await more.click(); await qty(2);
    const summary = page.getByRole("complementary", { name: "Cart summary" });
    assert.equal(await summary.getByText("₱336,000", { exact: true }).count(), 2);
    assert.equal(await page.getByRole("button", { name: "Checkout unavailable", exact: true }).isDisabled(), true);
    await page.reload(); await qty(2); await decodedImages(); await overflow(); await shot("cart");
    await page.getByRole("button", { name: `Remove ${prsTitle}`, exact: true }).click();
    await page.getByRole("heading", { name: "Your cart is empty", exact: true }).waitFor();
    await overflow(); if (width === 390) await shot("empty-cart");
    await page.getByRole("link", { name: "Continue shopping", exact: true }).click();
    await page.getByRole("combobox", { name: "Availability", exact: true }).selectOption("sold"); await count(1);
    await page.locator('main a[href^="/products/"]:visible').click();
    await page.getByRole("heading", { name: "1961 Gibson SG Standard", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Buy now", exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Sold out", exact: true }).isDisabled(), true);
    await overflow(); if (width === 390) await shot("sold-out");
    await page.goto(`${base}/products/${id(1)}`);
    await page.getByRole("button", { name: "Buy now", exact: true }).click(); await qty(1);
    assert.equal(await page.getByRole("button", { name: /Increase quantity/ }).isDisabled(), true);
    await page.getByRole("button", { name: "Clear cart", exact: true }).click();
    await page.getByRole("heading", { name: "Your cart is empty", exact: true }).waitFor();
    assert.deepEqual(pageErrors, []); assert.deepEqual(consoleErrors, []); assert.deepEqual(orderRequests, []);

    if (engine === "chromium" && width === 1440) {
      negativeCase = true;
      const endpoint = `**/api/products/${id(1)}`;
      await page.route(endpoint, async (route) => { await new Promise((done) => setTimeout(done, 900)); await route.continue(); });
      await page.goto(`${base}/products/${id(1)}`);
      await page.locator('[role="status"][aria-busy="true"]').waitFor();
      await page.getByRole("heading", { name: "1965 Fender Stratocaster", exact: true }).waitFor(); await page.unroute(endpoint);
      await page.route(endpoint, (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ ok: false, error: "Injected browser test failure" }) }));
      await page.goto(`${base}/products/${id(1)}`);
      await page.getByRole("heading", { name: "Unable to load instrument", exact: true }).waitFor();
      await page.unroute(endpoint); await page.getByRole("button", { name: "Retry instrument", exact: true }).click();
      await page.getByRole("heading", { name: "1965 Fender Stratocaster", exact: true }).waitFor();
      await page.goto(`${base}/products/${id(99)}`);
      await page.getByRole("heading", { name: "Instrument not found", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Retry instrument", exact: true }).count(), 0);
      await page.route(endpoint, async (route) => { const original = await route.fetch(); const body = await original.json(); body.data.images = []; await route.fulfill({ json: body }); });
      await page.goto(`${base}/products/${id(1)}`); await page.getByText("No photography on file", { exact: true }).waitFor(); await page.unroute(endpoint);
      await page.route(endpoint, async (route) => { const original = await route.fetch(); const body = await original.json(); body.data.images = ["/preview/nonexistent-browser-test.jpg"]; await route.fulfill({ json: body }); });
      await page.goto(`${base}/products/${id(1)}`); await page.getByRole("img", { name: "Photograph 1 unavailable", exact: true }).waitFor(); await page.unroute(endpoint);
      const blocked = await context.request.post(`${base}/api/orders`, { data: { product_id: id(1), buyer_id: "20000000-0000-4000-8000-0000000000a1", quantity: 1 } });
      assert.equal(blocked.status(), 403); assert.match((await blocked.json()).error, /read-only/);
      assert.deepEqual(pageErrors, []);
    }
    results.push({ engine, width, passed: true, mainFlowPageErrors: pageErrors, mainFlowConsoleErrors: consoleErrors, negativeStatesTested: engine === "chromium" && width === 1440 });
    console.log(`PASS ${engine} ${width}px: Home/Browse/Detail/Cart; search/filters; gallery keyboard; Buy Now; quantity bounds/invalid edits; totals; refresh; remove/clear/empty; sold-out; image decoding; no overflow or unexpected main-flow errors.`);
    await context.close();
  } finally { await browser.close(); }
}

try {
  for (const engine of engines) for (const width of (engine === "webkit" ? [390] : [1440, 390, 320])) await run(engine, width);
} finally {
  await writeFile(join(evidence, "browser-results.json"), JSON.stringify({ runDate: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date()), timezone: "Asia/Manila", base, sampleOnly: true, results, note: "Automated Chromium/WebKit; not a physical phone, outside tester, or manually operated Safari." }, null, 2) + "\n");
}
