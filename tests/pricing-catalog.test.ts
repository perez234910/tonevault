import assert from "node:assert/strict";
import test from "node:test";
import {
  quoteCatalogPricing,
  type CatalogProductLoader,
} from "../src/lib/pricing/catalog";

const product_id = "11111111-1111-4111-8111-111111111111";

const availableProduct: CatalogProductLoader = async () => ({
  ok: true,
  data: {
    id: product_id,
    price: 195_000,
    status: "available",
    stock: 2,
  },
});

test("quotes the catalog price and ignores a browser total", async () => {
  const result = await quoteCatalogPricing(
    {
      product_id,
      quantity: 1,
      verification_option: "physical",
      total: 1,
    },
    availableProduct,
  );

  assert.deepEqual(result, {
    ok: true,
    data: {
      product_id,
      quantity: 1,
      pricing: {
        unit_price: 195_000,
        subtotal_amount: 195_000,
        verification_option: "physical",
        verification_fee: 8_500,
        commission_rate_bps: 800,
        commission_amount: 15_600,
        seller_payout_amount: 179_400,
        platform_revenue_amount: 24_100,
        total_amount: 203_500,
      },
    },
  });
});

test("returns not found when the catalog product does not exist", async () => {
  const missingProduct: CatalogProductLoader = async () => ({
    ok: false,
    code: "NOT_FOUND",
    error: "Instrument not found.",
  });

  const result = await quoteCatalogPricing(
    { product_id, quantity: 1 },
    missingProduct,
  );

  assert.deepEqual(result, {
    ok: false,
    code: "NOT_FOUND",
    error: "Instrument not found.",
  });
});

test("returns conflict when requested quantity exceeds stock", async () => {
  const result = await quoteCatalogPricing(
    { product_id, quantity: 3, verification_option: "remote" },
    availableProduct,
  );

  assert.deepEqual(result, {
    ok: false,
    code: "CONFLICT",
    error:
      "Requested quantity exceeds available stock or this listing is already reserved.",
  });
});
