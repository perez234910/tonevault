import { NextResponse } from "next/server";
import { createOrderAccess } from "@/src/lib/catalog/order-access";
import { placeCatalogOrder } from "@/src/lib/catalog/queries";
import { placeCheckoutOrder } from "@/src/lib/catalog/checkout-orders";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { actionResultToResponse } from "@/src/lib/catalog/http";
import { revalidateTag } from "next/cache";
import type { Order } from "@/src/types";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, code: "VALIDATION_ERROR", error: "Request body must be valid JSON." }, { status: 400 });
  }
  const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  const checkout = typeof payload === "object" && payload !== null && "customer" in payload;
  if ((!token && !checkout) || (request.headers.has("authorization") && !token)) {
    return Response.json({ ok: false, error: "Use checkout with customer details or sign in." }, { status: 401 });
  }
  try {
    let buyerId: string | null = null;
    if (token) {
      const { data: { user }, error } = await createAdminClient().auth.getUser(token);
      if (error || !user) return Response.json({ ok: false, error: "Invalid login. Please sign in again." }, { status: 401 });
      buyerId = user.id;
    }
    const access = buyerId === null ? createOrderAccess() : null;
    // Account identity comes from Auth; guest identity never comes from browser buyer_id.
    const input = typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? { ...payload, buyer_id: buyerId } : payload;
    const result = checkout ? await placeCheckoutOrder(input, buyerId, access?.hash ?? null) : await placeCatalogOrder(input);
    if (result.ok) {
      revalidateTag("products", "max");
      revalidateTag(`product-${result.data.order.product_id}`, "max");
    }
    if (result.ok && access) {
      const response = NextResponse.json(result, { status: 201 });
      response.cookies.set(`order_access_${result.data.order.id}`, access.token, {
        httpOnly: true, sameSite: "strict", secure: new URL(request.url).protocol === "https:",
        path: `/api/orders/${result.data.order.id}`, maxAge: 60 * 60 * 24 * 7,
      });
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
    const response = actionResultToResponse<{ order: Order }>(result, 201);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return Response.json({ ok: false, error: "Unable to save your order." }, { status: 500 });
  }
}
