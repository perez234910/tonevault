import { NextRequest } from "next/server";
import { GUEST_ORDER_ACCESS_SECONDS, hashOrderAccess } from "@/src/lib/catalog/order-access";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { productIdSchema } from "@/src/lib/validators/catalog";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = { "Cache-Control": "private, no-store" };
  const missing = () => Response.json({ ok: false, error: "Order not found." }, { status: 404, headers });
  if (!productIdSchema.safeParse(id).success) return missing();
  const accessToken = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  const guestToken = new NextRequest(request.url, { headers: request.headers }).cookies.get(`order_access_${id}`)?.value;
  if (!accessToken && !guestToken) return Response.json({ ok: false, error: "Open this confirmation in the checkout browser, or sign in to the buyer account." }, { status: 401, headers });
  try {
    const supabase = createAdminClient();
    let buyerId: string | null = null;
    if (accessToken) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      if (authError || !user) return Response.json({ ok: false, error: "Invalid login." }, { status: 401, headers });
      buyerId = user.id;
    } else {
      if (!guestToken || !/^[a-f0-9]{64}$/.test(guestToken)) return missing();
      const { data: access, error: accessError } = await supabase.from("order_checkout_details")
        .select("order_id").eq("order_id", id).eq("guest_token_hash", hashOrderAccess(guestToken)).maybeSingle();
      if (accessError) throw accessError;
      if (!access) return missing();
    }
    // The service client bypasses RLS: authorize the account or private cookie first.
    let query = supabase.from("orders")
      .select("id, product_id, buyer_id, quantity, unit_price, subtotal_amount, verification_option, verification_fee, commission_rate_bps, commission_amount, seller_payout_amount, platform_revenue_amount, total_amount, escrow_status, tracking_number, created_at")
      .eq("id", id);
    if (buyerId) {
      query = query.eq("buyer_id", buyerId);
    } else {
      const cutoff = new Date(Date.now() - GUEST_ORDER_ACCESS_SECONDS * 1000).toISOString();
      query = query.is("buyer_id", null).gt("created_at", cutoff);
    }
    const { data: order, error } = await query.maybeSingle();
    if (error) throw error;
    if (!order) return missing();
    return Response.json({ ok: true, data: { order: {
      ...order, quantity: Number(order.quantity), total_amount: Number(order.total_amount),
    } } }, { headers });
  } catch {
    return Response.json({ ok: false, error: "Unable to retrieve order." }, { status: 500, headers });
  }
}
