"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductGallery } from "@/src/components/product-gallery";
import { PurchaseBar } from "@/src/components/purchase-bar";
import { ScoreBadge, VerificationBadge } from "@/src/components/verification-badge";
import { instrumentTitle } from "@/src/lib/format";
import { fetchProductDetail, ProductLoadError } from "@/src/lib/product-detail-client";
import type { ProductDetail as ProductData } from "@/src/types";

function inspectionCopy(level: "none" | "remote" | "in_person") {
  if (level === "in_person") {
    return "Inspected in person by ToneVault. Serial, construction, electronics, and finish originality are on file.";
  }
  if (level === "remote") {
    return "Remote verification complete: photos, serial, and provenance packet reviewed. In-person grading not yet performed.";
  }
  return "Seller-submitted listing. ToneVault has not completed remote or in-person verification.";
}

type DetailState = { key: string; product?: ProductData; error?: string; missing?: boolean };

export function ProductDetailView({ id }: { id: string }) {
  const [attempt, setAttempt] = useState(0);
  const key = `${id}:${attempt}`;
  const [state, setState] = useState<DetailState | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchProductDetail(id, controller.signal).then(
      (product) => { if (!controller.signal.aborted) setState({ key, product }); },
      (error: unknown) => { if (!controller.signal.aborted) setState({ key, missing: error instanceof ProductLoadError && error.status === 404, error: error instanceof ProductLoadError ? error.message : "Unable to load this instrument. Check your connection and try again." }); },
    );
    return () => controller.abort();
  }, [id, key]);

  if (state?.key !== key) return (
    <div role="status" aria-busy="true" className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2">
      <span className="sr-only">Loading instrument…</span>
      <div aria-hidden="true" className="aspect-[4/5] animate-pulse rounded-3xl bg-panel" />
      <div aria-hidden="true" className="h-80 animate-pulse rounded-3xl bg-panel" />
    </div>
  );
  if (!state.product) return (
    <div className="mx-auto w-full max-w-xl px-4 py-20 text-center">
      <h1 className="font-serif text-4xl text-foreground">{state.missing ? "Instrument not found" : "Unable to load instrument"}</h1>
      <p role="alert" className="mt-4 text-sm leading-6 text-muted">{state.error}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {!state.missing ? <button type="button" onClick={() => setAttempt((current) => current + 1)} className="rounded-full bg-gold px-5 py-3 text-sm text-background">Retry instrument</button> : null}
        <Link href="/browse" className="rounded-full border border-gold/50 px-5 py-3 text-sm text-gold-soft">Return to catalog</Link>
      </div>
    </div>
  );
  const product = state.product;
  const title = instrumentTitle(product);
  const sellerSince = product.seller
    ? new Date(product.seller.created_at).getFullYear()
    : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-6">
      <ProductGallery key={product.id} images={product.images} alt={title} />

      <div className="space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">{product.brand}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-2 text-muted">{product.finish ?? "Finish not recorded"}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <VerificationBadge status={product.verification_status} />
            <ScoreBadge score={product.tonevault_score} />
          </div>
        </div>

        <PurchaseBar product={product} />

        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gold">Technical specifications</h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Spec label="Brand" value={product.brand} />
            <Spec label="Model" value={product.model} />
            <Spec label="Year" value={product.year?.toString() ?? "Undated"} />
            <Spec label="Finish" value={product.finish ?? "—"} />
            <Spec label="Status" value={product.status} />
            <Spec label="Vault ID" value={product.id.slice(0, 8)} />
          </dl>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gold">Verification documentation</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {inspectionCopy(product.inspection.inspection_level)}
          </p>
          {product.condition_notes ? (
            <p className="mt-3 text-sm leading-6 text-foreground">{product.condition_notes}</p>
          ) : null}
          <p className="mt-4 font-mono text-xs text-gold-soft">
            ToneVault Score{" "}
            {product.inspection.tonevault_score == null
              ? "pending"
              : `${product.inspection.tonevault_score} / ${product.inspection.score_scale}`}
          </p>
        </section>

        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-xs uppercase tracking-[0.2em] text-gold">Seller</h2>
          {product.seller ? (
            <div className="mt-3">
              <p className="font-serif text-2xl text-foreground">{product.seller.full_name}</p>
              <p className="mt-1 text-sm capitalize text-muted">{product.seller.role}</p>
              {sellerSince ? (
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
                  Vault member since {sellerSince}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">Seller profile is private.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</dt>
      <dd className="mt-1 capitalize text-foreground">{value}</dd>
    </div>
  );
}
