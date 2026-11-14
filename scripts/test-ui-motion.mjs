import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const browsers = await import(process.env.TONEVAULT_PLAYWRIGHT_MODULE || "playwright");
const evidence = resolve(process.env.TONEVAULT_MOTION_EVIDENCE || "docs/evidence/gc1-motion/after");
await mkdir(evidence, { recursive: true });
const results = [];
const engines = (process.env.TONEVAULT_TEST_ENGINES || "chromium,webkit").split(",");
const base = "http://localhost:3000";
const title = "2016 PRS Custom 24";
const productPath = "/products/20000000-0000-4000-8000-000000000005";
const wait = (page, predicate, arg) => page.waitForFunction(predicate, arg);

async function run(engine, width, reduced = false) {
  const browser = await browsers[engine].launch({ headless: true, ...(engine === "chromium" && process.env.TONEVAULT_BROWSER_EXECUTABLE ? { executablePath: process.env.TONEVAULT_BROWSER_EXECUTABLE } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference", hasTouch: width < 640 });
    const page = await context.newPage(); page.setDefaultTimeout(12000);
    const errors = [], consoleErrors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    const sample = await context.request.get(`${base}/api/products`);
    assert.equal(sample.headers()["x-tonevault-data-source"], "local-sample");
    const shot = async (name) => {
      if (engine !== "chromium" || reduced) return;
      const modalOpen = await page.locator("dialog").evaluate((node) => node.open);
      if (!modalOpen) await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(280);
      await page.screenshot({ path: join(evidence, `${width}-${name}.png`), fullPage: !modalOpen, caret: "initial" });
    };
    const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const closed = () => wait(page, () => !document.querySelector("dialog")?.open);

    await page.goto(`${base}/browse`); await page.getByRole("heading", { name: "Browse the vault", exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready.then(() => true));
    const style = await page.evaluate(() => ({ background: getComputedStyle(document.body).backgroundColor, weight: getComputedStyle(document.body).fontWeight, family: getComputedStyle(document.body).fontFamily }));
    assert.equal(style.background, "rgb(255, 255, 255)"); assert.equal(style.weight, "400"); assert.match(style.family, /dmSans/i);
    await noOverflow(); await shot("browse");
    if (width >= 1024) {
      const nav = page.getByRole("navigation", { name: "Main navigation", exact: true });
      const surface = page.locator('[data-testid="nav-hover-surface"]');
      await nav.getByRole("link", { name: "Verified", exact: true }).hover();
      await wait(page, () => Math.abs(new DOMMatrixReadOnly(getComputedStyle(document.querySelector('[data-testid="nav-hover-surface"]')).transform).m41 - 96) < .5);
      assert.ok(Math.abs(await surface.evaluate((node) => node.getBoundingClientRect().width) - 96) < .5);
      assert.equal(await nav.getByRole("link", { name: "Browse", exact: true }).getAttribute("aria-current"), "page");
      assert.equal(await surface.evaluate((node) => getComputedStyle(node).transitionProperty.includes("transform")), !reduced);
      const collection = nav.getByRole("button", { name: "Collection", exact: true });
      await collection.focus(); await page.keyboard.press("ArrowDown");
      const popover = page.getByRole("region", { name: "Collection links", exact: true }); await popover.waitFor();
      await wait(page, () => document.activeElement?.getAttribute("href") === "/browse" && Boolean(document.activeElement?.closest("#collection-popover")));
      await shot("dropdown"); await page.keyboard.press("Escape");
      assert.equal(await collection.evaluate((node) => node === document.activeElement), true);
      await collection.click(); await popover.waitFor();
      await page.getByRole("heading", { name: "Browse the vault", exact: true }).click();
      assert.equal(await collection.getAttribute("aria-expanded"), "false");
      await collection.click(); await popover.getByRole("link", { name: "PRS", exact: true }).click();
      await page.waitForURL(/brand=PRS/);
    } else {
      const openMenu = page.getByRole("button", { name: "Open navigation", exact: true });
      await openMenu.tap(); const menu = page.getByRole("dialog", { name: "Explore ToneVault", exact: true }); await menu.waitFor();
      const closeMenu = menu.getByRole("button", { name: "Close navigation", exact: true });
      assert.equal(await closeMenu.evaluate((node) => node === document.activeElement), true);
      for (let i = 0; i < 14; i++) { await page.keyboard.press("Tab"); assert.equal(await menu.evaluate((node) => node.contains(document.activeElement)), true); }
      await noOverflow(); await shot("mobile-menu"); await closeMenu.tap(); await closed();
      await wait(page, () => document.activeElement?.getAttribute("aria-label") === "Open navigation");
      await openMenu.tap(); await menu.getByRole("link", { name: "Verified", exact: true }).tap(); await closed(); await page.waitForURL(/verificationStatus=/);
    }

    await page.goto(`${base}${productPath}`); await page.getByRole("heading", { name: title, exact: true }).waitFor();
    await page.getByRole("button", { name: `Show photo 1 of ${title}`, exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    const thumbnail = page.getByRole("button", { name: `Show photo 2 of ${title}`, exact: true }); assert.equal(await thumbnail.getAttribute("aria-pressed"), "true");
    await wait(page, () => [...document.querySelectorAll('.gallery-image[data-visible="true"]')].some((image) => image.getAttribute("alt")?.includes("photo 2")));
    const transition = await page.locator('.gallery-image[data-visible="true"]').evaluate((node) => getComputedStyle(node).transitionDuration);
    assert.equal(transition === "0s", reduced);
    await noOverflow(); await shot("detail");
    await page.getByRole("button", { name: "Add to cart", exact: true }).click();
    await page.locator('.ui-toast[data-visible="true"]').waitFor();
    assert.match(await page.locator(".ui-toast").innerText(), /Added 2016 PRS/);
    const toast = await page.locator(".ui-toast").boundingBox(); const action = await page.getByRole("button", { name: "Add another", exact: true }).boundingBox();
    assert.equal(toast.x < action.x + action.width && toast.x + toast.width > action.x && toast.y < action.y + action.height && toast.y + toast.height > action.y, false, "Toast covers essential Add action");
    await page.getByRole("button", { name: "Dismiss cart confirmation", exact: true }).click();
    const cart = page.locator(".cart-trigger");
    // A fixed body reports scrollY 0 while locked, so assert what the user sees: nothing behind the drawer moves.
    const viewport = () => page.evaluate(() => ({ x: document.documentElement.clientWidth, y: scrollY, overflow: document.documentElement.style.overflow,
      mainTop: document.querySelector("main").getBoundingClientRect().top,
      headerTop: document.querySelector("header").getBoundingClientRect().top,
      body: Object.fromEntries(["position", "top", "left", "width", "overflow"].map(property => [property, document.body.style[property]])),
    }));
    const before = await viewport();
    await cart.click(); const drawer = page.getByRole("dialog", { name: /Your cart/ }); await drawer.waitFor();
    const close = drawer.getByRole("button", { name: "Close cart preview", exact: true }); assert.equal(await close.evaluate((node) => node === document.activeElement), true);
    const locked = await viewport();
    assert.equal(locked.x, before.x); assert.equal(locked.overflow, "hidden");
    assert.equal(locked.body.position, "fixed");
    assert.ok(Math.abs(locked.mainTop - before.mainTop) < .5, "Opening dialog moved the visible background");
    assert.ok(Math.abs(locked.headerTop - before.headerTop) < .5, "Opening dialog moved the header");
    assert.equal(await drawer.locator(".drawer-content").evaluate((node) => getComputedStyle(node).overflowY), "auto", "Drawer content must keep its own scrolling");
    await page.mouse.wheel(0, 500);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const afterWheel = await viewport();
    assert.equal(afterWheel.y, locked.y); assert.equal(afterWheel.mainTop, locked.mainTop);
    for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); assert.equal(await drawer.evaluate((node) => node.contains(document.activeElement)), true); }
    await close.focus(); await page.keyboard.press("Shift+Tab"); assert.equal(await drawer.evaluate((node) => node.contains(document.activeElement)), true);
    await drawer.getByRole("button", { name: `Increase quantity for ${title} in quick cart`, exact: true }).click();
    await wait(page, () => document.querySelector(".cart-count")?.textContent === "2");
    await noOverflow(); await shot("drawer"); await page.keyboard.press("Escape"); await closed();
    await wait(page, () => document.activeElement === document.querySelector(".cart-trigger"));
    const restored = await viewport();
    assert.equal(restored.overflow, before.overflow); assert.deepEqual(restored.body, before.body);
    assert.ok(Math.abs(restored.y - before.y) < .5, "Dismissal did not restore the original scroll position");
    const cartTwo = page.getByRole("button", { name: "Open cart, 2 instruments", exact: true });
    await cartTwo.click(); await drawer.waitFor();
    if (width >= 1024) { await page.mouse.click(20, 160); await closed(); await cartTwo.click(); await drawer.waitFor(); }
    await drawer.getByRole("link", { name: "Review cart", exact: true }).click(); await closed(); await page.waitForURL(`${base}/cart`);
    await wait(page, () => scrollY === 0);
    const quantity = page.getByRole("spinbutton", { name: `Quantity for ${title}`, exact: true }); await quantity.waitFor(); assert.equal(await quantity.inputValue(), "2");
    await page.reload(); await quantity.waitFor(); assert.equal(await quantity.inputValue(), "2");
    await page.getByRole("button", { name: `Increase quantity for ${title}`, exact: true }).click();
    await wait(page, () => document.querySelector('input[type="number"]')?.value === "3");
    await noOverflow(); await shot("cart");
    await page.getByRole("button", { name: `Remove ${title}`, exact: true }).click();
    await page.getByRole("heading", { name: "Your cart is empty", exact: true }).waitFor();
    await shot("empty-cart");
    assert.deepEqual(errors, []); assert.deepEqual(consoleErrors, []);
    results.push({ engine, width, reduced, passed: true, pageErrors: errors, consoleErrors });
    console.log(`PASS ${engine} ${width}px reduced=${reduced}: navigation, dropdown/menu, gallery, toast, cart modal focus/Escape/outside/scroll lock, quantities, refresh hydration, removal, white/DM Sans, overflow.`);
    await context.close();
  } finally { await browser.close(); }
}
try {
  for (const engine of engines) {
    for (const width of (engine === "chromium" ? [1440, 390, 320] : [1440, 390])) await run(engine, width);
    for (const width of [1440, 390]) await run(engine, width, true);
  }
} finally {
  await writeFile(join(evidence, "motion-results.json"), JSON.stringify({ date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date()), results, note: "Automated actual Chrome and Playwright WebKit. WebKit is not a manually operated Safari or physical-phone test." }, null, 2) + "\n");
}
