import assert from "node:assert/strict";
import test from "node:test";
import {
  createOrderSchema,
  pricingQuoteSchema,
} from "../src/lib/validators/catalog";

const product_id = "11111111-1111-4111-8111-111111111111";
const buyer_id = "22222222-2222-4222-8222-222222222222";

test("defaults to no verification and strips browser money", () => {
  assert.deepEqual(
    createOrderSchema.parse({
      product_id,
      buyer_id,
      quantity: 1,
      total: 1,
      commission_amount: 1,
    }),
    {
      product_id,
      buyer_id,
      quantity: 1,
      verification_option: "none",
    },
  );
});

test("accepts physical verification", () => {
  assert.equal(
    pricingQuoteSchema.parse({
      product_id,
      quantity: 1,
      verification_option: "physical",
    }).verification_option,
    "physical",
  );
});

test("rejects unknown verification", () => {
  assert.equal(
    pricingQuoteSchema.safeParse({
      product_id,
      quantity: 1,
      verification_option: "premium",
    }).success,
    false,
  );
});
