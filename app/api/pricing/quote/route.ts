import { actionResultToResponse } from "@/src/lib/catalog/http";
import { quoteCatalogPricing } from "@/src/lib/pricing/catalog";

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

  const result = await quoteCatalogPricing(payload);
  return actionResultToResponse(result);
}
