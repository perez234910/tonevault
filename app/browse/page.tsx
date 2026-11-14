import { Suspense } from "react";
import { CatalogResults } from "@/src/components/catalog-results";
import { FilterBar } from "@/src/components/filter-bar";

export const metadata = {
  title: "Browse",
};

export default function BrowsePage({ searchParams }: PageProps<"/browse">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl text-foreground sm:text-5xl">Browse the vault</h1>
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
