import { quoteCatalogPricing } from "@/src/lib/pricing/catalog";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { checkoutOrderSchema } from "@/src/lib/validators/checkout-order";
import type { ActionResult, Order } from "@/src/types";

export async function placeCheckoutOrder(input: unknown, buyerId: string | null, guestTokenHash: string | null = null): Promise<ActionResult<{ order: Order }>> {
  const parsed = checkoutOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Check your customer and simulated payment details.",
      issues: parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })) };
  }
  const { customer, product_id, quantity, payment_method, verification_option } = parsed.data;
  try {
    const quote = await quoteCatalogPricing({ product_id, quantity, verification_option });
    if (!quote.ok) {
      return quote.code === "INTERNAL_ERROR"
        ? { ok: false, code: "INTERNAL_ERROR", error: "Unable to calculate order pricing." } : quote;
    }
    const pricing = quote.data.pricing;
    const { data, error } = await createAdminClient().rpc("place_checkout_order", {
      p_product_id: product_id, p_quantity: quantity, p_buyer_id: buyerId, p_full_name: customer.full_name,
      p_email: customer.email, p_phone: customer.phone, p_address: customer.address,
      p_payment_method: payment_method, p_guest_token_hash: guestTokenHash,
      p_verification_option: pricing.verification_option, p_expected_unit_price: pricing.unit_price,
      p_subtotal_amount: pricing.subtotal_amount, p_verification_fee: pricing.verification_fee,
      p_commission_rate_bps: pricing.commission_rate_bps, p_commission_amount: pricing.commission_amount,
      p_seller_payout_amount: pricing.seller_payout_amount, p_platform_revenue_amount: pricing.platform_revenue_amount,
      p_total_amount: pricing.total_amount,
    });
    if (error) {
      if (/LISTING_NOT_FOUND/.test(error.message)) return { ok: false, code: "NOT_FOUND", error: "Instrument not found." };
      if (/INSUFFICIENT_STOCK|SLOT_TAKEN|LISTING_NOT_AVAILABLE/.test(error.message)) return { ok: false, code: "CONFLICT", error: "This instrument is no longer available in the requested quantity." };
      if (/CANNOT_PURCHASE_OWN_LISTING/.test(error.message)) return { ok: false, code: "FORBIDDEN", error: "You cannot purchase your own instrument." };
      if (/BUYER_NOT_FOUND/.test(error.message)) return { ok: false, code: "NOT_FOUND", error: "Buyer profile not found." };
      if (/PRICE_CHANGED/.test(error.message)) return { ok: false, code: "CONFLICT", error: "The catalog price changed. Request a fresh quote." };
      if (/INVALID_QUANTITY/.test(error.message)) return { ok: false, code: "VALIDATION_ERROR", error: "Quantity must be greater than zero." };
      throw error;
    }
    if (!data) throw new Error("Order not returned");
    return { ok: true, data: { order: { ...data, quantity: Number(data.quantity), total_amount: Number(data.total_amount) } } };
  } catch {
    return { ok: false, code: "INTERNAL_ERROR", error: "Unable to save your order. Please try again." };
  }
}
