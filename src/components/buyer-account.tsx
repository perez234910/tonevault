"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

export function BuyerAccount({ onSession }: { onSession: (session: Session | null) => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) { setSession(next); onSession(next); setReady(true); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [onSession]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const credentials = { email: String(form.get("email")), password: String(form.get("password")) };
      const result = signup
        ? await supabase.auth.signUp({ ...credentials, options: { data: { full_name: String(form.get("full_name")) } } })
        : await supabase.auth.signInWithPassword(credentials);
      if (result.error) { setMessage(result.error.message); return; }
      if (signup && !result.data.session) setMessage("Check your email to confirm your account, then sign in here.");
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally { setBusy(false); }
  }
  if (!ready) return <p role="status" className="mt-6">Checking your account…</p>;
  if (session) return <p className="mt-6 text-sm text-muted">Signed in as {session.user.email}</p>;
  const fieldClass = "mt-2 w-full rounded-lg border border-line bg-background p-3";
  return <form onSubmit={authenticate} className="my-6 space-y-4 rounded-2xl border border-line p-6">
    <h2 className="font-serif text-2xl">{signup ? "Create buyer account" : "Sign in to your account"}</h2>
    <fieldset disabled={busy} className="space-y-4">
      {signup && <label className="block">Account name<input name="full_name" autoComplete="name" required minLength={2} maxLength={120} className={fieldClass} /></label>}
      <label className="block">Account email<input name="email" type="email" autoComplete="email" required maxLength={254} className={fieldClass} /></label>
      <label className="block">Password<input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : 1} maxLength={128} className={fieldClass} /></label>
      <button className="rounded-full bg-gold px-6 py-3 text-background" type="submit">{busy ? "Connecting…" : signup ? "Create account" : "Sign in"}</button>
      <button className="block text-gold underline" type="button" onClick={() => { setSignup(!signup); setMessage(""); }}>{signup ? "Already have an account? Sign in" : "New buyer? Create an account"}</button>
    </fieldset>
    {message && <p role="status">{message}</p>}
  </form>;
}
