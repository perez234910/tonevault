import type { Product, PublicSeller } from "../../types";
import type { ProductFilters } from "../validators/catalog";

/** Fictional local fixtures, never database records or real inspection evidence. */
export const previewSeller: PublicSeller = {
  id: "20000000-0000-4000-8000-0000000000a1",
  full_name: "ToneVault Sample Seller",
  role: "seller",
  created_at: "2026-11-08T00:00:00Z",
};

type GuitarFixture = Pick<Product, "brand" | "model" | "year" | "finish" | "price" | "verification_status" | "tonevault_score" | "stock" | "condition_notes">;
const guitars: GuitarFixture[] = [
  { brand: "Fender", model: "Stratocaster", year: 1965, finish: "Olympic White", price: 485000, verification_status: "Fully Verified", tonevault_score: 94, stock: 1, condition_notes: "Sample listing: original-style single coils, light checking and documented setup. Illustrative photography; no actual inspection is claimed." },
  { brand: "Gibson", model: "Les Paul Standard", year: 1959, finish: "Cherry Sunburst", price: 2850000, verification_status: "Fully Verified", tonevault_score: 96, stock: 1, condition_notes: "Sample listing: figured maple top, original-style humbuckers and documented finish checking. Illustrative photography." },
  { brand: "Fender", model: "Telecaster", year: 1972, finish: "Butterscotch Blonde", price: 265000, verification_status: "Remote Verified", tonevault_score: null, stock: 1, condition_notes: "Sample listing: ash body, maple neck and honest playwear. Remote grade is fictional preview information." },
  { brand: "Gibson", model: "ES-335", year: 1964, finish: "Cherry", price: 195000, verification_status: "Fully Verified", tonevault_score: 91, stock: 1, condition_notes: "Sample listing: semi-hollow body, documented setup and light checking around the binding." },
  { brand: "PRS", model: "Custom 24", year: 2016, finish: "Cobalt Blue", price: 168000, verification_status: "Unverified", tonevault_score: null, stock: 3, condition_notes: "Sample listing: pre-owned carved-top model with 24 frets and light playwear. Three fictional units support quantity-control testing; no real inventory." },
  { brand: "Fender", model: "Jazzmaster", year: 1968, finish: "Aquamarine Blue", price: 325000, verification_status: "Fully Verified", tonevault_score: 92, stock: 1, condition_notes: "Sample listing: offset body, original-style tremolo and documented rhythm circuit. Illustrative photography." },
  { brand: "Fender", model: "Stratocaster", year: 1954, finish: "Two-tone Sunburst", price: 3450000, verification_status: "Fully Verified", tonevault_score: 98, stock: 1, condition_notes: "Sample listing: first-year-style Strat with maple neck and original-style hardware. Verification score is fictional." },
  { brand: "Gibson", model: "SG Standard", year: 1961, finish: "Cherry", price: 420000, verification_status: "Remote Verified", tonevault_score: null, stock: 0, condition_notes: "Sample sold-out listing for testing unavailable actions. No real sale has occurred." },
];

export const previewProducts: Product[] = guitars.map((guitar, index) => ({
  ...guitar,
  id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  seller_id: previewSeller.id,
  status: guitar.stock === 0 ? "sold" : "available",
  images: index === 5
    ? ["/preview/guitar-6.jpg", "/preview/guitar-6-detail.jpg"]
    : ["/preview/guitar-7.jpg", "/preview/guitar-7-detail.jpg"],
  created_at: "2026-11-08T00:00:00Z",
}));

function keyword(value: string) {
  return value.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

export function filterPreviewProducts(filters: ProductFilters) {
  const search = keyword(filters.search ?? filters.query ?? "");
  const products = previewProducts.filter((product) =>
    product.status === filters.status &&
    (!filters.brand || product.brand.toLowerCase().includes(keyword(filters.brand))) &&
    (filters.minPrice === undefined || product.price >= filters.minPrice) &&
    (filters.maxPrice === undefined || product.price <= filters.maxPrice) &&
    (!filters.verificationStatus || product.verification_status === filters.verificationStatus) &&
    (!filters.condition || (product.condition_notes ?? "").toLowerCase().includes(keyword(filters.condition))) &&
    (!search || [product.brand, product.model, product.finish, product.condition_notes].some((value) => value?.toLowerCase().includes(search))),
  );
  // Count is the complete filtered set, independent of the returned page.
  return { products: products.slice(filters.offset, filters.offset + filters.limit), count: products.length };
}
