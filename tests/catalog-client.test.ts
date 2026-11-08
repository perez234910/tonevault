import assert from "node:assert/strict";
import { test } from "node:test";
import { buildProductsUrl, fetchProducts, parseProductsEnvelope } from "../src/lib/catalog-client";

const product = {
  id: "00000000-0000-4000-8000-000000000001", seller_id: "00000000-0000-4000-8000-000000000002",
  brand: "Fender", model: "Stratocaster", year: 1965, finish: null, price: 485000,
  verification_status: "Fully Verified", tonevault_score: 94, condition_notes: null,
  status: "available", stock: 1, images: [], created_at: "2026-11-08T00:00:00Z",
};

test("URL construction preserves query filters, encodes values, and excludes unrelated parameters", () => {
  const source = new URLSearchParams({ brand: "Fender & Gibson", verificationStatus: "Fully Verified", minPrice: "0", maxPrice: "500000", condition: "original", query: "1965", search: "white", offset: "24", status: "sold", limit: "100", unknown: "drop" });
  const url = new URL(buildProductsUrl(source), "http://localhost");
  assert.equal(url.pathname, "/api/products");
  assert.equal(url.searchParams.get("brand"), "Fender & Gibson");
  for (const key of ["verificationStatus", "minPrice", "maxPrice", "condition", "query", "search", "offset", "status"]) assert.equal(url.searchParams.get(key), source.get(key));
  assert.equal(url.searchParams.get("limit"), "24");
  assert.equal(url.searchParams.has("unknown"), false);
  assert.equal(buildProductsUrl(new URLSearchParams()), "/api/products?limit=24");
  assert.equal(new URL(buildProductsUrl(new URLSearchParams("brand=Fender&brand=PRS")), "http://localhost").searchParams.get("brand"), "Fender");
});

test("API envelope transforms actual product arrays and empty searches", () => {
  assert.deepEqual(parseProductsEnvelope({ ok: true, data: [product], products: [product], count: 1 }), { products: [product], count: 1 });
  assert.deepEqual(parseProductsEnvelope({ ok: true, data: [], products: [], count: 0 }), { products: [], count: 0 });
});

test("malformed envelopes/products fail instead of becoming an empty catalog", () => {
  for (const payload of [null, {}, { ok: false, error: "Database error" }, { ok: true, data: {}, count: 0 }, { ok: true, data: [{ ...product, price: "1" }], count: 1 }]) assert.throws(() => parseProductsEnvelope(payload), /unexpected response/);
});

test("Fetch requests JSON through own API with cancellation and no-store", async () => {
  const controller = new AbortController();
  const fetcher: typeof fetch = async (url, options) => {
    assert.equal(url, "/api/products?limit=24");
    assert.equal(options?.signal, controller.signal);
    assert.equal(options?.cache, "no-store");
    assert.deepEqual(options?.headers, { Accept: "application/json" });
    return Response.json({ ok: true, data: [product], count: 1 });
  };
  assert.equal((await fetchProducts("/api/products?limit=24", controller.signal, fetcher)).products[0].id, product.id);
});

test("HTTP errors, invalid JSON, network failure and cancellation remain errors", async () => {
  const signal = new AbortController().signal;
  for (const status of [400, 404, 500]) await assert.rejects(fetchProducts("/api/products", signal, async () => new Response("private DB failure", { status })), /Unable to load/);
  await assert.rejects(fetchProducts("/api/products", signal, async () => new Response("<html>")), /unexpected response/);
  await assert.rejects(fetchProducts("/api/products", signal, async () => { throw new Error("offline"); }), /offline/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchProducts("/api/products", controller.signal, async (_url, options) => { options?.signal?.throwIfAborted(); return Response.json({}); }), { name: "AbortError" });
});
