import { Suspense } from "react";
import { ConfirmationScreen } from "@/src/components/confirmation-screen";
export const metadata = { title: "Saved order", robots: { index: false, follow: false } };
async function OrderReference({ params }: Pick<PageProps<"/confirmation/[id]">, "params">) {
  const {id}=await params;
  return <ConfirmationScreen id={id} />;
}
export default function ConfirmationPage({ params }: PageProps<"/confirmation/[id]">) {
  return <Suspense fallback={<div className="page-container"><h1>Saved order</h1><p role="status" className="mt-6">Loading order reference…</p></div>}><OrderReference params={params} /></Suspense>;
}
