import { OwnerOrders } from "@/src/components/owner-orders";

export default function OwnerLoading() {
  return <div className="page-container"><h1>Owner dashboard</h1><p role="status" className="my-7 text-sm text-muted">Loading your dashboard…</p>
    <div aria-hidden="true" className="owner-metrics mb-10">{[0,1,2,3,4].map(index => <div key={index} className="h-24 animate-pulse bg-panel" />)}</div>
    <OwnerOrders state={{status:"loading"}} />
  </div>;
}
