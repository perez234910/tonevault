import Link from "next/link";
import { Suspense } from "react";
import { FeaturedCollection } from "@/src/components/featured-collection";
import { Icon } from "@/src/components/ui/icon";

export default function HomePage() {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
    <section className="home-intro border-b border-line">
      <h1 aria-label="Find your sound. Know its story.">Find your sound.<br /><span className="text-muted">Know its story.</span></h1>
      <div><p className="max-w-sm text-sm leading-6 text-muted">Pre-owned guitars, with condition notes and verification details to help you choose.</p><Link href="/browse" className="ui-link mt-5">Browse the vault <Icon name="arrow" size={16} /></Link></div>
    </section>
    <section className="py-9 sm:py-12"><div className="mb-7 flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl">Featured instruments</h2><Link href="/browse?verificationStatus=Fully%20Verified" className="ui-link text-muted">Fully Verified <Icon name="arrow" size={14} /></Link></div><Suspense fallback={<div role="status" aria-label="Loading featured instruments" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3].map((n) => <div key={n} className="aspect-[4/5] bg-panel" />)}</div>}><FeaturedCollection /></Suspense></section>
  </div>;
}
