import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const pw = await import(
  process.env.TONEVAULT_PLAYWRIGHT_MODULE || "playwright"
);

const base = process.env.TONEVAULT_TEST_BASE || "http://localhost:3000";
const evidence = resolve(
  process.env.TONEVAULT_OWNER_EVIDENCE || "docs/evidence/owner-interface"
);

await mkdir(evidence, { recursive: true });

const results = [];

try {
  for (const engine of ["chromium", "webkit"]) {
    for (const width of [1440, 390]) {
      for (const reduced of (engine === "chromium" ? [false, true] : [false])) {
        const browser = await pw[engine].launch(
          engine === "chromium" && process.env.TONEVAULT_BROWSER_EXECUTABLE
            ? { executablePath: process.env.TONEVAULT_BROWSER_EXECUTABLE }
            : {}
        );

        try {
          const page = await browser.newPage({
            viewport: { width, height: 900 },
            ...(engine === "chromium"
              ? { reducedMotion: reduced ? "reduce" : "no-preference" }
              : {}),
          });

          const errors = [];
          const api = [];

          page.on("pageerror", (error) => errors.push(error.message));

          page.on("console", (message) => {
            if (message.type() === "error") errors.push(message.text());
          });

          page.on("request", (request) => {
            if (request.url().startsWith(base + "/api/")) {
              api.push(request.url());
            }
          });

          // Check the signed-out Owner Dashboard.
          await page.goto(base + "/owner");

          await page
            .getByRole("heading", { name: "Your storefront", exact: true })
            .waitFor();

          await page
            .getByRole("heading", { name: "Owner Login", exact: true })
            .waitFor();

          await page.getByLabel("Email address").waitFor();
          await page.getByLabel("Password").waitFor();
          await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();

          assert.equal(
            await page.getByLabel("Email address").getAttribute("type"),
            "email"
          );

          assert.equal(
            await page.getByLabel("Password").getAttribute("type"),
            "password"
          );

          const nav = page.getByRole("navigation", {
            name: "Owner dashboard navigation",
            exact: true,
          });

          await nav.getByRole("link", { name: "Overview", exact: true }).waitFor();
          await nav.getByRole("link", { name: "Orders", exact: true }).waitFor();

          // Signed-out visitors must not receive private owner API data.
          assert.deepEqual(api, []);

          // Check responsive layout.
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth
            ),
            true
          );

          if (engine === "chromium" && !reduced) {
            await page.evaluate(() => window.scrollTo(0, 0));

            await page.screenshot({
              path: join(evidence, `${width}-owner.png`),
              fullPage: true,
              caret: "initial",
            });
          }

          // Check the saved-order lookup separately.
          await page.goto(base + "/confirmation");

          await page
            .getByRole("heading", {
              name: "Find your saved order",
              exact: true,
            })
            .waitFor();

          const reference = page.getByRole("textbox", {
            name: "Order reference",
            exact: true,
          });

          await reference.focus();
          await page.keyboard.type("invalid-reference");
          await page.keyboard.press("Enter");

          await page
            .getByText("Enter a valid saved order reference.", { exact: true })
            .waitFor();

          assert.deepEqual(errors, []);
          assert.deepEqual(api, []);

          results.push({
            engine,
            width,
            reduced,
            passed: true,
            signedOutOwnerLogin: true,
            invalidOrderReferenceHandled: true,
            ownerDataRequests: 0,
          });

          console.log(
            `PASS owner ${engine} ${width}px reduced=${reduced}: login, responsive layout, saved-order validation, no private API requests.`
          );
        } finally {
          await browser.close();
        }
      }
    }
  }
} finally {
  await writeFile(
    join(evidence, "results.json"),
    JSON.stringify(
      {
        results,
        note: "Signed-out owner login and saved-order reference validation. No authenticated private-data requests were made.",
      },
      null,
      2
    ) + "\n"
  );
}
