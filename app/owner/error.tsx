"use client";

import Link from "next/link";

export default function OwnerError({ reset }: { reset: () => void }) {
  return <div className="page-container"><h1>Owner dashboard unavailable</h1><section className="empty-panel"><p role="alert">We couldn’t load this view. No orders or business totals are being displayed.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" className="ui-button" onClick={reset}>Try again</button><Link href="/browse" className="ui-button ui-button--primary">Return to storefront</Link></div></section></div>;
}
