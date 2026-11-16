import { Suspense } from "react";
import { redirect } from "next/navigation";

async function OrderRedirect({ params }: Pick<PageProps<"/orders/[id]">, "params">) {
  const { id } = await params;
  return redirect(`/confirmation/${encodeURIComponent(id)}`);
}

export default function LegacyOrderPage({ params }: PageProps<"/orders/[id]">) {
  return <Suspense fallback={<p role="status" className="p-8">Opening confirmation…</p>}>
    <OrderRedirect params={params} />
  </Suspense>;
}
