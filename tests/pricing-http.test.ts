import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const routePath = new URL(
  "../app/api/pricing/quote/route.ts",
  import.meta.url,
);

const previewProductId = "20000000-0000-4000-8000-000000000004";

function runQuoteRoute(
  nodeEnv: "development" | "production",
  mockData: "true" | "false",
) {
  const payload = JSON.stringify({
    product_id: previewProductId,
    quantity: 1,
    verification_option: "physical",
  });
  const child = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      `
        import { POST } from "./app/api/pricing/quote/route.ts";
        const response = await POST(new Request("http://localhost/api/pricing/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: ${JSON.stringify(payload)},
        }));
        console.log(JSON.stringify({
          status: response.status,
          contentType: response.headers.get("content-type"),
          body: await response.json(),
        }));
      `,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: nodeEnv,
        TONEVAULT_MOCK_DATA: mockData,
        NEXT_PUBLIC_SUPABASE_URL: "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
      },
    },
  );

  assert.equal(child.status, 0, child.stderr);
  return JSON.parse(child.stdout.trim());
}

test("quote route delegates server pricing and rejects invalid JSON", () => {
  const source = readFileSync(routePath, "utf8");

  assert.match(source, /request\.json\(\)/);
  assert.match(source, /quoteCatalogPricing\(payload\)/);
  assert.match(source, /actionResultToResponse\(result\)/);
  assert.match(source, /status:\s*400/);
});

test("quote route does not accept a browser total", () => {
  const source = readFileSync(routePath, "utf8");

  assert.doesNotMatch(source, /\btotal\s*:/);
});

test("quote route returns a sample quote without Supabase credentials", () => {
  const result = runQuoteRoute("development", "true");

  assert.equal(result.status, 200);
  assert.match(result.contentType, /^application\/json/);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.data.pricing.total_amount, 203_500);
});

test("quote route returns INTERNAL_ERROR JSON when pricing throws", () => {
  const result = runQuoteRoute("production", "false");

  assert.equal(result.status, 500);
  assert.match(result.contentType, /^application\/json/);
  assert.deepEqual(result.body, {
    ok: false,
    code: "INTERNAL_ERROR",
    error: "Unable to calculate pricing.",
  });
});
