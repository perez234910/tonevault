import { z } from "zod";
import { pricingQuoteSchema } from "./catalog";

export const checkoutOrderSchema = pricingQuoteSchema.extend({
  customer: z.object({
    full_name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(7).max(30).regex(/^[+0-9() .-]+$/),
    address: z.string().trim().min(10).max(500),
  }),
  payment_method: z.enum(["simulated_card", "simulated_gcash"]),
  payment_confirmed: z.literal(true),
});
