import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const pw = await import(process.env.TONEVAULT_PLAYWRIGHT_MODULE || "playwright");
const base = process.env.TONEVAULT_TEST_BASE || "http://localhost:3000";
const evidence = resolve(process.env.TONEVAULT_SEARCH_EVIDENCE || "docs/evidence/challenge-3/after");
await mkdir(evidence, { recursive: true });
const results = [];
const realOnly = process.env.TONEVAULT_TEST_REAL_ONLY === "true";
const engines = (process.env.TONEVAULT_TEST_ENGINES || "chromium,webkit").split(",");
const widths = (process.env.TONEVAULT_TEST_WIDTHS || "1440,390").split(",").map(Number);
try {
  for (const engine of engines) for (const width of widths) for (const reduced of [false, true]) {
    const browser = await pw[engine].launch(engine === "chromium" && process.env.TONEVAULT_BROWSER_EXECUTABLE ? { executablePath: process.env.TONEVAULT_BROWSER_EXECUTABLE } : {});
    try {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference", hasTouch: width < 640 });
      page.setDefaultTimeout(15000);
      const errors = [], writes = [], requests = [], cancelled = [], expectedFailures = [];
      let injectedError = false;
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => {
        if (message.type() !== "error") return;
        if (injectedError && message.location().url.includes("/api/products?query=error-fixture")) expectedFailures.push(message.text());
        else errors.push(message.text());
      });
      page.on("request", request => {
        if (request.url().startsWith(base + "/api/") && !["GET", "HEAD"].includes(request.method())) writes.push(request.method());
        if (request.url().startsWith(base + "/api/products?")) requests.push(new URL(request.url()).searchParams.get("query"));
      });
      page.on("requestfailed", request => { if (request.url().startsWith(base + "/api/products?")) cancelled.push(new URL(request.url()).searchParams.get("query")); });
      const catalog = await page.request.get(base + "/api/products?query=GI&limit=6");
      assert.equal(catalog.status(), 200);
      assert.notEqual(catalog.headers()["x-tonevault-data-source"], "local-sample", "This evidence must use real catalog data");
      const body = await catalog.json();
      assert.ok(body.products.some(product => product.brand === "Gibson"));
      const first = body.products.find(product => product.brand === "Gibson"), title = `${first.year} ${first.brand} ${first.model}`;
      const gibson = () => page.getByRole("option", { name: "Gibson, brand", exact: true });
      async function headerSearch() {
        if (width < 640) await page.getByRole("button", { name: "Open navigation", exact: true }).tap();
        const input = page.getByRole("combobox", { name: "Find your next guitar", exact: true });
        await input.click(); return input;
      }
      async function shot(name) {
        if (engine === "chromium" && !reduced) {
          await page.waitForTimeout(260);
          await page.screenshot({ path: join(evidence, `${width}-${name}.png`), caret: "initial" });
        }
      }
      await page.goto(base);
      await page.locator("main .product-card").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      let input = await headerSearch();
      await input.fill("G"); const before = requests.length; await page.waitForTimeout(300); assert.equal(requests.length, before);
      await input.fill("GI"); await page.getByText("Looking for instruments…", { exact: true }).waitFor();
      await gibson().waitFor();
      assert.equal(await input.getAttribute("aria-autocomplete"), "list");
      assert.equal(await input.evaluate(node => document.getElementById(node.getAttribute("aria-controls"))?.getAttribute("role")), "listbox");
      await input.press("ArrowDown");
      assert.equal(await gibson().getAttribute("aria-selected"), "true");
      assert.equal(await input.evaluate(node => node === document.activeElement), true);
      assert.equal(await page.locator('.catalog-suggestions[data-open="true"]').evaluate(node => getComputedStyle(node).transitionDuration === "0s"), reduced);
      const popupBox = await page.locator('.catalog-suggestions[data-open="true"]').boundingBox();
      assert.ok(popupBox.x >= 0 && popupBox.x + popupBox.width <= width + .5 && popupBox.y >= 0 && popupBox.y + popupBox.height <= 900.5);
      await shot(width < 640 ? "gi-mobile" : "gi-header");
      await page.getByRole("heading", { name: width < 640 ? "Explore ToneVault" : "Find your sound. Know its story.", exact: true }).click({ position: { x: 5, y: 5 } });
      assert.equal(await input.getAttribute("aria-expanded"), "false");
      await input.click(); await gibson().waitFor(); await input.press("ArrowDown");
      await input.press("End"); await input.press("Home");
      assert.equal(await gibson().getAttribute("aria-selected"), "true");
      await input.press("Escape"); assert.equal(await input.getAttribute("aria-expanded"), "false"); assert.equal(await input.inputValue(), "GI");
      if (width < 640) {
        await page.waitForTimeout(280);
        assert.equal(await page.getByRole("dialog", { name: "Explore ToneVault", exact: true }).evaluate(node => node.open), true);
        assert.equal(await page.getByRole("button", { name: "Open navigation", exact: true }).getAttribute("aria-expanded"), "true");
      }
      await input.press("Enter"); await page.waitForURL(url => url.pathname === "/browse" && url.searchParams.get("query") === "GI");
      input = await headerSearch(); await input.fill("GI"); await gibson().waitFor(); await input.press("ArrowDown"); await input.press("Enter");
      await page.waitForURL(url => url.searchParams.get("brand") === "Gibson" && !url.searchParams.has("query"));
      input = await headerSearch(); await input.fill("GI"); await gibson().waitFor();
      const listing = page.getByRole("option", { name: `${title}, instrument`, exact: true });
      if (width < 640) await listing.tap(); else await listing.click();
      await page.waitForURL(base + "/products/" + first.id); await page.getByRole("heading", { name: title, exact: true }).waitFor();

      await page.goto(base + "/browse?search=old&minPrice=0&maxPrice=500000&offset=0");
      input = page.getByRole("combobox", { name: "Search instruments", exact: true }); await input.fill("GI"); await gibson().waitFor(); await shot("gi-browse");
      if (width < 640) await gibson().tap(); else await gibson().click();
      await page.waitForURL(url => url.searchParams.get("brand") === "Gibson" && !url.searchParams.has("search") && !url.searchParams.has("offset"));
      const url = new URL(page.url()); assert.equal(url.searchParams.get("minPrice"), "0"); assert.equal(url.searchParams.get("maxPrice"), "500000");
      for (const label of ["Brand", "Price", "Verification", "Condition", "Availability"]) assert.equal(await page.getByRole("combobox", { name: label, exact: true }).evaluate(node => node.tagName), "BUTTON");
      await page.getByRole("combobox", { name: "Brand", exact: true }).click(); await page.getByRole("option", { name: "PRS", exact: true }).click();
      await page.waitForURL(url => url.searchParams.get("brand") === "PRS" && url.searchParams.get("maxPrice") === "500000");
      if (width >= 1024) {
        const nav = page.getByRole("navigation", { name: "Main navigation", exact: true });
        assert.equal(await page.locator(".nav-surface").count(), 0);
        for (const name of ["Browse", "Verified", "Collection"]) {
          const trigger = name === "Collection" ? nav.getByRole("button", { name, exact: true }) : nav.getByRole("link", { name, exact: true });
          const style = () => trigger.evaluate(node => ({ background: getComputedStyle(node).backgroundColor, transform: getComputedStyle(node).transform }));
          const original = await style(); await trigger.hover(); assert.deepEqual(await style(), original);
        }
        await nav.getByRole("button", { name: "Collection", exact: true }).click();
        const option = page.getByRole("region", { name: "Collection links", exact: true }).getByRole("link", { name: "Gibson", exact: true });
        await option.hover(); await page.waitForFunction(() => getComputedStyle(document.querySelector('#collection-popover a[href="/browse?brand=Gibson"]')).backgroundColor === "rgb(237, 242, 233)");
        assert.equal(await option.evaluate(node => getComputedStyle(node).transitionDuration === "0s"), reduced);
        await page.keyboard.press("Escape");
      }

      let negativeStates = false;
      if (!realOnly && engine === "chromium" && width === 1440 && !reduced) {
        negativeStates = true;
        input = await headerSearch();
        const start = requests.length;
        await input.fill("G"); await input.fill("GI"); await page.waitForTimeout(50); await input.fill("GIB"); await gibson().waitFor();
        assert.deepEqual(requests.slice(start), ["GIB"]);
        await input.fill("tonevault-no-match-for-challenge3"); await page.getByText("No suggestions. You can still submit your search.", { exact: true }).waitFor();
        await input.press("Enter"); await page.waitForURL(url => url.searchParams.get("query") === "tonevault-no-match-for-challenge3");
        input = await headerSearch();
        const delayed = async route => {
          if (new URL(route.request().url()).searchParams.get("query") !== "GI") return route.continue();
          const response = await route.fetch(); await new Promise(resolve => setTimeout(resolve, 700));
          try { await route.fulfill({ response }); } catch { /* The UI cancels this old request. */ }
        };
        await page.route("**/api/products?*", delayed);
        const started = page.waitForRequest(request => new URL(request.url()).searchParams.get("query") === "GI");
        await input.fill("GI"); await started; await input.fill("FE");
        await page.getByRole("option", { name: "Fender, brand", exact: true }).waitFor(); await page.waitForTimeout(800);
        assert.equal(await gibson().count(), 0); assert.equal(await input.inputValue(), "FE"); assert.ok(cancelled.includes("GI"));
        await page.unroute("**/api/products?*", delayed);
        injectedError = true;
        await page.route("**/api/products?query=error-fixture*", route => route.fulfill({ status: 500, json: { ok: false, error: "Injected browser-test failure" } }));
        await input.fill("error-fixture"); await page.getByText("Suggestions unavailable. You can still submit your search.", { exact: true }).waitFor();
        await input.press("Enter"); await page.waitForURL(url => url.searchParams.get("query") === "error-fixture");
      }
      assert.deepEqual(errors, []); assert.deepEqual(writes, []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      results.push({ engine, width, reduced, passed: true, dataSource: "supabase", realGibsonRecords: body.products.filter(product => product.brand === "Gibson").length, negativeStates, realOnly, apiWrites: 0, expectedInjectedErrors: expectedFailures.length });
      console.log(`PASS search ${engine} ${width}px reduced=${reduced}: real GI/Gibson, keyboard/Enter/Escape, listing click/touch, Browse filters and stable nav${negativeStates ? ", debounce/abort/empty/error" : ""}.`);
    } catch (error) {
      for (const context of browser.contexts()) for (const page of context.pages()) {
        console.log("Search failure context", { engine, width, reduced, url: page.url(), inputs: await page.locator('input[role="combobox"]').evaluateAll(nodes => nodes.map(node => ({ label: node.getAttribute("aria-label"), value: node.value, renderedValue: node.getAttribute("value"), expanded: node.getAttribute("aria-expanded"), focused: node === document.activeElement }))), visibleOptions: await page.getByRole("option").allTextContents() });
      }
      throw error;
    } finally { await browser.close(); }
  }
} finally {
  await writeFile(join(evidence, "results.json"), JSON.stringify({ results, note: realOnly ? "Agent-run real-catalog GET tests only. No API interception, delayed/error fixtures, order submissions or database writes. Historical fixtures were not rerun." : "Agent-run real-catalog GET tests. Delayed/error fixtures are isolated technical checks, not student observations or actual backend failures. No database writes." }, null, 2) + "\n");
}
