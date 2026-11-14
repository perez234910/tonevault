"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { StoreSelect } from "./ui/select";

const PRICE_RANGES = [
  { label: "Any price", value: "" },
  { label: "Under ₱250,000", value: "0-250000" },
  { label: "₱250,000 – ₱500,000", value: "250000-500000" },
  { label: "₱500,000 – ₱1,500,000", value: "500000-1500000" },
  { label: "₱1,500,000+", value: "1500000-" },
];

const CONDITIONS = [
  { label: "Any condition", value: "" },
  { label: "Original", value: "original" },
  { label: "Checking / playwear", value: "checking" },
  { label: "Documented", value: "documented" },
];

function currentPriceValue(minPrice?: string, maxPrice?: string) {
  if (!minPrice && !maxPrice) return "";
  return `${minPrice ?? ""}-${maxPrice ?? ""}`;
}

export function FilterBar({ brands }: { brands: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("offset");
    if (name === "query") params.delete("search");

    if (name === "price") {
      params.delete("minPrice");
      params.delete("maxPrice");
      if (value) {
        const [minPrice, maxPrice] = value.split("-");
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
      }
    } else if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    startTransition(() => {
      router.push(`/browse?${params.toString()}`);
    });
  }

  return <form className="store-filters" aria-label="Filter instruments" aria-busy={pending}
    onSubmit={(event) => { event.preventDefault(); update("query", String(new FormData(event.currentTarget).get("query") ?? "").trim()); }}>
    <div className="store-filter-search"><label htmlFor="catalog-search" className="sr-only">Search instruments</label>
      <input id="catalog-search" key={searchParams.get("query") ?? searchParams.get("search") ?? ""} name="query" defaultValue={searchParams.get("query") ?? searchParams.get("search") ?? ""} placeholder="Brand, model or finish" className="ui-control" />
      <button type="submit" className="ui-button" disabled={pending}>Search</button></div>
    <div className="store-filter-options">
      <StoreSelect label="Brand" value={searchParams.get("brand") ?? ""} onChange={(value) => update("brand", value)} disabled={pending} options={[{value:"",label:"All brands"},...brands.map((brand) => ({value:brand,label:brand}))]} />
      <StoreSelect label="Price" value={currentPriceValue(searchParams.get("minPrice") ?? undefined, searchParams.get("maxPrice") ?? undefined)} onChange={(value) => update("price", value)} disabled={pending} options={PRICE_RANGES} />
      <StoreSelect label="Verification" value={searchParams.get("verificationStatus") ?? ""} onChange={(value) => update("verificationStatus", value)} disabled={pending} options={[{value:"",label:"All verification"},...['Fully Verified','Remote Verified','Unverified'].map((value) => ({value,label:value}))]} />
      <StoreSelect label="Condition" value={searchParams.get("condition") ?? ""} onChange={(value) => update("condition", value)} disabled={pending} options={CONDITIONS} />
      <StoreSelect label="Availability" value={searchParams.get("status") ?? "available"} onChange={(value) => update("status", value)} disabled={pending} options={[{value:"available",label:"Available"},{value:"sold",label:"Sold out"}]} />
    </div>
    {pending ? <span role="status" className="sr-only">Updating instruments…</span> : null}
  </form>;
}
