export const VERIFICATION_OPTIONS = ["none", "remote", "physical"] as const;

export type VerificationOption = (typeof VERIFICATION_OPTIONS)[number];

export type PricingRules = Readonly<{
  commissionRateBps: number;
  verificationFeeCentavos: Readonly<Record<VerificationOption, number>>;
}>;

export const ACTIVE_PRICING_RULES = {
  commissionRateBps: 800,
  verificationFeeCentavos: {
    none: 0,
    remote: 280_000,
    physical: 850_000,
  },
} as const satisfies PricingRules;
