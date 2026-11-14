"use client";

import Link from "next/link";
import { useCart } from "@/src/components/cart-context";
import { formatPrice } from "@/src/lib/format";

export function SiteHeader() {
  const { items, isOpen, toggleCart, closeCart, removeItem, totalQuantity, subtotal } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-2xl tracking-tight text-foreground">ToneVault</span>
          <span className="hidden text-[10px] uppercase tracking-[0.28em] text-gold sm:inline">
            Graded · Simulated checkout
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/browse" className="hover:text-foreground">
            Browse
          </Link>
          <Link href="/browse?verificationStatus=Fully%20Verified" className="hidden hover:text-foreground sm:inline">
            Verified
          </Link>
          <button
            type="button"
            onClick={toggleCart}
            className="rounded-full border border-line px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-foreground hover:border-gold"
          >
            Cart {totalQuantity}
          </button>
        </nav>
      </div>

      {isOpen ? (
        <div className="absolute right-4 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-line bg-panel p-4 shadow-2xl sm:right-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Vault cart</p>
            <button type="button" onClick={closeCart} className="text-xs text-muted hover:text-foreground">
              Close
            </button>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted">Your cart is empty. Adding an instrument does not reserve stock.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted">{item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-muted hover:text-gold"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {items.length > 0 ? (
            <p className="mt-4 border-t border-line pt-3 text-sm text-foreground">
              Total preview {formatPrice(subtotal)}
            </p>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
