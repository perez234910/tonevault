import { z } from "zod";
import { instrumentTitle } from "./format";

export const SEARCH_DEBOUNCE_MS = 200;
const envelope = z.object({ ok: z.literal(true), products: z.array(z.object({
  id: z.uuid(), brand: z.string().trim().min(1), model: z.string().trim().min(1), year: z.number().int().nullable(),
})), count: z.number().int().nonnegative() });

export type CatalogSuggestion =
  | { kind: "brand"; key: string; label: string; brand: string }
  | { kind: "product"; key: string; label: string; id: string };

export function parseCatalogSuggestions(payload: unknown, query: string): CatalogSuggestion[] {
  const result = envelope.safeParse(payload);
  if (!result.success) throw new Error("Invalid catalog response");
  const brands = new Map<string, CatalogSuggestion>();
  const products = new Map<string, CatalogSuggestion>();
  for (const product of result.data.products) {
    const brandKey = product.brand.toLocaleLowerCase();
    if (brandKey.includes(query.trim().toLocaleLowerCase()) && !brands.has(brandKey)) {
      brands.set(brandKey, { kind: "brand", key: `brand:${brandKey}`, label: product.brand, brand: product.brand });
    }
    products.set(product.id, { kind: "product", key: product.id, label: instrumentTitle(product), id: product.id });
  }
  return [...[...brands.values()].slice(0, 3), ...[...products.values()].slice(0, 6)];
}

export async function fetchCatalogSuggestions(query: string, signal: AbortSignal, status: "available" | "sold" = "available", fetcher: typeof fetch = fetch) {
  const params = new URLSearchParams({ query: query.trim(), status, limit: "6" });
  const response = await fetcher(`/api/products?${params}`, { signal, cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Suggestions unavailable");
  return parseCatalogSuggestions(await response.json(), query);
}

export function suggestionHref(suggestion: CatalogSuggestion, existing?: URLSearchParams) {
  if (suggestion.kind === "product") return `/products/${encodeURIComponent(suggestion.id)}`;
  const params = new URLSearchParams(existing);
  for (const name of ["query", "search", "offset"]) params.delete(name);
  params.set("brand", suggestion.brand);
  return `/browse?${params}`;
}
