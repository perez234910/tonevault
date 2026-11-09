import assert from "node:assert/strict";
import { test } from "node:test";
import { checkoutOrderSchema } from "../src/lib/validators/checkout-order";
import { placeCheckoutOrder } from "../src/lib/catalog/checkout-orders";
import { POST } from "../app/api/orders/route";

const buyerId = "11111111-1111-4111-8111-111111111111";
const input = {
  product_id: "33333333-3333-4333-8333-333333333333", quantity: 1,
  customer: { full_name: "Test Buyer", email: "test@example.com", phone: "+63 912 345 6789", address: "123 Test Street, Manila" },
  payment_method: "simulated_card", payment_confirmed: true,
};
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-placeholder";

test("checkout validates shipping, quantity and simulated payment", () => {
  assert.equal(checkoutOrderSchema.safeParse(input).success, true);
  for (const quantity of [0, -3, 1.5, null, undefined]) assert.equal(checkoutOrderSchema.safeParse({ ...input, quantity }).success, false);
  assert.equal(checkoutOrderSchema.safeParse({ ...input, customer: { ...input.customer, email: "invalid" } }).success, false);
  assert.equal(checkoutOrderSchema.safeParse({ ...input, payment_confirmed: false }).success, false);
});

test("checkout uses verified buyer, ignores browser total and maps stock failures", async () => {
  const original = globalThis.fetch;
  let error: string | null = null;
  let expectedInspection = false;
  globalThis.fetch = async (_url, init) => {
    const args = JSON.parse(init?.body as string);
    assert.equal(args.p_buyer_id, buyerId);
    assert.equal(args.p_inspection_requested, expectedInspection);
    assert.equal(args.p_product_id, input.product_id);
    assert.equal(args.total, undefined);
    if (error) return Response.json({ message: error, code: "P0001" }, { status: 400 });
    return Response.json({ id: buyerId, buyer_id: buyerId, quantity: 1, total_amount: "485000.00" });
  };
  try {
    const result = await placeCheckoutOrder({ ...input, buyer_id: "forged", total: 1 }, buyerId);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.data.order.total_amount, 485000);
    expectedInspection = true;
    assert.equal((await placeCheckoutOrder({ ...input, inspection_requested: true, inspection_fee: 1, commission_rate: 0 }, buyerId)).ok, true);
    expectedInspection = false;
    for (const [message, code] of [["SLOT_TAKEN", "CONFLICT"], ["INSUFFICIENT_STOCK", "CONFLICT"], ["LISTING_NOT_FOUND", "NOT_FOUND"], ["CANNOT_PURCHASE_OWN_LISTING", "FORBIDDEN"], ["private database details", "INTERNAL_ERROR"]]) {
      error = message;
      const result = await placeCheckoutOrder(input, buyerId);
      assert.equal(result.ok, false);
      if (!result.ok) { assert.equal(result.code, code); assert.equal(result.error.includes("private database details"), false); }
    }
  } finally { globalThis.fetch = original; }
});

test("POST rejects missing or invalid sessions before writing an order", async () => {
  const request = (token?: string) => new Request("http://localhost/api/orders", {
    method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ product_id: input.product_id, quantity: 1 }),
  });
  assert.equal((await POST(request())).status, 401);
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ message: "Invalid token" }, { status: 401 });
  try { assert.equal((await POST(request("invalid"))).status, 401); }
  finally { globalThis.fetch = original; }
});

test("guest checkout never accepts a browser buyer ID and only stores a token hash", async () => {
  const { createOrderAccess, hashOrderAccess } = await import("../src/lib/catalog/order-access");
  const access = createOrderAccess();
  assert.match(access.token, /^[a-f0-9]{64}$/);
  assert.equal(access.hash, hashOrderAccess(access.token));
  assert.notEqual(access.hash, access.token);
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    const args = JSON.parse(init?.body as string);
    assert.equal(args.p_buyer_id, null);
    assert.equal(args.p_guest_token_hash, access.hash);
    assert.equal(JSON.stringify(args).includes(access.token), false);
    return Response.json({ id: buyerId, buyer_id: null, quantity: 1, total_amount: "485000.00" });
  };
  try {
    const saved = await placeCheckoutOrder({ ...input, buyer_id: "forged", total: 1 }, null, access.hash);
    assert.equal(saved.ok, true);
    if (saved.ok) assert.equal(saved.data.order.buyer_id, null);
  } finally { globalThis.fetch = original; }
});
