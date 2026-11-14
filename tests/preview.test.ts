import assert from "node:assert/strict";
import { test } from "node:test";
import { isCatalogPreview } from "../src/lib/catalog/preview-mode";
import { previewProducts, filterPreviewProducts } from "../src/lib/catalog/mock-data";
import { productFiltersSchema } from "../src/lib/validators/catalog";
import { createCartStore } from "../src/lib/cart-store";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

function runDataPath(NODE_ENV: "development" | "production" | "test", flag: string, source: string) {
  const child = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", source], {
    cwd: process.cwd(), encoding: "utf8",
    env: { ...process.env, NODE_ENV, TONEVAULT_MOCK_DATA: flag, NEXT_PUBLIC_SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
  });
  assert.equal(child.status, 0, child.stderr);
  return JSON.parse(child.stdout.trim());
}

test("sample mode requires both explicit true flag and development environment", () => {
  assert.equal(isCatalogPreview({ NODE_ENV: "development", TONEVAULT_MOCK_DATA: "true" }), true);
  for (const NODE_ENV of ["production", "test", undefined]) assert.equal(isCatalogPreview({ NODE_ENV, TONEVAULT_MOCK_DATA: "true" }), false);
  for (const TONEVAULT_MOCK_DATA of [undefined, "false", "1", "TRUE"]) assert.equal(isCatalogPreview({ NODE_ENV: "development", TONEVAULT_MOCK_DATA }), false);
});

test("eight deterministic sample guitars include quantity and sold-out fixtures", () => {
  assert.equal(previewProducts.length, 8);
  assert.equal(new Set(previewProducts.map((p) => p.id)).size, 8);
  assert.ok(previewProducts.some((p) => p.stock > 1));
  assert.ok(previewProducts.some((p) => p.status === "sold" && p.stock === 0));
  assert.ok(previewProducts.every((p) => p.images.length === 2 && p.price > 0 && p.condition_notes?.includes("Sample")));
  assert.ok(previewProducts.every((p) => p.images.every((src) => existsSync(`public${src}`))));
});

test("preview uses the same validated filters, count and pagination semantics", () => {
  const filter = (raw: unknown) => filterPreviewProducts(productFiltersSchema.parse(raw));
  assert.equal(filter({}).count, 7);
  assert.equal(filter({ status: "sold" }).products[0].model, "SG Standard");
  assert.equal(filter({ brand: "PRS", maxPrice: "200000", verificationStatus: "Unverified" }).count, 1);
  assert.equal(filter({ query: "TELECASTER" }).count, 1);
  assert.equal(filter({ search: "no-such-guitar" }).count, 0);
  assert.equal(filter({ brand: "Fender", condition: "documented", minPrice: 300000 }).count, 2);
  const page = filter({ limit: 2, offset: 2 });
  assert.equal(page.count, 7); assert.equal(page.products.length, 2);
  assert.equal(filter({ offset: 99 }).products.length, 0);
  assert.equal(productFiltersSchema.safeParse({ minPrice: 200, maxPrice: 100 }).success, false);
});

test("sample carts and real carts use isolated persistence keys", () => {
  const values = new Map<string, string>();
  const storage = () => ({ getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } });
  const sample = createCartStore(storage, "tonevault-cart-preview");
  const p = previewProducts[0];
  sample.addItem({ id: p.id, title: p.model, price: p.price, finish: p.finish, image: p.images[0], stock: p.stock, status: p.status });
  const real = createCartStore(storage); real.subscribe(() => {});
  assert.equal(sample.getSnapshot().length, 1); assert.equal(real.getSnapshot().length, 0);
});

test("actual development data paths retain API envelopes, detail IDs and read-only orders without credentials", () => {
  const result = runDataPath("development", "true", `
    import { GET as list } from './app/api/products/route.ts';
    import { GET as detail } from './app/api/products/[id]/route.ts';
    import { placeCatalogOrder } from './src/lib/catalog/queries.ts';
    const response = await list(new Request('http://localhost/api/products?brand=PRS'));
    const body = await response.json();
    const item = await detail(new Request('http://localhost'), {params: Promise.resolve({id:body.data[0].id})});
    const product = await item.json();
    const missing = await detail(new Request('http://localhost'), {params: Promise.resolve({id:'20000000-0000-4000-8000-999999999999'})});
    const empty = await list(new Request('http://localhost/api/products?search=no-such-guitar'));
    const order = await placeCatalogOrder({product_id:body.data[0].id,buyer_id:'20000000-0000-4000-8000-0000000000a1',quantity:1});
    console.log(JSON.stringify({status:response.status,source:response.headers.get('X-ToneVault-Data-Source'),body,product,missing:missing.status,empty:await empty.json(),order}));
  `);
  assert.equal(result.status, 200); assert.equal(result.source, "local-sample");
  assert.equal(result.body.data[0].brand, "PRS"); assert.deepEqual(result.body.products, result.body.data);
  assert.equal(result.product.data.seller.full_name, "ToneVault Sample Seller");
  assert.equal(result.product.data.inspection.inspection_level, "none");
  assert.equal(result.missing, 404); assert.deepEqual(result.empty.data, []);
  assert.equal(result.order.ok, false); assert.equal(result.order.code, "FORBIDDEN");
});

test("production with the mock flag and development without it use the unchanged credential-requiring real paths", () => {
  for (const [env, flag] of [["production", "true"], ["development", "false"]] as const) {
    const result = runDataPath(env, flag, `
      import { queryProducts, queryProductById, placeCatalogOrder } from './src/lib/catalog/queries.ts';
      const errors=[];
      for(const action of [()=>queryProducts(),()=>queryProductById('20000000-0000-4000-8000-000000000001'),()=>placeCatalogOrder({product_id:'20000000-0000-4000-8000-000000000001',buyer_id:'20000000-0000-4000-8000-0000000000a1',quantity:1})]) {
        try { await action(); errors.push('unexpected sample result'); } catch(error) { errors.push(error.message); }
      }
      console.log(JSON.stringify(errors));
    `);
    assert.equal(result.length, 3);
    assert.ok(result.every((message: string) => message.includes("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")));
  }
});
