import { InstrumentImage } from "./instrument-image";
import { productPhotography } from "@/src/lib/catalog-photography";
import Link from "next/link";
import { formatPrice, instrumentTitle } from "@/src/lib/format";
import type { Product } from "@/src/types";
import { ScoreBadge, VerificationBadge } from "./verification-badge";
import { Icon } from "./ui/icon";

export function ProductCard({ product }: { product: Product }) {
  const title = instrumentTitle(product);
  const photography = productPhotography(product);
  const image = photography.images[0];
  return <Link href={`/products/${product.id}`} className="product-card">
    <div className="product-card-image"><InstrumentImage src={image ?? null} alt={title} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" reference={photography.reference} />
      <span className="absolute bottom-3 left-3 bg-background/95 px-2 py-1 text-[10px] text-muted">{product.year ?? "Undated"}</span>
      {product.status === "sold" || product.stock < 1 ? <span className="absolute right-3 top-3 bg-background px-3 py-1.5 text-[10px] text-muted">Sold out</span> : null}
    </div>
    <div className="product-card-copy"><div className="flex items-start justify-between gap-3"><h3>{title}</h3><Icon name="arrow" size={14} className="mt-1 text-muted" /></div><p className="product-card-meta">{product.finish ?? "Finish undocumented"}</p>{photography.reference ? <p className="mt-1 text-[10px] text-muted">Model reference photo</p> : null}<p className="product-card-price">{formatPrice(product.price)}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><VerificationBadge status={product.verification_status} /><ScoreBadge score={product.tonevault_score} /></div></div>
  </Link>;
}
