import {
  ACTIVE_PRICING_RULES,
  type PricingRules,
  type VerificationOption,
} from "./rules";

export type PricingInput = {
  unitPriceCentavos: number;
  quantity: number;
  verificationOption: VerificationOption;
};

export type PricingBreakdown = PricingInput & {
  subtotalCentavos: number;
  verificationFeeCentavos: number;
  commissionRateBps: number;
  commissionCentavos: number;
  sellerPayoutCentavos: number;
  platformRevenueCentavos: number;
  buyerTotalCentavos: number;
};

export type PricingSnapshotPesos = {
  unit_price: number;
  subtotal_amount: number;
  verification_option: VerificationOption;
  verification_fee: number;
  commission_rate_bps: number;
  commission_amount: number;
  seller_payout_amount: number;
  platform_revenue_amount: number;
  total_amount: number;
};

export function calculateOrderPricing(
  input: PricingInput,
  rules: PricingRules = ACTIVE_PRICING_RULES,
): PricingBreakdown {
  if (
    !Number.isSafeInteger(input.unitPriceCentavos) ||
    input.unitPriceCentavos < 0
  ) {
    throw new RangeError(
      "unitPriceCentavos must be a nonnegative safe integer.",
    );
  }

  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) {
    throw new RangeError("quantity must be a positive integer.");
  }

  if (
    !Number.isSafeInteger(rules.commissionRateBps) ||
    rules.commissionRateBps < 0 ||
    rules.commissionRateBps > 10_000
  ) {
    throw new RangeError(
      "commissionRateBps must be between 0 and 10,000.",
    );
  }

  const verificationFeeCentavos =
    rules.verificationFeeCentavos[input.verificationOption];

  if (
    !Number.isSafeInteger(verificationFeeCentavos) ||
    verificationFeeCentavos < 0
  ) {
    throw new RangeError("verificationFeeCentavos must be nonnegative.");
  }

  const subtotalCentavos = input.unitPriceCentavos * input.quantity;

  if (!Number.isSafeInteger(subtotalCentavos)) {
    throw new RangeError("subtotalCentavos must be a safe integer.");
  }

  const commissionCentavos = Math.round(
    (subtotalCentavos * rules.commissionRateBps) / 10_000,
  );
  const sellerPayoutCentavos = subtotalCentavos - commissionCentavos;
  const platformRevenueCentavos =
    commissionCentavos + verificationFeeCentavos;
  const buyerTotalCentavos = subtotalCentavos + verificationFeeCentavos;

  return {
    ...input,
    subtotalCentavos,
    verificationFeeCentavos,
    commissionRateBps: rules.commissionRateBps,
    commissionCentavos,
    sellerPayoutCentavos,
    platformRevenueCentavos,
    buyerTotalCentavos,
  };
}

export function pricingBreakdownToPesos(
  value: PricingBreakdown,
): PricingSnapshotPesos {
  return {
    unit_price: value.unitPriceCentavos / 100,
    subtotal_amount: value.subtotalCentavos / 100,
    verification_option: value.verificationOption,
    verification_fee: value.verificationFeeCentavos / 100,
    commission_rate_bps: value.commissionRateBps,
    commission_amount: value.commissionCentavos / 100,
    seller_payout_amount: value.sellerPayoutCentavos / 100,
    platform_revenue_amount: value.platformRevenueCentavos / 100,
    total_amount: value.buyerTotalCentavos / 100,
  };
}
