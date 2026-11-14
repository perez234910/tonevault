"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-context";
import { Icon } from "./ui/icon";
import { ModalShell } from "./ui/modal-shell";
import { QuickCart } from "./quick-cart";

const collectionLinks = [
  { href: "/browse", label: "All instruments" },
  { href: "/browse?brand=Fender", label: "Fender" },
  { href: "/browse?brand=Gibson", label: "Gibson" },
  { href: "/browse?brand=PRS", label: "PRS" },
  { href: "/browse?status=sold", label: "Sold instruments" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const { totalQuantity, isOpen, openCart, closeCart } = useCart();
  const [target, setTarget] = useState<number | null>(null);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [kind, setKind] = useState<"cart" | "mobile">("cart");
  const [restoreFocus, setRestoreFocus] = useState(true);
  const collection = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const modalTrigger = useRef<HTMLButtonElement>(null);
  const verified = pathname === "/browse" && params.get("verificationStatus") === "Fully Verified";
  const active = verified ? 1 : pathname === "/browse" || pathname.startsWith("/products/") ? 0 : null;
  const surface = target ?? active;

  useEffect(() => {
    if (!collectionOpen) return;
    function pointer(event: PointerEvent) {
      if (event.target instanceof Node && !collection.current?.contains(event.target)) setCollectionOpen(false);
    }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") { setCollectionOpen(false); trigger.current?.focus(); }
    }
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("pointerdown", pointer); document.removeEventListener("keydown", keyboard); };
  }, [collectionOpen]);

  function dismiss() { closeCart(); setMobileOpen(false); }
  function navigate() { setRestoreFocus(false); setCollectionOpen(false); dismiss(); }
  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("query") ?? "").trim();
    navigate(); router.push(query ? `/browse?${new URLSearchParams({ query })}` : "/browse");
  }

  return <>
    <header className="site-header">
      <div className="site-header-row">
        <Link href="/" className="wordmark" aria-label="ToneVault home" onClick={navigate}>tonevault</Link>
        <form role="search" aria-label="Header catalog search" className="header-search" onSubmit={search}><Icon name="search" size={16} /><input name="query" aria-label="Find your next guitar" placeholder="Find your next guitar" /><button type="submit" aria-label="Search catalog" className="flex h-10 items-center"><Icon name="arrow" size={14} /></button></form>
        <nav aria-label="Main navigation" className="desktop-nav" onPointerLeave={(event) => { const focused = event.currentTarget.querySelector<HTMLElement>(".nav-item:focus"); setTarget(focused ? Number(focused.dataset.navIndex) : null); }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setTarget(null); }}>
          <span aria-hidden="true" data-testid="nav-hover-surface" className="nav-surface" style={{ transform: `translateX(${(surface ?? 0) * 100}%)`, opacity: surface === null ? 0 : 1 }} />
          <Link href="/browse" aria-current={active === 0 ? "page" : undefined} className="nav-item" data-nav-index="0" onPointerEnter={() => setTarget(0)} onFocus={() => setTarget(0)} onClick={navigate}>Browse</Link>
          <Link href="/browse?verificationStatus=Fully%20Verified" aria-current={verified ? "page" : undefined} className="nav-item" data-nav-index="1" onPointerEnter={() => setTarget(1)} onFocus={() => setTarget(1)} onClick={navigate}>Verified</Link>
          <div ref={collection} className="nav-dropdown-shell" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCollectionOpen(false); }}>
            <button ref={trigger} type="button" className="nav-item" data-nav-index="2" aria-expanded={collectionOpen} aria-controls="collection-popover" onPointerEnter={() => setTarget(2)} onFocus={() => setTarget(2)} onClick={() => setCollectionOpen((value) => !value)} onKeyDown={(event) => {
              if (event.key === "ArrowDown") { event.preventDefault(); setCollectionOpen(true); requestAnimationFrame(() => collection.current?.querySelector<HTMLAnchorElement>("a")?.focus()); }
            }}>Collection <Icon name="chevron" size={12} className="nav-chevron" /></button>
            <div id="collection-popover" role="region" aria-label="Collection links" className="nav-popover" data-open={collectionOpen} aria-hidden={!collectionOpen} inert={!collectionOpen}>
              {collectionLinks.map((link) => <Link key={link.href} href={link.href} onClick={navigate}>{link.label}<Icon name="arrow" size={14} /></Link>)}
            </div>
          </div>
        </nav>
        <div className="header-actions">
          <button type="button" className="cart-trigger" aria-label={`Open cart, ${totalQuantity} instruments`} aria-haspopup="dialog" aria-expanded={isOpen} onClick={(event) => { modalTrigger.current = event.currentTarget; setRestoreFocus(true); setCollectionOpen(false); setKind("cart"); setMobileOpen(false); openCart(); }}><Icon name="bag" size={19} /><span>Cart</span><span key={totalQuantity} className="cart-count ui-number" aria-live="polite" aria-atomic="true">{totalQuantity}</span></button>
          <button type="button" className="ui-icon-button mobile-menu-trigger" aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={mobileOpen} onClick={(event) => { modalTrigger.current = event.currentTarget; setRestoreFocus(true); setKind("mobile"); closeCart(); setMobileOpen(true); }}><Icon name="menu" size={19} /></button>
        </div>
      </div>
    </header>
    <ModalShell open={isOpen || mobileOpen} titleId={kind === "cart" ? "quick-cart-title" : "mobile-nav-title"} restoreFocus={restoreFocus} returnFocusRef={modalTrigger} onDismiss={dismiss}>
      {kind === "cart" ? <QuickCart onDismiss={dismiss} onNavigate={navigate} /> : <>
        <div className="drawer-heading"><h2 id="mobile-nav-title">Explore ToneVault</h2><button autoFocus type="button" className="ui-icon-button" aria-label="Close navigation" onClick={dismiss}><Icon name="close" /></button></div>
        <div className="drawer-content"><form role="search" aria-label="Mobile catalog search" className="mb-5" onSubmit={search}><label className="ui-eyebrow" htmlFor="mobile-search">Find your next guitar</label><div className="mt-3 flex gap-2"><input id="mobile-search" name="query" className="ui-control" placeholder="Brand, model or finish" /><button type="submit" className="ui-icon-button" aria-label="Search catalog"><Icon name="search" size={18} /></button></div></form>
          <nav aria-label="Mobile navigation"><Link href="/browse" className="mobile-nav-link" aria-current={active === 0 ? "page" : undefined} onClick={navigate}>Browse <Icon name="arrow" /></Link><Link href="/browse?verificationStatus=Fully%20Verified" className="mobile-nav-link" aria-current={verified ? "page" : undefined} onClick={navigate}>Verified <Icon name="arrow" /></Link><Link href="/cart" className="mobile-nav-link" aria-current={pathname === "/cart" ? "page" : undefined} onClick={navigate}>Your cart <Icon name="bag" /></Link></nav>
          <p className="ui-eyebrow mb-2 mt-10">By maker</p>{collectionLinks.slice(1,4).map((link) => <Link key={link.href} href={link.href} className="block py-3 text-sm text-muted" onClick={navigate}>{link.label}</Link>)}
        </div><div className="drawer-footer text-xs leading-6 text-muted">Pre-owned instruments. Thoughtful decisions.<br />Demo checkout; no real payment.</div>
      </>}
    </ModalShell>
  </>;
}
