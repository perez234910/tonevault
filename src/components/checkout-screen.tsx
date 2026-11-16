"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import type { CatalogPricingQuote } from "@/src/lib/pricing/catalog";
import type { VerificationOption } from "@/src/lib/pricing/rules";
import { StoreSelect } from "./ui/select";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "./cart-context";
import { InstrumentImage } from "./instrument-image";
import { cartPhotograph, isModelReference } from "@/src/lib/catalog-photography";
import { formatPrice } from "@/src/lib/format";
import { validateCheckoutStep, type CheckoutDraft, type CheckoutErrors } from "@/src/lib/checkout-validation";

const BuyerAccount = dynamic(() => import("./buyer-account").then(module => module.BuyerAccount), { ssr: false });
const verificationOptions = [
  { value: "none", label: "No additional verification" },
  { value: "remote", label: "Remote verification" },
  { value: "physical", label: "Physical inspection" },
];
const issueFields: Record<string, readonly [keyof CheckoutDraft, number]> = {
  "customer.full_name": ["fullName", 0], "customer.email": ["email", 0],
  "customer.phone": ["phone", 0], "customer.address": ["street", 1],
  payment_method: ["payment", 2], payment_confirmed: ["paymentConfirmed", 2],
};

const quoteUnavailable = "Unable to load pricing. Please try again.";

const steps = ["Contact", "Shipping", "Payment", "Review"];
const initialDraft: CheckoutDraft = { email: "", fullName: "", street: "", city: "", postalCode: "", payment: "", phone: "", paymentConfirmed: false };

