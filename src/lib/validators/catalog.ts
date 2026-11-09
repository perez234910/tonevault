import { z } from "zod";
import { VERIFICATION_OPTIONS } from "@/src/lib/pricing/rules";

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
};

export const verificationStatusSchema = z.enum([
  "Unverified",
  "Remote Verified",
  "Fully Verified",
]);

export const productStatusSchema = z.enum(["available", "sold"]);

export const productFiltersSchema = z
  .object({
    brand: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(120).optional()),
    minPrice: z.preprocess(
      emptyToUndefined,
      z.coerce.number().nonnegative().finite().optional(),
    ),
    maxPrice: z.preprocess(
      emptyToUndefined,
      z.coerce.number().nonnegative().finite().optional(),
    ),
    verificationStatus: z.preprocess(
      emptyToUndefined,
      verificationStatusSchema.optional(),
    ),
    condition: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1).max(240).optional(),
    ),
    query: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(240).optional()),
    search: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(240).optional()),
    status: z.preprocess(
      emptyToUndefined,
      productStatusSchema.optional().default("available"),
    ),
    limit: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).max(100).optional().default(24),
    ),
    offset: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(0).optional().default(0),
    ),
  })
  .refine(
    (filters) =>
      filters.minPrice === undefined ||
      filters.maxPrice === undefined ||
      filters.minPrice <= filters.maxPrice,
    { message: "minPrice must be less than or equal to maxPrice", path: ["minPrice"] },
  );

export const productIdSchema = z.string().uuid("Product id must be a valid UUID");

const requiredQuantity = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    return Number(trimmed);
  }

  return value;
}, z.number({ error: "quantity is required" }).int().positive("Quantity must be greater than 0"));

export const verificationOptionSchema = z.enum(VERIFICATION_OPTIONS);

const productIdField = z
  .string({ error: "product_id is required" })
  .min(1, "product_id is required")
  .uuid("product_id must be a valid UUID");

export const pricingQuoteSchema = z.object({
  product_id: productIdField,
  quantity: requiredQuantity,
  verification_option: verificationOptionSchema.optional().default("none"),
});

export const createOrderSchema = pricingQuoteSchema.extend({
  buyer_id: z
    .string({ error: "buyer_id is required" })
    .min(1, "buyer_id is required")
    .uuid("buyer_id must be a valid UUID"),
});

export type ProductFiltersInput = z.input<typeof productFiltersSchema>;
export type ProductFilters = z.output<typeof productFiltersSchema>;
export type PricingQuoteInput = z.infer<typeof pricingQuoteSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
