import { createAdminClient } from "@/src/lib/supabase/admin";
import { pricingQuoteSchema } from "@/src/lib/validators/catalog";
import type {
  ActionResult,
  CatalogErrorCode,
  ProductStatus,
} from "@/src/types";
import {
  calculateOrderPricing,
  pricingBreakdownToPesos,
  type PricingSnapshotPesos,
} from "./calculate";

export type CatalogProductSnapshot = {
  id: string;
  price: number;
  status: ProductStatus;
  stock: number;
};

export type CatalogProductLoader = (
  productId: string,
) => Promise<ActionResult<CatalogProductSnapshot>>;

export type CatalogPricingQuote = {
  product_id: string;
  quantity: number;
  pricing: PricingSnapshotPesos;
};

function fail(code: CatalogErrorCode, error: string): ActionResult<never> {
  return { ok: false, code, error };
}

const loadCatalogProduct: CatalogProductLoader = async (productId) => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, price, status, stock")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    return fail("INTERNAL_ERROR", error.message);
  }

  if (!data) {
    return fail("NOT_FOUND", "Instrument not found.");
  }

  return {
    ok: true,
    data: {
      id: data.id,
      price: Number(data.price),
      status: data.status,
      stock: Number(data.stock ?? 0),
    },
  };
};

export async function quoteCatalogPricing(
  rawInput: unknown,
  loadProduct: CatalogProductLoader = loadCatalogProduct,
): Promise<ActionResult<CatalogPricingQuote>> {
  const parsed = pricingQuoteSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: "Invalid input.",
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join(".") || "(root)",
        message: issue.message,
      })),
    };
  }

  const product = await loadProduct(parsed.data.product_id);

  if (!product.ok) {
    return product;
  }

  if (
    product.data.status !== "available" ||
    product.data.stock < parsed.data.quantity
  ) {
    return fail(
      "CONFLICT",
      "Requested quantity exceeds available stock or this listing is already reserved.",
    );
  }

  if (!Number.isFinite(product.data.price) || product.data.price < 0) {
    return fail("INTERNAL_ERROR", "The catalog contains an invalid price.");
  }

  try {
    const breakdown = calculateOrderPricing({
      unitPriceCentavos: Math.round(product.data.price * 100),
      quantity: parsed.data.quantity,
      verificationOption: parsed.data.verification_option,
    });

    return {
      ok: true,
      data: {
        product_id: product.data.id,
        quantity: parsed.data.quantity,
        pricing: pricingBreakdownToPesos(breakdown),
      },
    };
  } catch {
    return fail("INTERNAL_ERROR", "The catalog price could not be calculated.");
  }
}
