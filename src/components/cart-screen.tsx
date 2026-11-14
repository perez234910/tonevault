"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { useCart } from "./cart-context";
import { lineSubtotal, type CartItem } from "@/src/lib/cart";
import { formatPrice } from "@/src/lib/format";
import { finishExit } from "@/src/lib/ui-motion";
import { Icon } from "./ui/icon";

function QuantityControl({ item, update }: { item: CartItem; update: (id: string, value: number) => void }) {
  const inputId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");
  const max = item.stock ?? 1;
  function commit() {
    if (draft === null) return;
    const value = Number(draft);
    if (!Number.isSafeInteger(value) || value < 1 || value > max) {
      setError(`Enter a whole number from 1 to ${max}.`);
    } else {
      update(item.id, value);
      setError("");
    }
    setDraft(null);
  }
  function step(value: number) {
    update(item.id, value); setDraft(null); setError("");
  }
  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-xs text-muted">Quantity</label>
      <div className="cart-quantity">
        <button type="button" aria-label={`Decrease quantity for ${item.title}`} disabled={item.quantity <= 1} onClick={() => step(item.quantity - 1)} className="text-foreground disabled:opacity-40">−</button>
        <input id={inputId} aria-label={`Quantity for ${item.title}`} type="number" inputMode="numeric" min={1} max={max} step={1}
          value={draft ?? item.quantity} aria-invalid={Boolean(error)} aria-describedby={`${inputId}-message`}
          onChange={(event) => { setDraft(event.target.value); setError(""); }} onBlur={commit}
          onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { setDraft(null); setError(""); } }}
          className="bg-transparent text-center text-sm text-foreground" />
        <button type="button" aria-label={`Increase quantity for ${item.title}`} disabled={item.quantity >= max} onClick={() => step(item.quantity + 1)} className="text-foreground disabled:opacity-40">+</button>
      </div>
      <p id={`${inputId}-message`} role={error ? "alert" : undefined} className="mt-2 text-xs leading-5 text-muted">
        {error || (item.stock === null ? "Availability needs checking; quantity limited to one." : `Last known stock limit: ${max}.`)}
      </p>
    </div>
  );
}

export function CartScreen() {
  const { items, hydrated, setQuantity, removeItem, clearCart, subtotal, totalQuantity } = useCart();
  const [notice, setNotice] = useState("");
  return (
    <div data-cart-screen className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <p className="ui-eyebrow">Your selection</p>
      <h1 className="mt-3 text-4xl text-foreground sm:text-5xl">Your cart</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Saved on this device. Adding to your cart does not reserve an instrument.</p>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-gold-soft">{notice}</p>
      {!hydrated ? <p role="status" className="mt-8 animate-pulse rounded-sm border border-line bg-panel p-8 text-muted">Loading your saved cart…</p> : items.length === 0 ? (
        <section className="ui-reveal mt-8 border-y border-line py-14 text-center sm:py-20">
          <Icon name="bag" size={30} className="mx-auto mb-6 text-accent" /><h2 className="text-3xl text-foreground">Your cart is empty</h2>
          <p className="mt-3 text-sm text-muted">Find an instrument you would like to take a closer look at.</p>
          <Link href="/browse" className="ui-button ui-button--primary mt-7">Continue shopping</Link>
        </section>
      ) : (
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_20rem]">
          <section aria-label="Cart instruments" className="min-w-0">
            <ul className="divide-y divide-line border-y border-line">
              {items.map((item) => (
                <li key={item.id} className="ui-cart-row grid grid-cols-[5rem_minmax(0,1fr)] gap-x-5 gap-y-5 py-7 sm:grid-cols-[7rem_minmax(0,1fr)]">
                  <Link href={`/products/${encodeURIComponent(item.id)}`} className="relative aspect-[4/5] self-start overflow-hidden rounded-sm bg-panel-2">
                    {item.image ? <Image src={item.image} alt={item.title} fill sizes="112px" className="object-cover" /> : <span className="flex h-full items-center justify-center p-2 text-center text-xs text-muted">No photo</span>}
                  </Link>
                  <div className="min-w-0">
                    <Link href={`/products/${encodeURIComponent(item.id)}`} className="text-lg font-medium leading-tight text-foreground hover:text-accent sm:text-xl">{item.title}</Link>
                    <p className="mt-1 text-sm text-muted">{item.finish ?? "Finish not recorded"}</p>
                    <p className="mt-2 text-sm text-foreground">{formatPrice(item.price)} <span className="text-muted">each</span></p>
                  </div>
                  <div className="col-span-2 flex flex-wrap items-start justify-between gap-4 sm:col-start-2 sm:col-span-1">
                    <QuantityControl item={item} update={setQuantity} />
                    <div className="text-right">
                      <p className="text-xs text-muted">Item subtotal</p>
                      <p className="mt-1 text-base text-foreground"><span key={lineSubtotal(item)} className="ui-number">{formatPrice(lineSubtotal(item))}</span></p>
                      <button type="button" aria-label={`Remove ${item.title}`} onClick={(event) => {
                        const row = event.currentTarget.closest("li");
                        const screen = event.currentTarget.closest("[data-cart-screen]");
                        void finishExit(row, () => { removeItem(item.id); setNotice(`${item.title} removed from your cart.`); requestAnimationFrame(() => screen?.querySelector<HTMLAnchorElement>('a[href="/browse"]')?.focus({ preventScroll: true })); });
                      }} className="mt-3 rounded px-1 py-1 text-sm text-muted underline decoration-line underline-offset-4 hover:text-gold-soft">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm">
              <Link href="/browse" className="rounded text-gold-soft underline underline-offset-4">Continue shopping</Link>
              <button type="button" onClick={(event) => { const list = event.currentTarget.closest("section")?.querySelector("ul") ?? null; void finishExit(list, () => { clearCart(); setNotice("Your cart has been cleared."); }); }} className="rounded px-2 py-2 text-muted underline underline-offset-4">Clear cart</button>
            </div>
          </section>
          <aside aria-label="Cart summary" className="cart-summary lg:sticky lg:top-28">
            <h2 className="text-2xl text-foreground">Selection summary</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted">Instruments</dt><dd><span key={totalQuantity} className="ui-number">{totalQuantity}</span></dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Subtotal</dt><dd><span key={subtotal} className="ui-number">{formatPrice(subtotal)}</span></dd></div>
              <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-4 text-base"><dt>Total preview</dt><dd className="text-accent"><span key={subtotal} className="ui-number">{formatPrice(subtotal)}</span></dd></div>
            </dl>
            <p className="mt-4 text-xs leading-6 text-muted">Prices and availability must be confirmed at checkout. Nothing has been reserved.</p>
            <button type="button" disabled aria-describedby="cart-checkout-note" className="ui-button mt-6 w-full">Checkout unavailable</button>
            <p id="cart-checkout-note" className="mt-3 text-xs leading-6 text-muted">Checkout is not available yet. Your selection stays saved on this device; no payment is taken or order saved.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
