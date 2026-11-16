import type { ActionResult, CatalogErrorCode, Order } from "@/src/types";

const STATUS_BY_CODE: Record<CatalogErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  NOT_AVAILABLE: 409,
  CONFLICT: 409,
  FORBIDDEN: 403,
  INTERNAL_ERROR: 500,
};

export function actionResultToResponse<T>(result: ActionResult<T>, successStatus = 200) {
  if (result.ok) {
    return Response.json(result, { status: successStatus });
  }

  return Response.json(result, { status: STATUS_BY_CODE[result.code] });
}

export function httpStatusFor(result: ActionResult<unknown>, successStatus = 200) {
  if (result.ok) return successStatus;
  return STATUS_BY_CODE[result.code];
}


export function buyerOrderResponse(order: Order) {
  return {
    id: order.id,
    product_id: order.product_id,
    buyer_id: order.buyer_id,
    quantity: order.quantity,
    unit_price: order.unit_price,
    subtotal_amount: order.subtotal_amount,
    verification_option: order.verification_option,
    verification_fee: order.verification_fee,
    total_amount: order.total_amount,
    escrow_status: order.escrow_status,
    tracking_number: order.tracking_number,
    created_at: order.created_at,
  };
}
