import { NextRequest } from "next/server";
import { hashOrderAccess } from "@/src/lib/catalog/order-access";
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
      .select("id, product_id, buyer_id, quantity, total_amount, escrow_status, tracking_number, created_at")
      .eq("id", id);
    query = buyerId ? query.eq("buyer_id", buyerId) : query.is("buyer_id", null);
    const { data: order, error } = await query.maybeSingle();
    if (error) throw error;
    if (!order) return missing();
    const { data: pricing, error: pricingError } = await supabase.from("order_pricing")
      .select("*").eq("order_id", order.id).maybeSingle();
    if (pricingError) throw pricingError;
    return Response.json({ ok: true, data: { pricing, order: {
      ...order, quantity: Number(order.quantity), total_amount: Number(order.total_amount),
    } } }, { headers });
  } catch {
    return Response.json({ ok: false, error: "Unable to retrieve order." }, { status: 500, headers });
  }
}
