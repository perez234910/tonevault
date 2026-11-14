import { Suspense } from "react";
import { CatalogResults } from "@/src/components/catalog-results";
import { FilterBar } from "@/src/components/filter-bar";

export const metadata = {
  title: "Browse",
};

export default function BrowsePage({ searchParams }: PageProps<"/browse">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="ui-eyebrow">Catalog</p>
      <h1 className="mt-3 text-4xl text-foreground sm:text-5xl">Browse the vault</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Filter by house, price, verification grade, and condition language drawn from each instrument file.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-28 animate-pulse rounded-sm bg-panel" />}>
          <FilterBar brands={["Fender", "Gibson", "PRS"]} />
        </Suspense>
      </div>
      <div className="mt-8">
        <Suspense fallback={<GridSkeleton />}>
          <CatalogResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div role="status" aria-label="Loading instruments" aria-busy="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="aspect-[4/5] animate-pulse bg-panel" />
      ))}
    </div>
  );
}
