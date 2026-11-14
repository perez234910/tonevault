import Link from "next/link";
import { Icon } from "@/src/components/ui/icon";
import { OwnerOrders } from "@/src/components/owner-orders";
export const metadata = { title: "Owner dashboard", robots: { index: false, follow: false } };
const metrics = ["Total orders", "Total revenue", "Average order value", "Top-selling instrument", "Low-stock instruments"];

/** Public layout only. Private owner data requires Member 5's authenticated APIs. */
export default function OwnerPage() {
  return <div className="page-container owner-layout">
    <aside className="owner-sidebar"><h2 className="text-base">Seller studio</h2><nav aria-label="Owner dashboard navigation" className="mt-5"><a href="#overview">Overview <Icon name="arrow" size={13} /></a><a href="#orders">Orders <Icon name="arrow" size={13} /></a><Link href="/browse">Storefront <Icon name="arrow" size={13} /></Link></nav></aside>
    <div className="min-w-0"><header className="flex flex-wrap items-center justify-between gap-5"><h1 className="text-3xl">Your storefront</h1><Link href="/" className="ui-link">View storefront <Icon name="arrow" size={14} /></Link></header>
      <p role="status" className="owner-access-note">Owner access is not connected. Business metrics and private orders are unavailable.</p>
      <section id="overview" aria-labelledby="overview-heading" tabIndex={-1}><h2 id="overview-heading" className="mb-6 text-xl">Overview</h2><dl className="owner-metrics">{metrics.map(label=><div key={label}><dt>{label}</dt><dd><span aria-hidden="true">—</span><span className="metric-unavailable">Unavailable</span></dd></div>)}</dl></section>
      <section id="orders" aria-labelledby="orders-heading" tabIndex={-1} className="mt-12"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h2 id="orders-heading" className="text-xl">Orders</h2><Link href="/confirmation" className="ui-link">Find a saved order <Icon name="arrow" size={14} /></Link></div>
        <OwnerOrders state={{status:"unavailable"}} />
      </section>
    </div>
  </div>;
}