export function CheckoutScreen({ initialProductId }: { initialProductId: string }) {
  const { items, hydrated, removePurchasedQuantity } = useCart();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(initialProductId);
  const [verification, setVerification] = useState<VerificationOption>("none");
  const [showAccount, setShowAccount] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [submissionError, setSubmissionError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [revision, refreshQuote] = useState(0);
  const [accountPending, setAccountPending] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const [quote, setQuote] = useState<{ key: string; value?: CatalogPricingQuote; error?: string } | null>(null);
  const item = items.find(entry => entry.id === selectedId) ?? items[0];
  const productId = item?.id;
  const quantity = item?.quantity;
  const quoteKey = JSON.stringify([productId, quantity, verification, revision]);
  const currentQuote = quote?.key === quoteKey ? quote : null;
  const pricing = currentQuote?.value?.pricing;
  useEffect(() => {
    if (!productId || !quantity) return;
    const controller = new AbortController();
    async function loadQuote() {
      try {
        const response = await fetch("/api/pricing/quote", {
          method: "POST", signal: controller.signal, cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId, quantity, verification_option: verification }),
        });
        if (!response.ok) {
          const error = response.status === 409 ? "This instrument is no longer available in the requested quantity."
            : response.status === 404 ? "This instrument is no longer available."
            : quoteUnavailable;
          if (!controller.signal.aborted) setQuote({ key: quoteKey, error });
          return;
        }
        const result = await response.json();
        if (!result?.ok || result.data?.product_id !== productId || result.data?.quantity !== quantity || result.data?.pricing?.verification_option !== verification) {
          throw new Error(quoteUnavailable);
        }
        if (!controller.signal.aborted) setQuote({ key: quoteKey, value: result.data });
      } catch {
        if (!controller.signal.aborted) setQuote({ key: quoteKey, error: quoteUnavailable });
      }
    }
    void loadQuote();
    return () => controller.abort();
  }, [productId, quantity, verification, quoteKey]);

  const receiveSession = useCallback((next: Session | null) => {
    setSession(next);
    setAccountPending(false);
  }, []);

  async function placeOrder() {
    if (!item || !pricing || accountPending || (showAccount && !session) || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setSubmissionError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({
          product_id: item.id, quantity: item.quantity, verification_option: verification,
          expected_total_amount: pricing.total_amount,
          customer: { full_name: draft.fullName, email: draft.email, phone: draft.phone, address: [draft.street, draft.city, draft.postalCode, "Philippines"].map(part => part.trim()).join(", ") },
          payment_method: draft.payment, payment_confirmed: draft.paymentConfirmed,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        const fieldErrors: CheckoutErrors = {};
        let first: readonly [keyof CheckoutDraft, number] | undefined;
        for (const issue of result.issues ?? []) {
          const field = issueFields[issue.path];
          if (field) {
            fieldErrors[field[0]] = issue.message;
            if (!first || field[1] < first[1]) first = field;
          }
        }
        if (first) {
          setStep(first[1]);
          setErrors(fieldErrors);
          focusField(first[0]);
        }
        if (response.status === 409) refreshQuote(count => count + 1);
        setSubmissionError(result.error ?? "Unable to place order.");
        return;
      }
      // Keep any units added while this order was saving.
      removePurchasedQuantity(item.id, item.quantity);
      router.push(`/confirmation/${encodeURIComponent(result.data.order.id)}`);
    } catch {
      setSubmissionError("We could not verify the result. An order may have been saved. Check your connection before retrying.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  function focusField(field: keyof CheckoutDraft) {
    requestAnimationFrame(() => document.getElementById(`checkout-${field}`)?.focus());
  }
  function changeStep(next: number) { setErrors({}); setStep(next); requestAnimationFrame(() => heading.current?.focus({preventScroll:true})); }
  function next() {
    const validation = validateCheckoutStep(step, draft); setErrors(validation);
    const first = Object.keys(validation)[0];
    if (first) { focusField(first as keyof CheckoutDraft); return; }
    changeStep(Math.min(3, step + 1));
  }
  function field(name: keyof CheckoutDraft, label: string, autoComplete: string, type = "text") {
    return <div className="checkout-field"><label htmlFor={`checkout-${name}`}>{label}</label><input id={`checkout-${name}`} type={type} autoComplete={autoComplete} value={String(draft[name])} onChange={(event) => setDraft({...draft,[name]:event.target.value})} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `error-${name}` : undefined} className="ui-control" />{errors[name] ? <p id={`error-${name}`} className="field-error">{errors[name]}</p> : null}</div>;
  }
  if (!hydrated) return <div className="page-container"><h1>Checkout</h1><p role="status" className="mt-6">Loading your selection…</p></div>;
  if (!item) return <div className="page-container"><h1>Checkout</h1><section className="empty-panel"><h2>Your selection is empty</h2><p>Add an instrument before reviewing checkout details.</p><Link href="/browse" className="ui-button ui-button--primary mt-6">Browse instruments</Link></section></div>;
  return <div className="page-container"><Link href="/cart" className="ui-link mb-7 text-muted">← Back to cart</Link><h1>A good guitar. A thoughtful next step.</h1>
    <p className="mt-3 text-sm text-muted">Simulated checkout. No money is charged or held in escrow.</p>
    <div className="checkout-grid">
      <section aria-label="Checkout details">
        <button type="button" disabled={busy} className="ui-link mb-5" onClick={() => { setShowAccount(!showAccount); setSession(null); setAccountPending(!showAccount); }}>{showAccount ? "Continue as guest" : "Sign in instead (optional)"}</button>
        {showAccount && <BuyerAccount onSession={receiveSession} />}
        <ol className="checkout-steps" aria-label="Checkout progress">{steps.map((label,index) => <li key={label}><button type="button" disabled={busy || index>step} aria-current={index===step?"step":undefined} onClick={()=>changeStep(index)}>{index+1}. {label}</button></li>)}</ol>
        <form noValidate onSubmit={(event)=>{event.preventDefault();if(step<3)next();else void placeOrder();}} className="checkout-form">
          <fieldset disabled={busy}>
          <div key={step} className="ui-reveal"><h2 ref={heading} tabIndex={-1} className="mb-7 text-xl">{["Your contact details","Where should it go?","Payment method","One last look"][step]}</h2>
            {step===0 ? <>{field("email","Email address","email","email")}{field("fullName","Full name","name")}{field("phone","Phone number","tel","tel")}</> : null}
            {step===1 ? <>{field("street","Street address","street-address")}<div className="grid gap-x-5 sm:grid-cols-2">{field("city","City","address-level2")}{field("postalCode","Postal code","postal-code")}</div><p className="text-xs text-muted">Philippines. Shipping rates and service require confirmation.</p></> : null}
            {step===2 ? <fieldset><legend className="sr-only">Simulated payment method</legend>{[["simulated_card","Card · simulated"],["simulated_gcash","GCash · simulated"]].map(([value,label])=><label key={value} className="payment-choice"><input id={value==="simulated_card"?"checkout-payment":undefined} name="payment" type="radio" value={value} checked={draft.payment===value} onChange={()=>setDraft({...draft,payment:value})} aria-describedby="payment-note payment-error" /><span>{label}</span></label>)}<p id="payment-note" className="mt-4 text-sm leading-6 text-muted">No card, bank or payment details are collected. No money is charged.</p><p id="payment-error" className="field-error">{errors.payment}</p><label className="payment-choice"><input id="checkout-paymentConfirmed" type="checkbox" checked={draft.paymentConfirmed} onChange={event=>setDraft({...draft,paymentConfirmed:event.target.checked})} aria-describedby="payment-ack-error" />I understand that no payment will be taken.</label><p id="payment-ack-error" className="field-error">{errors.paymentConfirmed}</p></fieldset> : null}
            {step===3 ? <><dl className="review-details"><div><dt>Contact</dt><dd>{draft.fullName}<br />{draft.email}<br />{draft.phone}<button type="button" onClick={()=>changeStep(0)} className="edit-link">Edit contact</button></dd></div><div><dt>Deliver to</dt><dd>{draft.street}<br />{draft.city} {draft.postalCode}<br />Philippines<button type="button" onClick={()=>changeStep(1)} className="edit-link">Edit shipping</button></dd></div><div><dt>Payment</dt><dd>{draft.payment==="simulated_card"?"Simulated card":"Simulated GCash"}<button type="button" onClick={()=>changeStep(2)} className="edit-link">Edit payment</button></dd></div></dl><StoreSelect label="Additional verification service" value={verification} options={verificationOptions} onChange={value=>setVerification(value as VerificationOption)} />
              <p className="mt-2 text-sm text-muted">Additional verification is optional and separate from the listing’s existing verification status.</p>
            </> : null}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">{step>0?<button type="button" className="ui-button" onClick={()=>changeStep(step-1)}>Back</button>:null}{step<3?<button className="ui-button ui-button--primary" type="submit">{["Add shipping details","Choose payment","Review selection"][step]}</button>:<button type="submit" className="ui-button ui-button--primary" disabled={!pricing || busy || accountPending || (showAccount && !session)}>{busy ? "Saving order…" : "Place simulated order"}</button>}</div>
          </fieldset>
          {submissionError && <p role="alert" className="field-error">{submissionError}</p>}
        </form>
      </section>
      <aside className="cart-summary checkout-summary" aria-label="Checkout summary">
        <h2 className="text-xl">Your selection</h2>
        <p className="mt-2 text-sm text-muted">Check out one cart line at a time. Other instruments stay in your cart.</p>
        {items.length > 1 && <StoreSelect label="Instrument" value={item.id} options={items.map(entry => ({ value: entry.id, label: entry.title }))} onChange={setSelectedId} disabled={busy} />}
        <div className="summary-line mt-5"><Link href={`/products/${item.id}`} className="relative aspect-square bg-white"><InstrumentImage src={cartPhotograph(item)} alt={item.title} sizes="72px" reference={isModelReference(cartPhotograph(item))} /></Link><div><p>{item.title}</p><p className="text-sm text-muted">Quantity {item.quantity}</p></div></div>
        {pricing ? <dl className="summary-totals">
          <div><dt>Guitar subtotal</dt><dd>{formatPrice(pricing.subtotal_amount)}</dd></div>
          <div>
            <dt>Verification fee</dt>
            <dd>
              {formatPrice(pricing.verification_fee)}
              {pricing.verification_option === "none" && <span className="mt-1 block text-xs text-muted">No additional verification selected.</span>}
            </dd>
          </div>
          <div><dt>Total</dt><dd>{formatPrice(pricing.total_amount)}</dd></div>
        </dl> : <p role="status" className="mt-5 text-sm">{currentQuote?.error ?? "Refreshing catalog prices and stock…"}</p>}
        {currentQuote?.error && <button type="button" className="ui-link" onClick={() => refreshQuote(count => count + 1)}>Retry quote</button>}
        <Link href="/cart" className="ui-link mt-5">Update cart</Link>
      </aside>
    </div>
  </div>;
}
