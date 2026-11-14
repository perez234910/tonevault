import Link from "next/link";
import { Suspense } from "react";
import { FeaturedCollection } from "@/src/components/featured-collection";
import { Icon } from "@/src/components/ui/icon";

export default function HomePage() {
  return <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
    <section className="grid gap-12 border-b border-line py-14 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:gap-24">
      <div><p className="ui-eyebrow">Great guitars. Fewer unknowns.</p><h1 aria-label="Find your sound. Know its story." className="mt-5 text-[2.6rem] leading-[1.07] sm:text-6xl">Find your sound.<br /><span className="text-muted">Know its story.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-muted">Exceptional pre-owned guitars. Photography, condition notes, and verification details. A little more certainty with every chord.</p><Link href="/browse" className="ui-link mt-7">Browse the vault <Icon name="arrow" size={17} /></Link></div>
      <aside aria-label="About the collection" className="self-center border-l border-line pl-6 sm:pl-8"><Icon name="shield" size={24} className="mb-4 text-accent" /><h2 className="text-2xl leading-tight">Good instruments.<br />Sound decisions.</h2><p className="mt-4 max-w-xs text-sm leading-6 text-muted">Know what’s documented, what’s changed, and what you’re bringing home.</p><Link href="/browse?verificationStatus=Fully%20Verified" className="ui-link mt-5">Fully Verified only <Icon name="arrow" size={15} /></Link></aside>
    </section>
    <section className="py-12 sm:py-16"><div className="mb-8 flex flex-wrap items-end justify-between gap-3"><div><p className="ui-eyebrow mb-3">The collection</p><h2 className="text-3xl">Highest-scoring instruments</h2></div><p className="text-xs text-muted">Old souls. New beginnings.</p></div><Suspense fallback={<div role="status" aria-label="Loading featured instruments" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{[0,1,2,3].map((n) => <div key={n} className="aspect-[4/5] bg-panel" />)}</div>}><FeaturedCollection /></Suspense></section>
    <section className="border-t border-line py-12 sm:py-16"><h2 className="text-3xl leading-tight">Every guitar tells a story.<br /><span className="text-muted">Look closer at the important parts.</span></h2><div className="mt-10 grid gap-8 sm:grid-cols-3">{[
      { title: "Inspect", copy: "Photography and condition notes help you look beyond a listing title." },
      { title: "Verify", copy: "Verification labels make the level of inspection clear. Sample grades are illustrative." },
      { title: "Decide", copy: "Review your selection in the cart. Checkout remains a demo; no payment is taken." },
    ].map((item,index) => <article key={item.title}><p className="ui-eyebrow mb-4">0{index+1}</p><h3 className="text-lg">{item.title}</h3><p className="mt-3 max-w-xs text-xs leading-6 text-muted">{item.copy}</p></article>)}</div></section>
  </div>;
}
