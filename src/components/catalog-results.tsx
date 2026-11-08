"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/src/components/product-card";
import { buildProductsUrl, fetchProducts } from "@/src/lib/catalog-client";

type CatalogState = {
  key: string;
  result?: Awaited<ReturnType<typeof fetchProducts>>;
  error?: string;
};

export function CatalogResults() {
  const searchParams = useSearchParams();
  const url = buildProductsUrl(new URLSearchParams(searchParams.toString()));
  const [attempt, setAttempt] = useState(0);
  const key = `${url}#${attempt}`;
  const [state, setState] = useState<CatalogState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(url, controller.signal).then(
      (result) => { if (!controller.signal.aborted) setState({ key, result }); },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ key, error: error instanceof Error ? error.message : "Unable to load the catalog. Please try again." });
      },
    );
    return () => controller.abort();
  }, [key, url]);

  if (state?.key !== key) {
    return (
      <div role="status" aria-live="polite" aria-busy="true">
        <p className="mb-4 text-sm text-muted">Loading instruments…</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-panel" />)}
        </div>
      </div>
    );
  }

  if (state.error || !state.result) {
    return (
      <div role="alert" className="rounded-2xl border border-line bg-panel p-6 text-sm text-muted">
        <p>{state.error ?? "Unable to load the catalog."}</p>
        <button type="button" onClick={() => setAttempt((current) => current + 1)} className="mt-4 rounded-full border border-gold px-5 py-2 text-gold-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
          Retry catalog
        </button>
      </div>
    );
  }

  if (state.result.products.length === 0) {
    return (
      <p role="status" className="rounded-2xl border border-line bg-panel p-8 text-center text-muted">
        No instruments match these filters.
      </p>
    );
  }

  return (
    <div>
      <p role="status" className="mb-4 text-sm text-muted">{state.result.count} instruments</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {state.result.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
