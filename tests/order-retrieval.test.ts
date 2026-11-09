import assert from "node:assert/strict";
import { test } from "node:test";
import { GET } from "../app/api/orders/[id]/route";

const buyerId = "11111111-1111-4111-8111-111111111111";
const orderId = "22222222-2222-4222-8222-222222222222";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-placeholder";

test("order retrieval authenticates and scopes the database lookup to the buyer", async () => {
  const originalFetch = globalThis.fetch;
  let databaseReads = 0;
  let found = true;
  let validToken = true;
  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.pathname === "/auth/v1/user") {
      return Response.json(validToken ? { id: buyerId } : { message: "Invalid token" }, { status: validToken ? 200 : 401 });
    }
    databaseReads++;
    assert.equal(url.pathname, "/rest/v1/orders");
    assert.equal(url.searchParams.get("id"), `eq.${orderId}`);
    assert.equal(url.searchParams.get("buyer_id"), `eq.${buyerId}`);
    return Response.json(found ? [{ id: orderId, buyer_id: buyerId, quantity: 1, subtotal_amount: 485000, verification_option: "none", verification_fee: 0, total_amount: "485000.00" }] : []);
  };
  const call = (token?: string, id = orderId) => GET(new Request("http://localhost/api/orders/" + id, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }), { params: Promise.resolve({ id }) });
  try {
    assert.equal((await call()).status, 401);
    assert.equal(databaseReads, 0);
    const saved = await call("test-token");
    assert.equal(saved.status, 200);
    assert.equal(saved.headers.get("cache-control"), "private, no-store");
    assert.equal((await saved.json()).data.order.total_amount, 485000);
    found = false;
    assert.equal((await call("test-token")).status, 404);
    assert.equal((await call("test-token", "invalid-id")).status, 404);
    validToken = false;
    const readsBefore = databaseReads;
    assert.equal((await call("invalid-token")).status, 401);
    assert.equal(databaseReads, readsBefore);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("guest confirmation needs its private cookie and does not expose guest details", async () => {
  const { hashOrderAccess } = await import("../src/lib/catalog/order-access");
  const token = "a".repeat(64);
  const original = globalThis.fetch;
  let accessAllowed = true;
  let orderReads = 0;
  globalThis.fetch = async input => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/order_checkout_details")) {
      assert.equal(url.searchParams.get("order_id"), `eq.${orderId}`);
      assert.equal(url.searchParams.get("guest_token_hash"), `eq.${hashOrderAccess(token)}`);
      return Response.json(accessAllowed ? [{ order_id: orderId }] : []);
    }
    if (url.pathname.endsWith("/orders")) {
      orderReads++;
      assert.equal(url.searchParams.get("buyer_id"), "is.null");
      return Response.json([{ id: orderId, buyer_id: null, quantity: 1, subtotal_amount: 485000, verification_option: "physical", verification_fee: 8500, total_amount: "493500.00" }]);
    }
    throw new Error("Unexpected query: " + url.pathname);
  };
  const call = (value?: string) => GET(new Request(`http://localhost/api/orders/${orderId}`, {
    headers: value ? { Cookie: `order_access_${orderId}=${value}` } : {},
  }), { params: Promise.resolve({ id: orderId }) });
  try {
    assert.equal((await call()).status, 401);
    assert.equal((await call("bad-token")).status, 404);
    assert.equal(orderReads, 0);
    const response = await call(token);
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.equal(body.includes("guest_token_hash"), false);
    assert.equal(body.includes("email"), false);
    assert.equal(body.includes(token), false);
    accessAllowed = false;
    assert.equal((await call(token)).status, 404);
    assert.equal(orderReads, 1);
  } finally { globalThis.fetch = original; }
});
