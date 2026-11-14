import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routePath = new URL(
  "../app/api/pricing/quote/route.ts",
  import.meta.url,
);

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
