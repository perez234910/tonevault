import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OwnerOrders } from "../src/components/owner-orders";

test("absent, loading and failed owner data cannot become an empty order history", () => {
  for (const status of ["unavailable", "loading", "error"] as const) {
    const html = renderToStaticMarkup(createElement(OwnerOrders, { state: { status } }));
    assert.doesNotMatch(html, /No orders yet/);
    if (status === "loading") assert.match(html, /aria-busy="true"/);
    if (status === "error") assert.match(html, /role="alert"/);
  }
});

test("only an explicit ready empty result displays no orders", () => {
  const html = renderToStaticMarkup(createElement(OwnerOrders, { state: { status: "ready", orders: [] } }));
  assert.match(html, /No orders yet/);
  assert.doesNotMatch(html, /Orders unavailable/);
});

test("ready presentation uses the supplied saved amount and reference, not fabricated metrics", () => {
  const html = renderToStaticMarkup(createElement(OwnerOrders, { state: { status: "ready", orders: [{ id: "30000000-0000-4000-8000-000000000099", instrument: "Synthetic test instrument", quantity: 2, total_amount: 321.09, escrow_status: "pending" }] } }));
  assert.match(html, /₱321\.09/);
  assert.match(html, /confirmation\/30000000-0000-4000-8000-000000000099/);
  assert.doesNotMatch(html, /No orders yet/);
});
