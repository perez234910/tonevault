import { z } from "zod";

const orderSchema = z.object({
  id: z.uuid(), product_id: z.uuid(), buyer_id: z.uuid().nullable(), quantity: z.number().int().positive(),
  total_amount: z.number().nonnegative().finite(), escrow_status: z.enum(["pending","paid","awaiting_shipment","shipped","delivered","approved","payout_released"]),
  tracking_number: z.string().nullable(), created_at: z.iso.datetime({offset:true}),
});
export type SavedOrder = z.infer<typeof orderSchema>;
export class OrderReadError extends Error {
  constructor(public readonly kind: "unavailable" | "missing" | "denied" | "invalid", message: string) { super(message); }
}

/** Member 3 read envelope. The API authorizes the private guest cookie or buyer token. */
export async function fetchSavedOrder(
  id: string,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
  options: { accessToken?: string } = {},
): Promise<SavedOrder> {
  if (!z.uuid().safeParse(id).success) throw new OrderReadError("invalid","Enter a valid saved order reference.");
  const response = await fetcher(`/api/orders/${encodeURIComponent(id)}`, {
    signal, cache: "no-store", credentials: "same-origin",
    headers: { Accept: "application/json", ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}) },
  });
  if ([401,403].includes(response.status)) throw new OrderReadError("denied","Open this order in the checkout browser, or sign in to the buyer account when account access is connected.");
  if (!response.headers.get("content-type")?.includes("application/json") || response.status===405 || response.status===501) throw new OrderReadError("unavailable","Saved order lookup is not connected yet. No confirmation can be verified.");
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new OrderReadError("invalid","The order response could not be verified. No confirmation is displayed."); }
  const missing = z.object({ ok: z.literal(false), error: z.string() }).safeParse(body);
  const legacyMissing = z.object({ code: z.literal("NOT_FOUND") }).safeParse(body);
  if (response.status===404 && (missing.success || legacyMissing.success)) throw new OrderReadError("missing","No accessible saved order was found for this reference.");
  if (!response.ok) throw new OrderReadError("unavailable","Unable to load this order. Try again later.");
  const parsed = z.object({ok:z.literal(true),data:z.object({order:orderSchema})}).safeParse(body);
  if (!parsed.success || parsed.data.data.order.id!==id) throw new OrderReadError("invalid","The order response could not be verified. No confirmation is displayed.");
  return parsed.data.data.order;
}
