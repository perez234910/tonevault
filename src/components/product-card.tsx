import Image from "next/image";
import Link from "next/link";
import { formatPrice, instrumentTitle } from "@/src/lib/format";
import type { Product } from "@/src/types";
import { ScoreBadge, VerificationBadge } from "@/src/components/verification-badge";

export function ProductCard({ product }: { product: Product }) {
  const title = instrumentTitle(product);
  const image = product.images[0];

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel transition hover:border-gold/40"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-panel-2">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No image
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <VerificationBadge status={product.verification_status} />
        </div>
        {product.status === "sold" || product.stock < 1 ? (
          <div className="absolute right-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-gold-soft">
            Sold out
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{product.brand}</p>
          <h3 className="mt-1 font-serif text-2xl leading-tight text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted">{product.finish ?? "Finish undocumented"}</p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <p className="text-base font-medium text-foreground">{formatPrice(product.price)}</p>
          <ScoreBadge score={product.tonevault_score} />
        </div>
      </div>
    </Link>
  );
}
