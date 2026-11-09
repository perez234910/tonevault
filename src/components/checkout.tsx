"use client";

import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import dynamic from "next/dynamic";

const BuyerAccount = dynamic(() => import("@/src/components/buyer-account").then(module => module.BuyerAccount), { ssr: false });
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/src/components/cart-context";
import type { VerificationOption } from "@/src/lib/pricing/rules";
import type { CatalogPricingQuote } from "@/src/lib/pricing/catalog";
import { formatPrice } from "@/src/lib/format";

export function Checkout({ productId }: { productId: string }) {
  const { items, removeItem } = useCart();
  const router = useRouter();
  const [quote, setQuote] = useState<{ key: string; value: CatalogPricingQuote | null; error: string } | null>(null);
  const [verificationOption, setVerificationOption] = useState<VerificationOption>("none");
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const [showAccount, setShowAccount] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [selected, setSelected] = useState(productId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const item = items.find(entry => entry.id === selected) ?? items[0];

  const currentProductId = item?.id;
  const quoteKey = `${currentProductId ?? ""}:${verificationOption}`;
  const currentQuote = quote?.key === quoteKey ? quote : null;
  const pricing = currentQuote?.value?.pricing ?? null;
  const pricingError = currentQuote?.error ?? "";

  useEffect(() => {
    if (!currentProductId) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/pricing/quote", {
          method: "POST", headers: { "Content-Type": "application/json" },
          cache: "no-store", signal: controller.signal,
          body: JSON.stringify({ product_id: currentProductId, quantity: 1, verification_option: verificationOption }),
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error ?? "Unable to load order pricing.");
        if (result.data.product_id !== currentProductId || result.data.quantity !== 1 || result.data.pricing.verification_option !== verificationOption) {
          throw new Error("The pricing response did not match this selection.");
        }
        setQuote({ key: quoteKey, value: result.data, error: "" });
      } catch (cause) {
        if (!controller.signal.aborted) setQuote({ key: quoteKey, value: null, error: cause instanceof Error ? cause.message : "Unable to load order pricing." });
      }
    }
    void load();
    return () => controller.abort();
  }, [currentProductId, verificationOption, quoteKey, quoteAttempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || !pricing || submitting.current) return;
    const form = new FormData(event.currentTarget);
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({
          product_id: item.id, quantity: 1, verification_option: verificationOption,
          customer: { full_name: form.get("full_name"), email: form.get("email"), phone: form.get("phone"), address: form.get("address") },
          payment_method: form.get("payment_method"), payment_confirmed: form.get("payment_confirmed") === "on",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setError([result.error ?? "Unable to place order.", ...(result.issues ?? []).map((issue: { message: string }) => issue.message)].join(" "));
        return;
      }
      // Keep the saved order accessible even if updating browser cart storage fails.
      try { removeItem(item.id); } catch { /* Confirmation still opens for the saved order. */ }
      router.push(`/orders/${result.data.order.id}`);
    } catch {
      setError("We could not confirm the result. Check your connection before trying again; an order may have been saved.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const inputClass = "mt-2 w-full rounded-lg border border-line bg-background p-3 text-foreground";
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-widest text-gold">No account required</p>
      <h1 className="mt-2 font-serif text-4xl">Checkout</h1>
      <p className="mt-4 text-muted">This is a simulated checkout. No money is charged or held in escrow. Do not enter real payment credentials.</p>
      <button type="button" className="mt-4 text-gold underline" onClick={() => { setShowAccount(!showAccount); setSession(null); }}>{showAccount ? "Continue as guest" : "Sign in instead (optional)"}</button>
      {showAccount && <BuyerAccount onSession={setSession} />}
      {item && (pricingError ? <p role="alert">{pricingError} <button type="button" className="text-gold underline" onClick={() => { setQuote(null); setQuoteAttempt(count => count + 1); }}>Retry quote</button></p> : !pricing ? <p role="status">Loading order pricing…</p> : null)}
      {!item ? <p className="mt-8">Your cart is empty. <Link className="text-gold underline" href="/browse">Browse instruments</Link></p> : (
        <form onSubmit={submit} className="mt-8 space-y-6">
          <fieldset disabled={busy} className="space-y-6 disabled:opacity-60">
            <legend className="font-serif text-2xl">Your instrument</legend>
            <p className="text-sm text-muted">Check out one instrument at a time. Other items stay in your cart.</p>
            <label className="block">Instrument
              <select className={inputClass} value={item.id} onChange={event => { setSelected(event.target.value); setQuote(null); }}>
                {items.map(entry => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
              </select>
            </label>
            <p>Quantity: 1</p>
            <label className="block">Verification service
              <select className={inputClass} value={verificationOption} onChange={event => { setVerificationOption(event.target.value as VerificationOption); setQuote(null); }}>
                <option value="none">No additional verification</option>
                <option value="remote">Remote verification</option>
                <option value="physical">Physical inspection</option>
              </select>
            </label>
            {pricing && <>
              <p>Guitar subtotal: {formatPrice(pricing.subtotal_amount)}</p>
              <p>Verification fee: {formatPrice(pricing.verification_fee)}</p>
              <p>Estimated buyer total: {formatPrice(pricing.total_amount)}</p>
              <p className="text-sm text-muted">The seller pays the {pricing.commission_rate_bps / 100}% marketplace commission. It is not added to your total.</p>
            </>}
            <p className="text-sm text-muted">The server checks availability and calculates your final total.</p>
            <label className="block">Full name<input name="full_name" autoComplete="name" required minLength={2} maxLength={120} className={inputClass} /></label>
            <label className="block">Email<input name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} /></label>
            <label className="block">Phone<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} pattern="[+0-9() .\-]+" className={inputClass} /></label>
            <label className="block">Delivery address<textarea name="address" autoComplete="street-address" required minLength={10} maxLength={500} className={inputClass} /></label>
            <label className="block">Simulated payment method
              <select name="payment_method" className={inputClass} defaultValue="simulated_card">
                <option value="simulated_card">Demo card payment</option><option value="simulated_gcash">Demo GCash payment</option>
              </select>
            </label>
            <label className="flex items-start gap-3"><input name="payment_confirmed" type="checkbox" required className="mt-1" /><span>I understand this is a simulation and no payment will be taken.</span></label>
            <button type="submit" disabled={busy || !pricing} className="w-full rounded-full bg-gold px-6 py-3 font-medium text-background">{busy ? "Saving order…" : "Place simulated order"}</button>
          </fieldset>
          {error && <p role="alert" className="rounded-lg border border-line p-4">{error}</p>}
        </form>
      )}
    </section>
  );
}
