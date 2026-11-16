import { Suspense } from "react";
import { CheckoutScreen } from "@/src/components/checkout-screen";

export const metadata = { title: "Checkout" };

async function CheckoutSelection({ searchParams }: Pick<PageProps<"/checkout">, "searchParams">) {
  const { product } = await searchParams;
  return <CheckoutScreen initialProductId={typeof product === "string" ? product : ""} />;
}

export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  return <Suspense fallback={<p role="status" className="p-8">Loading checkout…</p>}>
    <CheckoutSelection searchParams={searchParams} />
  </Suspense>;
}
