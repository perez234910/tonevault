import { ZodError } from "zod";
import { quoteCatalogPricing } from "@/src/lib/pricing/catalog";
import { createAdminClient } from "@/src/lib/supabase/admin";
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
    unit_price: Number(row.unit_price),
    subtotal_amount: Number(row.subtotal_amount),
    verification_fee: Number(row.verification_fee),
    commission_rate_bps: Number(row.commission_rate_bps),
    commission_amount: Number(row.commission_amount),
    seller_payout_amount: Number(row.seller_payout_amount),
    platform_revenue_amount: Number(row.platform_revenue_amount),
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
  const parsed = createOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const quote = await quoteCatalogPricing({
    product_id: parsed.data.product_id,
    quantity: parsed.data.quantity,
    verification_option: parsed.data.verification_option,
  });

  if (!quote.ok) {
    return quote;
  }

  const pricing = quote.data.pricing;
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("place_catalog_order", {
    p_product_id: parsed.data.product_id,
    p_buyer_id: parsed.data.buyer_id,
    p_quantity: parsed.data.quantity,
    p_verification_option: pricing.verification_option,
    p_expected_unit_price: pricing.unit_price,
    p_subtotal_amount: pricing.subtotal_amount,
    p_verification_fee: pricing.verification_fee,
    p_commission_rate_bps: pricing.commission_rate_bps,
    p_commission_amount: pricing.commission_amount,
    p_seller_payout_amount: pricing.seller_payout_amount,
    p_platform_revenue_amount: pricing.platform_revenue_amount,
    p_total_amount: pricing.total_amount,
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

    if (message.includes("PRICE_CHANGED")) {
      return fail(
        "CONFLICT",
        "The catalog price changed. Request a fresh quote.",
      );
    }

    if (message.includes("INVALID_PRICING_SNAPSHOT")) {
      return fail(
        "INTERNAL_ERROR",
        "The server could not verify the pricing breakdown.",
      );
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
