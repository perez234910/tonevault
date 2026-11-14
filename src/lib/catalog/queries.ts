import { ZodError } from "zod";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { isCatalogPreview } from "./preview-mode";
import {
  createOrderSchema,
  productFiltersSchema,
  productIdSchema,
  type ProductFiltersInput,
} from "@/src/lib/validators/catalog";
import type {
  ActionResult,
  CatalogErrorCode,
  InspectionMetrics,
  Order,
  Product,
  ProductDetail,
  PublicSeller,
  VerificationStatus,
} from "@/src/types";

type ProductRow = Product & {
  seller?: PublicSeller | PublicSeller[] | null;
};

function fail(
  code: CatalogErrorCode,
  error: string,
  issues?: { path: string; message: string }[],
): ActionResult<never> {
  return { ok: false, code, error, issues };
}

function fromZodError(error: ZodError): ActionResult<never> {
  return fail(
    "VALIDATION_ERROR",
    "Invalid input.",
    error.issues.map((issue) => ({
      path: issue.path.join(".") || "(root)",
      message: issue.message,
    })),
  );
}

function sanitizeIlike(value: string) {
  return value.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
}

function mapProduct(row: Product): Product {
  return {
    ...row,
    price: Number(row.price),
    stock: Number(row.stock ?? 0),
    images: row.images ?? [],
  };
}

function mapOrder(row: Order): Order {
  return {
    ...row,
    quantity: Number(row.quantity),
    total_amount: Number(row.total_amount),
  };
}

function inspectionLevel(status: VerificationStatus): InspectionMetrics["inspection_level"] {
  if (status === "Fully Verified") return "in_person";
  if (status === "Remote Verified") return "remote";
  return "none";
}

export function buildInspectionMetrics(product: Product): InspectionMetrics {
  return {
    verification_status: product.verification_status,
    tonevault_score: product.tonevault_score,
    score_scale: 100,
    condition_notes: product.condition_notes,
    is_verified: product.verification_status !== "Unverified",
    inspection_level: inspectionLevel(product.verification_status),
  };
}

function mapSeller(seller: ProductRow["seller"]): PublicSeller | null {
  if (!seller) return null;
  const profile = Array.isArray(seller) ? seller[0] : seller;
  if (!profile) return null;

  return {
    id: profile.id,
    full_name: profile.full_name,
    role: profile.role,
    created_at: profile.created_at,
  };
}

export async function queryProducts(
  rawFilters: ProductFiltersInput | unknown = {},
): Promise<ActionResult<{ products: Product[]; count: number }>> {
  const parsed = productFiltersSchema.safeParse(rawFilters ?? {});
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const filters = parsed.data;
  if (isCatalogPreview()) {
    const { filterPreviewProducts } = await import("./mock-data");
    return { ok: true, data: filterPreviewProducts(filters) };
  }
  const keywordSource = filters.search ?? filters.query;
  const supabase = createAdminClient();

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("status", filters.status)
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.brand) {
    query = query.ilike("brand", `%${sanitizeIlike(filters.brand)}%`);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte("price", filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte("price", filters.maxPrice);
  }

  if (filters.verificationStatus) {
    query = query.eq("verification_status", filters.verificationStatus);
  }

  if (filters.condition) {
    const condition = sanitizeIlike(filters.condition);
    if (condition) {
      query = query.ilike("condition_notes", `%${condition}%`);
    }
  }

  if (keywordSource) {
    const keyword = sanitizeIlike(keywordSource);
    if (keyword) {
      query = query.or(
        [
          `brand.ilike.%${keyword}%`,
          `model.ilike.%${keyword}%`,
          `finish.ilike.%${keyword}%`,
          `condition_notes.ilike.%${keyword}%`,
        ].join(","),
      );
    }
  }

  const { data, error, count } = await query;

  if (error) {
    return fail("INTERNAL_ERROR", error.message);
  }

  return {
    ok: true,
    data: {
      products: (data ?? []).map(mapProduct),
      count: count ?? 0,
    },
  };
}

export async function queryProductById(
  rawId: unknown,
): Promise<ActionResult<ProductDetail>> {
  if (rawId == null || String(rawId).trim() === "") {
    return fail("NOT_FOUND", "Instrument not found.");
  }

  const parsed = productIdSchema.safeParse(rawId);
  if (!parsed.success) {
    return fail("NOT_FOUND", "Instrument not found.");
  }

  if (isCatalogPreview()) {
    const { previewProducts, previewSeller } = await import("./mock-data");
    const product = previewProducts.find((item) => item.id === parsed.data);
    return product
      ? { ok: true, data: { ...product, seller: previewSeller, inspection: buildInspectionMetrics(product) } }
      : fail("NOT_FOUND", "Instrument not found.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, seller_id, brand, model, year, finish, price, verification_status, tonevault_score, condition_notes, status, stock, images, created_at, seller:users!products_seller_id_fkey(id, full_name, role, created_at)",
    )
    .eq("id", parsed.data)
    .maybeSingle();

  if (error) {
    return fail("INTERNAL_ERROR", error.message);
  }

  if (!data) {
    return fail("NOT_FOUND", "Instrument not found.");
  }

  const product = mapProduct(data);
  const seller = mapSeller(data.seller);

  return {
    ok: true,
    data: {
      ...product,
      seller,
      inspection: buildInspectionMetrics(product),
    },
  };
}

export async function placeCatalogOrder(
  rawInput: unknown,
): Promise<ActionResult<{ order: Order; listing_status: "available" | "sold" }>> {
  if (isCatalogPreview()) {
    return fail("FORBIDDEN", "Sample preview is read-only. Orders are not saved and no payment is taken.");
  }
  const parsed = createOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("place_catalog_order", {
    p_product_id: parsed.data.product_id,
    p_buyer_id: parsed.data.buyer_id,
    p_quantity: parsed.data.quantity,
  });

  if (error) {
    const message = error.message ?? "Unable to create order.";

    if (message.includes("INVALID_QUANTITY")) {
      return fail("VALIDATION_ERROR", "Quantity must be greater than 0.");
    }

    if (message.includes("LISTING_NOT_FOUND")) {
      return fail("NOT_FOUND", "Instrument not found.");
    }

    if (message.includes("INSUFFICIENT_STOCK") || message.includes("SLOT_TAKEN")) {
      return fail(
        "CONFLICT",
        "Requested quantity exceeds available stock or this listing is already reserved.",
      );
    }

    if (message.includes("LISTING_NOT_AVAILABLE")) {
      return fail("CONFLICT", "This instrument is no longer available.");
    }

    if (message.includes("BUYER_NOT_FOUND")) {
      return fail("NOT_FOUND", "Buyer profile not found.");
    }

    if (message.includes("CANNOT_PURCHASE_OWN_LISTING")) {
      return fail("FORBIDDEN", "Sellers cannot purchase their own listings.");
    }

    return fail("INTERNAL_ERROR", message);
  }

  if (!data) {
    return fail("INTERNAL_ERROR", "Order was not created.");
  }

  const order = mapOrder(data);
  const { data: listing } = await supabase
    .from("products")
    .select("status")
    .eq("id", order.product_id)
    .maybeSingle();

  return {
    ok: true,
    data: {
      order,
      listing_status: listing?.status === "sold" ? "sold" : "available",
    },
  };
}
