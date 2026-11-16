import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { release } from "node:os";

const pw = await import(
  process.env.TONEVAULT_PLAYWRIGHT_MODULE || "playwright"
);

const base = process.env.TONEVAULT_TEST_BASE || "http://localhost:3000";
const evidence = resolve(
  process.env.TONEVAULT_OWNER_EVIDENCE || "docs/evidence/owner-interface"
);

await mkdir(evidence, { recursive: true });

const results = [];
const expectedOwnerState = process.env.TONEVAULT_EXPECT_OWNER_STATE;

assert.ok(
  expectedOwnerState === "sample" || expectedOwnerState === "login",
  'Set TONEVAULT_EXPECT_OWNER_STATE to "sample" or "login" before running this test.'
);

let completed = false;

try {
  const frozenWebKit =
    process.platform === "darwin" &&
    process.arch === "arm64" &&
    Number(release().split(".")[0]) === 23;

  if (frozenWebKit) {
    results.push({
      engine: "webkit",
      skipped: true,
      reason: "Playwright WebKit is frozen on macOS 14 ARM64."
    });
    console.log("SKIP owner webkit: frozen browser on macOS 14 ARM64.");
  }

  for (const engine of (frozenWebKit ? ["chromium"] : ["chromium", "webkit"])) {
    for (const width of [1440, 390]) {
      for (const reduced of (engine === "chromium" ? [false, true] : [false])) {
        const browser = await pw[engine].launch({ timeout: 30000, ...(
          engine === "chromium" && process.env.TONEVAULT_BROWSER_EXECUTABLE
            ? { executablePath: process.env.TONEVAULT_BROWSER_EXECUTABLE }
            : {})
        });

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

          // Require the exact owner state for the environment under test.
          await page.goto(base + "/owner");
          await page
            .getByRole("heading", { name: "Your storefront", exact: true })
            .waitFor();

          const expectedHeading =
            expectedOwnerState === "sample"
              ? page.getByRole("heading", {
                  name: "Owner dashboard unavailable in sample mode",
                  exact: true,
                })
              : page.getByRole("heading", {
                  name: "Owner Login",
                  exact: true,
                });

          const unexpectedHeading =
            expectedOwnerState === "sample"
              ? page.getByRole("heading", {
                  name: "Owner Login",
                  exact: true,
                })
              : page.getByRole("heading", {
                  name: "Owner dashboard unavailable in sample mode",
                  exact: true,
                });

          await expectedHeading.waitFor();
          assert.equal(
            await unexpectedHeading.count(),
            0,
            `Unexpected owner screen for ${expectedOwnerState} mode.`
          );

          let ownerState;

          if (expectedOwnerState === "login") {
            ownerState = "signed-out-login";
            await page.getByLabel("Email address").waitFor();
            await page.getByLabel("Password").waitFor();
            await page
              .getByRole("button", { name: "Sign in", exact: true })
              .waitFor();

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
          } else {
            ownerState = "sample-mode-unavailable";
            assert.equal(
              await page.getByLabel("Email address").count(),
              0,
              "Login form must not appear in sample mode."
            );
          }

          // Signed-out or unavailable visitors must not receive private owner API data.
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
            ownerState,
            invalidOrderReferenceHandled: true,
            ownerDataRequests: 0,
          });

          console.log(
            `PASS owner ${engine} ${width}px reduced=${reduced}: ${ownerState}, responsive layout, saved-order validation, no private API requests.`
          );
        } finally {
          await browser.close();
        }
      }
    }
  }
  completed = true;
} finally {
  if (completed) await writeFile(
    join(evidence, "results.json"),
    JSON.stringify(
      {
        results,
        note: "Exact expected owner state and saved-order reference validation. No authenticated private-data requests were made.",
      },
      null,
      2
    ) + "\n"
  );
}
