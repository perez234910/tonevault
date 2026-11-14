import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { FeaturedCollection } from "@/src/components/featured-collection";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=2000&q=80";

export default function HomePage() {
  return (
    <div>
      <section className="relative isolate min-h-[78vh] overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Vintage electric guitar in warm stage light"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/25" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 py-20 sm:px-6">
          <p className="text-xs uppercase tracking-[0.32em] text-gold">Pre-owned · Vintage · Simulated checkout</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] text-foreground sm:text-7xl">
            Find your sound. Know its story.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Explore high-end instruments with condition notes, photography, and verification labels.
            This course prototype uses simulated checkout; no funds are collected or held.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-background"
            >
              Browse the vault
            </Link>
            <Link
              href="/browse?verificationStatus=Fully%20Verified"
              className="rounded-full border border-gold/40 px-6 py-3 text-sm text-gold-soft"
            >
              Fully Verified only
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3 sm:px-6">
        <ValueCard
          title="Inspect"
          copy="Condition notes, photography, and construction details are standardized so you are not buying from a listing paragraph."
        />
        <ValueCard
          title="Verify"
          copy="Remote or in-person verification produces a ToneVault Score from 1–100, covering originality, playability, and documentation."
        />
        <ValueCard
          title="Protect"
          copy="Review each instrument before deciding. Checkout is simulated in this course prototype; real payments and escrow are not connected."
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Featured collection</p>
            <h2 className="mt-2 font-serif text-4xl text-foreground">Highest-scoring instruments</h2>
          </div>
        </div>
        <Suspense fallback={<FeaturedSkeleton />}>
          <FeaturedCollection />
        </Suspense>
      </section>
    </div>
  );
}

function ValueCard({ title, copy }: { title: string; copy: string }) {
  return (
    <article className="rounded-3xl border border-line bg-panel p-6">
      <h2 className="font-serif text-3xl text-gold-soft">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{copy}</p>
    </article>
  );
}

function FeaturedSkeleton() {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => (
    <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-panel" />
  ))}</div>;
}
