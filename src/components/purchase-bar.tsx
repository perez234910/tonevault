"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/src/components/cart-context";
import { formatPrice, instrumentTitle } from "@/src/lib/format";
import type { Product } from "@/src/types";

export function PurchaseBar({ product }: { product: Product }) {
  const { addItem, items, closeCart } = useCart();
  const router = useRouter();
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
      image: product.images[0] ?? null,
      finish: product.finish,
      stock: product.stock,
      status: product.status,
    };
  }

  function addToCart() {
    if (sold) return;
    if (addItem(cartPayload())) {
      setNotice("Saved in your cart within available stock. Cart items are not reserved; prices and stock are checked at checkout.");
    }
  }

  function buyNow() {
    if (sold) return;
    // An existing selection should not gain another unit just to open the cart.
    if (inCart || addItem(cartPayload())) {
      closeCart();
      router.push("/cart");
    }
  }

  return (
    <div className="sticky bottom-0 z-30 border-t border-line bg-background/95 p-4 backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <div className="flex flex-col gap-3 lg:rounded-2xl lg:border lg:border-line lg:bg-panel lg:p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold">Asking price</p>
            <p className="font-serif text-3xl text-foreground">{formatPrice(product.price)}</p>
          </div>
          <p className="text-xs text-muted">{sold ? "No longer available" : "Simulated checkout · no real payment"}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={sold}
            onClick={buyNow}
            aria-describedby="purchase-preview-note"
            className="rounded-full bg-gold px-5 py-3 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy now
          </button>
          <button
            type="button"
            disabled={sold || atLimit}
            onClick={addToCart}
            className="rounded-full border border-gold/50 px-5 py-3 text-sm font-medium text-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sold ? "Sold out" : atLimit ? "In cart · stock limit" : inCart ? "Add another" : "Add to cart"}
          </button>
        </div>
        <p id="purchase-preview-note" className="text-xs leading-5 text-muted">
          {sold ? "This instrument is sold out and cannot be added." : "Buy now opens your cart for review. Checkout is not available yet; cart prices are a preview and stock is not reserved."}
        </p>
        <p role="status" aria-live="polite" className="text-xs leading-5 text-muted">{notice}</p>
      </div>
    </div>
  );
}
