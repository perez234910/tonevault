import { z } from "zod";
import type { ProductDetail } from "../types";

const verification = z.enum(["Unverified", "Remote Verified", "Fully Verified"]);
const nullableText = z.string().nullable();
const score = z.number().int().min(1).max(100).nullable();
const detailEnvelope = z.object({ ok: z.literal(true), data: z.object({
  id: z.string().uuid(), seller_id: z.string().uuid(), brand: z.string(), model: z.string(),
  year: z.number().int().nullable(), finish: nullableText, price: z.number().finite().nonnegative(),
  verification_status: verification, tonevault_score: score, condition_notes: nullableText,
  status: z.enum(["available", "sold"]), stock: z.number().int().nonnegative(), images: z.array(z.string()), created_at: z.string(),
  seller: z.object({ id: z.string().uuid(), full_name: z.string(), role: z.enum(["buyer", "seller", "admin", "luthier"]), created_at: z.string() }).nullable(),
  inspection: z.object({ verification_status: verification, tonevault_score: score, score_scale: z.literal(100), condition_notes: nullableText, is_verified: z.boolean(), inspection_level: z.enum(["none", "remote", "in_person"]) }),
}) });

export class ProductLoadError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); this.name = "ProductLoadError"; }
}

export function parseProductDetail(payload: unknown): ProductDetail {
  const parsed = detailEnvelope.safeParse(payload);
  if (!parsed.success) throw new ProductLoadError("The instrument response was incomplete. Please try again.");
  return parsed.data.data;
}

export async function fetchProductDetail(id: string, signal: AbortSignal, fetcher: typeof fetch = fetch) {
  const response = await fetcher(`/api/products/${encodeURIComponent(id)}`, { signal, cache: "no-store", headers: { Accept: "application/json" } });
  if (response.status === 404) throw new ProductLoadError("This instrument could not be found.", 404);
  if (!response.ok) throw new ProductLoadError("Unable to load this instrument. Please try again.", response.status);
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new ProductLoadError("The instrument response was incomplete. Please try again."); }
  return parseProductDetail(payload);
}
