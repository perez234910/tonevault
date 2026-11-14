"use client";

import { InstrumentImage } from "./instrument-image";
import { cartPhotograph, isModelReference } from "@/src/lib/catalog-photography";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart-context";
import { Icon } from "./ui/icon";
import { formatPrice } from "@/src/lib/format";
import { lineSubtotal } from "@/src/lib/cart";
import { finishExit } from "@/src/lib/ui-motion";

export function QuickCart({ onDismiss, onNavigate }: { onDismiss: () => void; onNavigate: () => void }) {
  const { items, setQuantity, removeItem, subtotal, totalQuantity } = useCart();
  const [notice, setNotice] = useState("");
  return <>
    <div className="drawer-heading"><div><h2 id="quick-cart-title">Your cart <span className="text-sm text-muted">({totalQuantity})</span></h2></div><button autoFocus type="button" className="ui-icon-button" aria-label="Close cart preview" onClick={onDismiss}><Icon name="close" /></button></div>
    <div className="drawer-content">
      <p role="status" className="min-h-5 text-xs leading-5 text-accent">{notice}</p>
      {items.length ? <ul>{items.map((item) => <li key={item.id} className="drawer-line">
        <Link href={`/products/${encodeURIComponent(item.id)}`} onClick={onNavigate} className="relative aspect-[4/5] self-start bg-panel-2"><InstrumentImage src={cartPhotograph(item)} alt={item.title} sizes="76px" reference={isModelReference(cartPhotograph(item))} /></Link>
        <div className="min-w-0"><h3><Link href={`/products/${encodeURIComponent(item.id)}`} onClick={onNavigate}>{item.title}</Link></h3><p className="mt-1 text-xs text-muted">{item.finish}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="cart-quantity">
            <button type="button" aria-label={`Decrease quantity for ${item.title} in quick cart`} disabled={item.quantity <= 1} onClick={() => setQuantity(item.id, item.quantity - 1)}>−</button>
            <span key={item.quantity} className="ui-number w-8 text-center text-xs">{item.quantity}</span>
            <button type="button" aria-label={`Increase quantity for ${item.title} in quick cart`} disabled={item.quantity >= (item.stock ?? 1)} onClick={() => setQuantity(item.id, item.quantity + 1)}>+</button>
          </div><span key={lineSubtotal(item)} className="ui-number text-sm">{formatPrice(lineSubtotal(item))}</span></div>
          <button type="button" aria-label={`Remove ${item.title} from quick cart`} className="mt-3 text-xs text-muted underline underline-offset-4" onClick={(event) => {
            const node = event.currentTarget.closest("li");
            const close = event.currentTarget.closest("dialog")?.querySelector<HTMLButtonElement>('button[aria-label="Close cart preview"]');
            void finishExit(node, () => { removeItem(item.id); setNotice(`${item.title} removed.`); close?.focus({ preventScroll: true }); });
          }}>Remove</button>
        </div>
      </li>)}</ul> : <div className="ui-reveal py-16 text-center"><Icon name="bag" size={30} className="mx-auto mb-5 text-accent" /><h3 className="text-2xl">Your cart is empty</h3><p className="mt-3 text-sm text-muted">A little closer to your next guitar.</p><Link href="/browse" onClick={onNavigate} className="ui-link mt-6">Continue shopping <Icon name="arrow" size={16} /></Link></div>}
    </div>
    <div className="drawer-footer"><div className="mb-4 flex items-center justify-between gap-4 text-sm"><span>Total preview</span><span key={subtotal} className="ui-number text-lg">{formatPrice(subtotal)}</span></div><Link href="/cart" onClick={onNavigate} className="ui-button ui-button--primary w-full">Review cart <Icon name="arrow" size={16} /></Link><p className="mt-3 text-xs leading-5 text-muted">No reservation or payment. Checkout is not available yet.</p></div>
  </>;
}
