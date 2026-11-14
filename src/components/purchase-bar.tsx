"use client";

import { useState, useTransition } from "react";
import { Icon } from "./ui/icon";
import { useRouter } from "next/navigation";
import { useCart } from "@/src/components/cart-context";
import { formatPrice, instrumentTitle } from "@/src/lib/format";
import { productPhotography } from "@/src/lib/catalog-photography";
import type { Product } from "@/src/types";

export function PurchaseBar({ product }: { product: Product }) {
  const { addItem, items, closeCart } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const sold = product.status !== "available" || product.stock < 1;
  const inCart = items.some((item) => item.id === product.id);
  const atLimit = (items.find((item) => item.id === product.id)?.quantity ?? 0) >= product.stock;
  const title = instrumentTitle(product);

  function cartPayload() {
    return {
      id: product.id,
      title,
      price: product.price,
      image: productPhotography(product).images[0] ?? null,
      finish: product.finish,
      stock: product.stock,
      status: product.status,
    };
  }

  function addToCart() {
    if (sold) return;
    if (addItem(cartPayload())) {
      setNotice("Added to your cart.");
    }
  }

  function buyNow() {
    if (sold) return;
    // An existing selection should not gain another unit just to open the cart.
    if (inCart || addItem(cartPayload())) {
      closeCart();
      startTransition(() => router.push("/cart"));
    }
  }

  return (
    <div className="purchase-bar">
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mt-1 text-3xl tracking-[-.04em] text-foreground">{formatPrice(product.price)}</p>
          </div>
          <p className="text-xs text-muted">{sold ? "No longer available" : "Simulated checkout · no real payment"}</p>
        </div>
        <div className="purchase-actions">
          <button
            type="button"
            disabled={sold || pending}
            aria-busy={pending}
            onClick={buyNow}
            aria-describedby="purchase-preview-note"
            className="ui-button ui-button--primary w-full"
          >
            {pending ? "Opening cart…" : "Buy now"} <Icon name="arrow" size={16} />
          </button>
          <button
            type="button"
            disabled={sold || atLimit}
            onClick={addToCart}
            className="ui-button w-full"
          >
            {sold ? "Sold out" : atLimit ? "In cart · stock limit" : inCart ? "Add another" : "Add to cart"}
          </button>
        </div>
        <p id="purchase-preview-note" className="text-xs leading-5 text-muted">
          {sold ? "This instrument is sold out and cannot be added." : "Buy now opens your cart for review. Checkout is not available yet; cart prices are a preview and stock is not reserved."}
        </p>
        <p role="status" aria-live="polite" className="min-h-5 text-xs leading-5 text-accent">{notice ? <span key={notice + items.length} className="ui-reveal inline-flex items-start gap-2"><Icon name="check" size={14} />{notice}</span> : null}</p>
      </div>
    </div>
  );
}
