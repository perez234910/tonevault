import { Suspense } from "react";
import { Checkout } from "@/src/components/checkout";

type Props = { searchParams: Promise<{ product?: string }> };
async function CheckoutContent({ searchParams }: Props) {
  const { product } = await searchParams;
  return <Checkout productId={typeof product === "string" ? product : ""} />;
}
export default function CheckoutPage(props: Props) {
  return <Suspense fallback={<p role="status" className="p-8">Loading checkout…</p>}><CheckoutContent {...props} /></Suspense>;
}
