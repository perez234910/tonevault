import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const migrationsDirectory = fileURLToPath(
  new URL("../supabase/migrations/", import.meta.url),
);

function loadRevenueMigration() {
  const filenames = readdirSync(migrationsDirectory).filter((filename) =>
    filename.endsWith("_add_revenue_pricing.sql"),
  );

  assert.equal(
    filenames.length,
    1,
    "expected exactly one add_revenue_pricing migration",
  );

  return readFileSync(`${migrationsDirectory}/${filenames[0]}`, "utf8");
}

test("persists every revenue pricing field", () => {
  const sql = loadRevenueMigration();

  for (const column of [
    "unit_price",
    "subtotal_amount",
    "verification_option",
    "verification_fee",
    "commission_rate_bps",
    "commission_amount",
    "seller_payout_amount",
    "platform_revenue_amount",
  ]) {
    assert.match(
      sql,
      new RegExp(`add column if not exists ${column}\\b`, "i"),
    );
  }
});

test("keeps stock and order creation atomic and verifies the snapshot", () => {
  const sql = loadRevenueMigration();

  assert.match(sql, /for update/i);
  assert.match(sql, /PRICE_CHANGED/);
  assert.match(sql, /INVALID_PRICING_SNAPSHOT/);
  assert.match(sql, /insert into public\.orders/i);
  assert.match(sql, /update public\.products/i);
});

test("restricts the order RPC to the server service role", () => {
  const sql = loadRevenueMigration();

  assert.match(sql, /security invoker/i);
  assert.doesNotMatch(sql, /security definer/i);
  assert.match(sql, /revoke all on function[\s\S]+from public/i);
  assert.match(sql, /revoke all on function[\s\S]+from anon/i);
  assert.match(sql, /revoke all on function[\s\S]+from authenticated/i);
  assert.match(sql, /grant execute on function[\s\S]+to service_role/i);
  assert.doesNotMatch(
    sql,
    /grant execute on function[\s\S]+to (anon|authenticated)/i,
  );
});
