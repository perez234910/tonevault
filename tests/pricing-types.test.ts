import assert from "node:assert/strict";
import test from "node:test";
import type { Database } from "../src/types/database";
import type { Order } from "../src/types";

const order = {
  id: "order-1",
  product_id: "product-1",
  buyer_id: "buyer-1",
  quantity: 1,
  unit_price: 168_000,
  subtotal_amount: 168_000,
  verification_option: "none",
  verification_fee: 0,
  commission_rate_bps: 800,
  commission_amount: 13_440,
  seller_payout_amount: 154_560,
  platform_revenue_amount: 13_440,
  total_amount: 168_000,
  escrow_status: "pending",
  tracking_number: null,
  created_at: "2026-11-08T00:00:00.000Z",
} satisfies Order;

const rpcArgs: Database["public"]["Functions"]["place_catalog_order"]["Args"] = {
  p_product_id: "product-1",
  p_buyer_id: "buyer-1",
  p_quantity: 1,
  p_verification_option: "none",
  p_expected_unit_price: 168_000,
  p_subtotal_amount: 168_000,
  p_verification_fee: 0,
  p_commission_rate_bps: 800,
  p_commission_amount: 13_440,
  p_seller_payout_amount: 154_560,
  p_platform_revenue_amount: 13_440,
  p_total_amount: 168_000,
};

test("order and RPC contracts include the saved pricing snapshot", () => {
  assert.equal(order.platform_revenue_amount, 13_440);
  assert.equal(rpcArgs.p_verification_option, "none");
});
