"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { fetchCatalogSuggestions, SEARCH_DEBOUNCE_MS, type CatalogSuggestion } from "@/src/lib/catalog-search";

type Result = { key: string; suggestions: CatalogSuggestion[]; error?: boolean };
const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

/** Editable list-autocomplete. DOM focus stays on the input; submission remains the parent's form. */
export function CatalogSearch({ label, defaultValue = "", className, status = "available", onPick, onFocus }: {
  label: string; defaultValue?: string; className?: string; status?: "available" | "sold";
  onPick: (suggestion: CatalogSuggestion) => void; onFocus?: () => void;
}) {
  const id = useId();
  const ready = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const root = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [active, setActive] = useState(-1);
  const [result, setResult] = useState<Result | null>(null);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const key = JSON.stringify([query.trim(), status]);
  const expanded = open && query.trim().length >= 2 && !composing;
  const current = result?.key === key ? result : null;
  const options = current?.suggestions ?? [];
  const loading = !current;
  const optionId = (index: number) => `${id}-option-${index}`;

  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetchCatalogSuggestions(query, controller.signal, status).then(
        suggestions => { if (!controller.signal.aborted) { setResult({ key, suggestions }); setActive(-1); } },
        () => { if (!controller.signal.aborted) { setResult({ key, suggestions: [], error: true }); setActive(-1); } },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [expanded, key, query, status]);

  useEffect(() => {
    if (!expanded) return;
    function place() {
      if (!root.current || !popup.current) return;
      const anchor = root.current.getBoundingClientRect();
      const view = window.visualViewport;
      const top = view?.offsetTop ?? 0;
      const bottom = top + (view?.height ?? innerHeight);
      const below = bottom - anchor.bottom - 12;
      const above = anchor.top - top - 12;
      const up = below < 160 && above > below;
      const width = Math.min(Math.max(anchor.width, 300), innerWidth - 32);
      Object.assign(popup.current.style, {
        width: `${width}px`, left: `${Math.max(16, Math.min(anchor.left, innerWidth - width - 16))}px`,
        top: `${up ? anchor.top - 6 : anchor.bottom + 6}px`,
        maxHeight: `${Math.max(40, Math.min(320, up ? above : below))}px`,
      });
      popup.current.dataset.side = up ? "top" : "bottom";
    }
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target) && !popup.current?.contains(event.target)) { setOpen(false); setActive(-1); }
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true);
      window.visualViewport?.removeEventListener("resize", place); window.visualViewport?.removeEventListener("scroll", place);
      document.removeEventListener("pointerdown", outside);
    };
  }, [expanded, portal]);

  useEffect(() => {
    if (!expanded || active < 0 || !list.current) return;
    const row = document.getElementById(`${id}-option-${active}`);
    if (!row) return;
    const item = row.getBoundingClientRect(), box = list.current.getBoundingClientRect();
    if (item.top < box.top) list.current.scrollTop += item.top - box.top;
    else if (item.bottom > box.bottom) list.current.scrollTop += item.bottom - box.bottom;
  }, [active, expanded, id]);

  function choose(suggestion: CatalogSuggestion) { setOpen(false); setActive(-1); onPick(suggestion); }
  const message = loading ? "Looking for instruments…" : current?.error ? "Suggestions unavailable. You can still submit your search." : options.length ? `${options.length} suggestions available.` : "No suggestions. You can still submit your search.";
  return <div ref={root} className="catalog-search" onBlur={event => {
    if (!(event.relatedTarget instanceof Node) || (!event.currentTarget.contains(event.relatedTarget) && !popup.current?.contains(event.relatedTarget))) { setOpen(false); setActive(-1); }
  }}>
    <input name="query" role="combobox" aria-label={label} aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={expanded}
      aria-controls={portal ? `${id}-list` : undefined} aria-activedescendant={expanded && options[active] ? optionId(active) : undefined}
      aria-describedby={`${id}-hint`} autoComplete="off" maxLength={240} className={className} disabled={!ready}
      placeholder="Brand, model or finish" value={query}
      onFocus={event => { setPortal(event.currentTarget.closest("dialog") ?? document.body); setOpen(true); setResult(null); onFocus?.(); }}
      onClick={() => { if (!open) setResult(null); setOpen(true); setActive(-1); }}
      onChange={event => { setQuery(event.target.value); setResult(null); setActive(-1); setOpen(true); }}
      onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)}
      onKeyDown={event => {
        if (event.nativeEvent.isComposing) return;
        if ((event.key === "ArrowDown" || event.key === "ArrowUp") && query.trim().length >= 2) {
          event.preventDefault(); setOpen(true);
          if (options.length) setActive(index => event.key === "ArrowDown" ? (index + 1) % options.length : (index <= 0 ? options.length : index) - 1);
        } else if (expanded && ["Home", "End"].includes(event.key) && active >= 0) {
          event.preventDefault(); setActive(event.key === "Home" ? 0 : options.length - 1);
        } else if (event.key === "Enter" && expanded && options[active]) {
          event.preventDefault(); choose(options[active]);
        } else if (event.key === "Enter") {
          setOpen(false); setActive(-1);
        } else if (event.key === "Escape" && expanded) {
          event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1);
        }
      }} />
    <span id={`${id}-hint`} className="sr-only">Type at least two characters for suggestions. Use arrow keys to choose, Enter to select, or submit your own search.</span>
    {portal ? createPortal(<div ref={popup} className="catalog-suggestions" data-open={expanded} aria-hidden={!expanded} inert={!expanded}>
      <ul ref={list} id={`${id}-list`} role="listbox" aria-label={`${label} suggestions`} aria-busy={loading}>
        {options.map((suggestion, index) => <li key={suggestion.key} id={optionId(index)} role="option" aria-label={`${suggestion.label}, ${suggestion.kind === "brand" ? "brand" : "instrument"}`} aria-selected={active === index}
          onPointerMove={() => setActive(index)} onPointerDown={event => event.preventDefault()} onClick={() => choose(suggestion)}>
          <span>{suggestion.label}</span><span className="suggestion-kind">{suggestion.kind === "brand" ? "Brand" : "Instrument"}</span>
        </li>)}
      </ul>
      <p role="status" aria-live="polite" className={options.length ? "sr-only" : "suggestion-message"}>{expanded ? message : ""}</p>
    </div>, portal) : null}
  </div>;
}
