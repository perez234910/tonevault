import { z } from "zod";
import type { Product } from "../types";

const productSchema = z.object({
  id: z.string().uuid(),
  seller_id: z.string().uuid(),
  brand: z.string(),
  model: z.string(),
  year: z.number().int().nullable(),
  finish: z.string().nullable(),
  price: z.number().finite().nonnegative(),
  verification_status: z.enum(["Unverified", "Remote Verified", "Fully Verified"]),
  tonevault_score: z.number().int().min(1).max(100).nullable(),
  condition_notes: z.string().nullable(),
  status: z.enum(["available", "sold"]),
  stock: z.number().int().nonnegative(),
  images: z.array(z.string()),
  created_at: z.string(),
});

const listSchema = z.object({
  ok: z.literal(true),
  data: z.array(productSchema),
  count: z.number().int().nonnegative(),
});

export function buildProductsUrl(params: URLSearchParams): string {
  const query = new URLSearchParams();
  for (const key of ["brand", "minPrice", "maxPrice", "verificationStatus", "condition", "query", "search", "status", "offset"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }
  query.set("limit", "24");
  return `/api/products?${query.toString()}`;
}

export function parseProductsEnvelope(payload: unknown): { products: Product[]; count: number } {
  const parsed = listSchema.safeParse(payload);
  if (!parsed.success) throw new Error("The catalog returned an unexpected response. Please try again.");
  return { products: parsed.data.data, count: parsed.data.count };
}

export async function fetchProducts(url: string, signal: AbortSignal, fetcher: typeof fetch = fetch) {
  const response = await fetcher(url, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Unable to load the catalog. Please try again.");
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The catalog returned an unexpected response. Please try again.");
  }
  return parseProductsEnvelope(payload);
}
