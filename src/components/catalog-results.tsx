import { ProductCard } from "@/src/components/product-card";
import { firstParam } from "@/src/lib/search-params";
import { getProducts } from "@/src/actions/catalog";

export async function CatalogResults({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const result = await getProducts({
    brand: firstParam(params.brand),
    minPrice: firstParam(params.minPrice),
    maxPrice: firstParam(params.maxPrice),
    verificationStatus: firstParam(params.verificationStatus),
    condition: firstParam(params.condition),
    query: firstParam(params.query),
    search: firstParam(params.search),
    status: firstParam(params.status),
    offset: firstParam(params.offset),
    limit: 24,
  });

  if (!result.ok) {
    return (
      <p className="rounded-2xl border border-line bg-panel p-6 text-sm text-muted">
        Unable to load the catalog: {result.error}
      </p>
    );
  }

  if (result.data.products.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-panel p-8 text-center text-muted">
        No instruments match these filters.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted">{result.data.count} instruments</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
