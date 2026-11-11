
import { placeCatalogOrder } from "@/src/lib/catalog/queries";
import { actionResultToResponse } from "@/src/lib/catalog/http";
import { requireAdmin } from "@/src/lib/owner/auth";
import { revalidateTag } from "next/cache";


export async function GET(request: Request) {
  const access = await requireAdmin(request);

  if (!access.ok) {
    return Response.json(
      { ok: false, error: access.error },
      { status: access.status },
    );
  }

  const { data, error } = await access.client
    .from("orders")
    .select(
      "*, product:products!orders_product_id_fkey(id, brand, model), buyer:users!orders_buyer_id_fkey(id, full_name)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Owner orders query failed:", error);

    return Response.json(
      {
        ok: false,
        error: "Unable to retrieve orders.",
      },
      { status: 500 },
    );
  }

  return Response.json({
    ok: true,
    orders: (data ?? []).map((order) => ({
      ...order,
      quantity: Number(order.quantity),
      total_amount: Number(order.total_amount),
    })),
  });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        error: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const result = await placeCatalogOrder(payload);

  if (result.ok) {
    revalidateTag("products", "max");
    revalidateTag(`product-${result.data.order.product_id}`, "max");
  }

  return actionResultToResponse(result, 201);
}
