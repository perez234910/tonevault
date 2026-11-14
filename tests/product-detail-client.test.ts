import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchProductDetail, parseProductDetail, ProductLoadError } from "../src/lib/product-detail-client";
import { previewProducts, previewSeller } from "../src/lib/catalog/mock-data";

const product = { ...previewProducts[0], seller: previewSeller, inspection: {
  verification_status: "Fully Verified", tonevault_score: 94, score_scale: 100,
  condition_notes: previewProducts[0].condition_notes, is_verified: true, inspection_level: "in_person",
} };

test("Detail transforms the real envelope and rejects incomplete data instead of treating it as not found", () => {
  assert.deepEqual(parseProductDetail({ ok: true, data: product }), product);
  for (const payload of [null, {}, { ok: true, data: { ...product, stock: -1 } }, { ok: true, data: { ...product, inspection: null } }]) assert.throws(() => parseProductDetail(payload), (error) => error instanceof ProductLoadError && error.status !== 404);
});

test("Detail fetch uses the own JSON API, encodes the ID and forwards cancellation", async () => {
  const signal = new AbortController().signal;
  const result = await fetchProductDetail("id/with?characters", signal, async (url, options) => {
    assert.equal(url, "/api/products/id%2Fwith%3Fcharacters");
    assert.equal(options?.signal, signal); assert.equal(options?.cache, "no-store");
    assert.deepEqual(options?.headers, { Accept: "application/json" });
    return Response.json({ ok: true, data: product });
  });
  assert.equal(result.id, product.id);
});

test("HTTP 404 is distinct from retryable 500 and malformed responses", async () => {
  const signal = new AbortController().signal;
  await assert.rejects(fetchProductDetail("id", signal, async () => new Response(null, { status: 404 })), (error) => error instanceof ProductLoadError && error.status === 404);
  await assert.rejects(fetchProductDetail("id", signal, async () => new Response("private DB error", { status: 500 })), (error) => error instanceof ProductLoadError && error.status === 500 && !error.message.includes("private"));
  await assert.rejects(fetchProductDetail("id", signal, async () => new Response("<html>")), /incomplete/);
});

test("network and abort failures do not become missing-product data", async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetchProductDetail("id", controller.signal, async (_url, options) => { options?.signal?.throwIfAborted(); return Response.json({}); }), { name: "AbortError" });
  await assert.rejects(fetchProductDetail("id", new AbortController().signal, async () => { throw new Error("offline"); }), /offline/);
});
