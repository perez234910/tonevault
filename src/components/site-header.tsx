"use client";

import Link from "next/link";
import { useCart } from "@/src/components/cart-context";

export function SiteHeader() {
  const { totalQuantity, closeCart } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2 rounded">
          <span className="font-serif text-2xl tracking-tight text-foreground">ToneVault</span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-gold lg:inline">Graded · Simulated checkout</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-4 text-sm text-muted sm:gap-6">
          <Link href="/browse" className="rounded hover:text-foreground">Browse</Link>
          <Link href="/browse?verificationStatus=Fully%20Verified" className="hidden rounded hover:text-foreground sm:inline">Verified</Link>
          <Link href="/cart" onClick={closeCart} aria-label={`Cart, ${totalQuantity} instruments`} className="whitespace-nowrap rounded-full border border-line px-3 py-2 text-xs uppercase tracking-[0.12em] text-foreground hover:border-gold">
            Cart <span aria-live="polite" aria-atomic="true">{totalQuantity}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
