export type CheckoutDraft = { email: string; fullName: string; street: string; city: string; postalCode: string; payment: string; phone: string; paymentConfirmed: boolean };
export type CheckoutErrors = Partial<Record<keyof CheckoutDraft, string>>;
export function validateCheckoutStep(step: number, draft: CheckoutDraft): CheckoutErrors {
  const errors: CheckoutErrors = {};
  if (step === 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = "Enter a valid email address.";
    if (draft.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
    if (!/^[+0-9() .-]{7,30}$/.test(draft.phone.trim()) || draft.phone.replace(/\D/g, "").length < 7) errors.phone = "Enter a valid phone number.";
  }
  if (step === 1) {
    if (draft.street.trim().length < 3) errors.street = "Enter a street address.";
    if (draft.city.trim().length < 2) errors.city = "Enter a city.";
    if (!/^\d{4}$/.test(draft.postalCode.trim())) errors.postalCode = "Enter a four-digit Philippine postal code.";
  }
  if (step === 2) {
    if (!["simulated_card", "simulated_gcash"].includes(draft.payment)) errors.payment = "Choose a simulated payment method.";
    if (!draft.paymentConfirmed) errors.paymentConfirmed = "Acknowledge that no payment will be taken.";
  }
  return errors;
}
