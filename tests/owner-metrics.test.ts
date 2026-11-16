import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateOwnerMetrics,
  DEFAULT_LOW_STOCK_THRESHOLD,
} from "../src/lib/owner/metrics";

import type { Order, Product } from "../src/types";

function makeProduct(
  id: string,
  brand: string,
  model: string,
  stock: number,
  status: Product["status"] = "available",
): Product {
  return {
    id,
    seller_id: "seller-1",
    brand,
    model,
    year: 2020,
    finish: "Natural",
    price: 100_000,
    verification_status: "Unverified",
    tonevault_score: null,
    condition_notes: null,
    status,
    stock,
    images: [],
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeOrder(
  id: string,
  productId: string,
  quantity: number,
  totalAmount: number,
  platformRevenue: number,
): Order {
  return {
    id,
    product_id: productId,
    buyer_id: "buyer-1",
    quantity,
    unit_price: totalAmount,
    subtotal_amount: totalAmount,
    verification_option: "none",
    verification_fee: 0,
    commission_rate_bps: 800,
    commission_amount: platformRevenue,
    seller_payout_amount: totalAmount - platformRevenue,
    platform_revenue_amount: platformRevenue,
    total_amount: totalAmount,
    escrow_status: "pending",
    tracking_number: null,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

test("calculates saved orders, order value, average and platform revenue", () => {
  const products = [
    makeProduct("guitar-1", "Fender", "Stratocaster", 5),
    makeProduct("guitar-2", "Gibson", "Les Paul", 4),
  ];

  const orders = [
    makeOrder("order-1", "guitar-1", 2, 100_000, 8_000),
    makeOrder("order-2", "guitar-2", 3, 200_000, 16_000),
    makeOrder("order-3", "guitar-1", 1, 150_000, 12_000),
  ];

  const result = calculateOwnerMetrics(orders, products);

  assert.equal(result.totalOrders, 3);
  assert.equal(result.totalOrderValue, 450_000);
  assert.equal(result.averageOrderValue, 150_000);
  assert.equal(result.platformRevenue, 36_000);
  assert.equal(result.revenueStatus, "available");
});

test("includes every top-selling tie and identifies available low-stock guitars", () => {
  const products = [
    makeProduct("guitar-1", "Fender", "Stratocaster", 2),
    makeProduct("guitar-2", "Gibson", "Les Paul", 1),
    makeProduct("guitar-3", "Ibanez", "RG", 1, "sold"),
    makeProduct("guitar-4", "Yamaha", "Pacific", 5),
  ];

  const orders = [
    makeOrder("order-1", "guitar-1", 2, 100_000, 8_000),
    makeOrder("order-2", "guitar-2", 2, 120_000, 9_600),
  ];

  const result = calculateOwnerMetrics(orders, products);

  assert.deepEqual(
    result.topSellingItems.map((item) => item.productId),
    ["guitar-1", "guitar-2"],
  );

  assert.deepEqual(result.lowStockItems, [
    {
      id: "guitar-1",
      name: "Fender Stratocaster",
      stock: 2,
    },
    {
      id: "guitar-2",
      name: "Gibson Les Paul",
      stock: 1,
    },
  ]);

  assert.equal(result.lowStockThreshold, DEFAULT_LOW_STOCK_THRESHOLD);
});

test("handles an empty order history and zero-stock available products", () => {
  const products = [
    makeProduct("guitar-1", "Fender", "Stratocaster", 0),
  ];

  const result = calculateOwnerMetrics([], products);

  assert.equal(result.totalOrders, 0);
  assert.equal(result.totalOrderValue, 0);
  assert.equal(result.averageOrderValue, 0);
  assert.equal(result.platformRevenue, 0);
  assert.deepEqual(result.topSellingItems, []);

  assert.deepEqual(result.lowStockItems, [
    {
      id: "guitar-1",
      name: "Fender Stratocaster",
      stock: 0,
    },
  ]);
});

test("accepts a custom low-stock threshold", () => {
  const products = [
    makeProduct("guitar-1", "Fender", "Stratocaster", 3),
  ];

  const result = calculateOwnerMetrics([], products, 3);

  assert.equal(result.lowStockThreshold, 3);
  assert.equal(result.lowStockItems.length, 1);
});
