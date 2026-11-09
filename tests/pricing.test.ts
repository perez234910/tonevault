import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateOrderPricing,
  pricingBreakdownToPesos,
} from "../src/lib/pricing/calculate";

test("calculates the PRS 8% commission", () => {
  const result = calculateOrderPricing({
    unitPriceCentavos: 16_800_000,
    quantity: 1,
    verificationOption: "none",
  });

  assert.deepEqual(pricingBreakdownToPesos(result), {
    unit_price: 168_000,
    subtotal_amount: 168_000,
    verification_option: "none",
    verification_fee: 0,
    commission_rate_bps: 800,
    commission_amount: 13_440,
    seller_payout_amount: 154_560,
    platform_revenue_amount: 13_440,
    total_amount: 168_000,
  });
});

test("adds physical verification once", () => {
  const result = calculateOrderPricing({
    unitPriceCentavos: 19_500_000,
    quantity: 1,
    verificationOption: "physical",
  });

  assert.deepEqual(pricingBreakdownToPesos(result), {
    unit_price: 195_000,
    subtotal_amount: 195_000,
    verification_option: "physical",
    verification_fee: 8_500,
    commission_rate_bps: 800,
    commission_amount: 15_600,
    seller_payout_amount: 179_400,
    platform_revenue_amount: 24_100,
    total_amount: 203_500,
  });
});

test("does not multiply the remote fee by quantity", () => {
  const result = calculateOrderPricing({
    unitPriceCentavos: 10_000,
    quantity: 2,
    verificationOption: "remote",
  });

  assert.equal(result.subtotalCentavos, 20_000);
  assert.equal(result.verificationFeeCentavos, 280_000);
  assert.equal(result.buyerTotalCentavos, 300_000);
});

test("rounds commission to the nearest centavo", () => {
  const result = calculateOrderPricing(
    {
      unitPriceCentavos: 101,
      quantity: 1,
      verificationOption: "none",
    },
    {
      commissionRateBps: 800,
      verificationFeeCentavos: {
        none: 0,
        remote: 280_000,
        physical: 850_000,
      },
    },
  );

  assert.equal(result.commissionCentavos, 8);
});

test("rejects zero quantity", () => {
  assert.throws(
    () =>
      calculateOrderPricing({
        unitPriceCentavos: 10_000,
        quantity: 0,
        verificationOption: "none",
      }),
    /quantity must be a positive integer/,
  );
});
