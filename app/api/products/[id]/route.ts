import { queryProductById } from "@/src/lib/catalog/queries";
import { actionResultToResponse } from "@/src/lib/catalog/http";
import { isCatalogPreview } from "@/src/lib/catalog/preview-mode";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!id) {
    return Response.json(
      { ok: false, code: "NOT_FOUND", error: "Instrument not found." },
      { status: 404 },
    );
  }

  const result = await queryProductById(id);
  const response = actionResultToResponse(result);
  if (isCatalogPreview()) {
    response.headers.set("X-ToneVault-Data-Source", "local-sample");
    response.headers.set("Cache-Control", "no-store");
  }
  return response;
}
