"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-context";
import { InstrumentImage } from "./instrument-image";
import { cartPhotograph, isModelReference } from "@/src/lib/catalog-photography";
import { formatPrice } from "@/src/lib/format";
import { fetchProductDetail } from "@/src/lib/product-detail-client";
import { validateCheckoutStep, type CheckoutDraft, type CheckoutErrors } from "@/src/lib/checkout-validation";

const steps = ["Contact", "Shipping", "Payment", "Review"];
const initialDraft: CheckoutDraft = { email: "", fullName: "", street: "", city: "", postalCode: "", payment: "" };

export function CheckoutScreen() {
  const { items, hydrated, subtotal } = useCart();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const [quote, setQuote] = useState<{ key: string; total?: number; error?: string } | null>(null);
  const selectionKey = items.map((item) => `${item.id}:${item.quantity}`).join(",");
  useEffect(() => {
    if (!hydrated || !items.length) return;
    const controller = new AbortController();
    Promise.all(items.map(async (item) => {
      const product = await fetchProductDetail(item.id, controller.signal);
      if (product.status !== "available" || product.stock < item.quantity) throw new Error("An instrument is no longer available in this quantity. Update your cart before continuing.");
      return Math.round(product.price * 100) * item.quantity;
    })).then((amounts) => { if (!controller.signal.aborted) setQuote({key:selectionKey,total:amounts.reduce((a,b)=>a+b,0)/100}); },
      (error) => { if (!controller.signal.aborted) setQuote({key:selectionKey,error:error instanceof Error ? error.message : "Unable to refresh catalog prices. Return to your cart and try again."}); });
    return () => controller.abort();
  }, [hydrated, items, selectionKey]);

  function changeStep(next: number) { setErrors({}); setStep(next); requestAnimationFrame(() => heading.current?.focus({preventScroll:true})); }
  function next() {
    const validation = validateCheckoutStep(step, draft); setErrors(validation);
    const first = Object.keys(validation)[0];
    if (first) { requestAnimationFrame(() => document.getElementById(`checkout-${first}`)?.focus()); return; }
    changeStep(Math.min(3, step + 1));
  }
  function field(name: keyof CheckoutDraft, label: string, autoComplete: string, type = "text") {
    return <div className="checkout-field"><label htmlFor={`checkout-${name}`}>{label}</label><input id={`checkout-${name}`} type={type} autoComplete={autoComplete} value={draft[name]} onChange={(event) => setDraft({...draft,[name]:event.target.value})} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `error-${name}` : undefined} className="ui-control" />{errors[name] ? <p id={`error-${name}`} className="field-error">{errors[name]}</p> : null}</div>;
  }
  if (!hydrated) return <div className="page-container"><h1>Checkout</h1><p role="status" className="mt-6">Loading your selection…</p></div>;
  if (!items.length) return <div className="page-container"><h1>Checkout</h1><section className="empty-panel"><h2>Your selection is empty</h2><p>Add an instrument before reviewing checkout details.</p><Link href="/browse" className="ui-button ui-button--primary mt-6">Browse instruments</Link></section></div>;
  const fresh = quote?.key === selectionKey;
  return <div className="page-container"><Link href="/cart" className="ui-link mb-7 text-muted">← Back to cart</Link><h1>A good guitar. A thoughtful next step.</h1>
    <p className="mt-3 text-sm text-muted">Checkout preview. Details stay in this tab; no order or payment is submitted.</p>
    <div className="checkout-grid">
      <section aria-label="Checkout details"><ol className="checkout-steps" aria-label="Checkout progress">{steps.map((label,index) => <li key={label}><button type="button" disabled={index>step} aria-current={index===step?"step":undefined} onClick={()=>changeStep(index)}>{index+1}. {label}</button></li>)}</ol>
        <form noValidate onSubmit={(event)=>{event.preventDefault();if(step<3)next();}} className="checkout-form">
          <div key={step} className="ui-reveal"><h2 ref={heading} tabIndex={-1} className="mb-7 text-xl">{["Your contact details","Where should it go?","Payment method","One last look"][step]}</h2>
            {step===0 ? <>{field("email","Email address","email","email")}{field("fullName","Full name","name")}</> : null}
            {step===1 ? <>{field("street","Street address","street-address")}<div className="grid gap-x-5 sm:grid-cols-2">{field("city","City","address-level2")}{field("postalCode","Postal code","postal-code")}</div><p className="text-xs text-muted">Philippines. Shipping rates and service require confirmation.</p></> : null}
            {step===2 ? <fieldset><legend className="sr-only">Simulated payment method</legend>{[["demo-card","Card · simulated"],["demo-transfer","Bank transfer · simulated"]].map(([value,label])=><label key={value} className="payment-choice"><input id={value==="demo-card"?"checkout-payment":undefined} name="payment" type="radio" value={value} checked={draft.payment===value} onChange={()=>setDraft({...draft,payment:value})} aria-describedby="payment-note payment-error" /><span>{label}</span></label>)}<p id="payment-note" className="mt-4 text-sm leading-6 text-muted">No card, bank or payment details are collected. No money is charged.</p><p id="payment-error" className="field-error">{errors.payment}</p></fieldset> : null}
            {step===3 ? <><dl className="review-details"><div><dt>Contact</dt><dd>{draft.fullName}<br />{draft.email}<button type="button" onClick={()=>changeStep(0)} className="edit-link">Edit contact</button></dd></div><div><dt>Deliver to</dt><dd>{draft.street}<br />{draft.city} {draft.postalCode}<br />Philippines<button type="button" onClick={()=>changeStep(1)} className="edit-link">Edit shipping</button></dd></div><div><dt>Payment</dt><dd>{draft.payment==="demo-card"?"Simulated card":"Simulated bank transfer"}<button type="button" onClick={()=>changeStep(2)} className="edit-link">Edit payment</button></dd></div></dl><div className="integration-note"><h3 className="text-base">Ordering is not available yet</h3><p>The contact, shipping and cart-order integration is still pending. Nothing has been saved or reserved.</p></div></> : null}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">{step>0?<button type="button" className="ui-button" onClick={()=>changeStep(step-1)}>Back</button>:null}{step<3?<button className="ui-button ui-button--primary" type="submit">{["Add shipping details","Choose payment","Review selection"][step]}</button>:<button type="button" className="ui-button w-full" disabled aria-describedby="order-unavailable">Place order unavailable</button>}</div>
          {step===3?<p id="order-unavailable" className="mt-3 text-xs leading-5 text-muted">A successful server response is required before any confirmation. Use Back to cart to update your selection.</p>:null}
        </form>
      </section>
      <aside className="cart-summary checkout-summary" aria-label="Checkout summary"><h2 className="text-xl">Your selection</h2><ul className="mt-5 divide-y divide-line">{items.map(item=><li key={item.id} className="summary-line"><Link href={`/products/${item.id}`} className="relative aspect-square bg-white"><InstrumentImage src={cartPhotograph(item)} alt={item.title} sizes="72px" reference={isModelReference(cartPhotograph(item))} /></Link><div><Link href={`/products/${item.id}`} className="text-sm">{item.title}</Link><p className="mt-2 text-xs text-muted">Quantity {item.quantity}</p></div></li>)}</ul><dl className="summary-totals"><div><dt>Catalog total preview</dt><dd>{formatPrice(fresh&&quote.total!==undefined?quote.total:subtotal)}</dd></div><div><dt>Shipping / fees</dt><dd>Not calculated</dd></div></dl><p role="status" className="mt-5 text-xs leading-5 text-muted">{!fresh?"Refreshing catalog prices and stock…":quote.error||"Catalog prices and availability refreshed. Final pricing must be calculated by the order server."}</p><Link href="/cart" className="ui-link mt-5">Update cart</Link></aside>
    </div>
  </div>;
}
