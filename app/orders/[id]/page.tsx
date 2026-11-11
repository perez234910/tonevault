import { Suspense } from "react";
import { OrderConfirmation } from "@/src/components/order-confirmation";

type Props = { params: Promise<{ id: string }> };
async function OrderContent({ params }: Props) {
  const { id } = await params;
  return <OrderConfirmation key={id} id={id} />;
}
export default function OrderPage(props: Props) {
  return <Suspense fallback={<p role="status" className="p-8">Loading confirmation…</p>}><OrderContent {...props} /></Suspense>;
}
