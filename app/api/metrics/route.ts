
import { requireAdmin } from "@/src/lib/owner/auth";
import { calculateOwnerMetrics } from "@/src/lib/owner/metrics";


export async function GET(request: Request) {
  const access = await requireAdmin(request);

  if (!access.ok) {
    return Response.json(
      { ok: false, error: access.error },
      { status: access.status },
    );
  }

  const [ordersResult, productsResult] = await Promise.all([
    access.client.from("orders").select("*"),
    access.client.from("products").select("*"),
  ]);

  if (ordersResult.error || productsResult.error) {
    console.error(
      "Owner metrics query failed:",
      ordersResult.error ?? productsResult.error,
    );

    return Response.json(
      {
        ok: false,
        error: "Unable to calculate owner metrics.",
      },
      { status: 500 },
    );
  }

  const metrics = calculateOwnerMetrics(
    ordersResult.data ?? [],
    productsResult.data ?? [],
  );

  return Response.json({
    ok: true,
    metrics,
  });
}
