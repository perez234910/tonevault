import Link from "next/link";
import { isCatalogPreview } from "@/src/lib/catalog/preview-mode";

export function SiteFooter() {
  return <footer className="mt-auto border-t border-line"><div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex flex-wrap items-baseline gap-x-5 gap-y-3"><Link href="/" className="wordmark text-[20px]">tonevault</Link><p className="max-w-xs text-[11px] leading-6 text-muted">{isCatalogPreview() ? "Sample instrument preview. No real payments or saved orders." : "Pre-owned instruments. Demo checkout; no real payments."}</p></div><div className="flex gap-6 text-xs text-muted"><Link href="/browse">Catalog</Link><Link href="/browse?verificationStatus=Fully%20Verified">Fully Verified</Link></div></div></footer>;
}
