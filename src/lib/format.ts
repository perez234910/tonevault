import type { VerificationStatus } from "@/src/types";

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function instrumentTitle(product: {
  year: number | null;
  brand: string;
  model: string;
}) {
  const year = product.year ? `${product.year} ` : "";
  return `${year}${product.brand} ${product.model}`;
}

export function verificationLabel(status: VerificationStatus) {
  if (status === "Fully Verified") return "Fully Verified";
  if (status === "Remote Verified") return "Remote Verified";
  return "Unverified";
}
