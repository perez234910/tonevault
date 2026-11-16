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

  try {
    const result = await quoteCatalogPricing(payload);
    return actionResultToResponse(result);
  } catch {
    return actionResultToResponse({
      ok: false,
      code: "INTERNAL_ERROR",
      error: "Unable to calculate pricing.",
    });
  }
}
