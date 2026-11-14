"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

/** Native modal semantics give inert background, Escape and focus containment. */
export function ModalShell({ open, titleId, restoreFocus = true, returnFocusRef, onDismiss, children }: {
  open: boolean; titleId: string; restoreFocus?: boolean; returnFocusRef?: RefObject<HTMLElement | null>; onDismiss: () => void; children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const originalOverflow = useRef<string | null>(null);
  const originalBodyOverflow = useRef<string | null>(null);
  const desiredOpen = useRef(false);

  useEffect(() => {
    const node = dialog.current;
    const surface = panel.current;
    if (!node || !surface) return;
    desiredOpen.current = open;
    const unlock = () => {
      if (originalOverflow.current !== null) {
        document.documentElement.style.overflow = originalOverflow.current;
        originalOverflow.current = null;
      }
      if (originalBodyOverflow.current !== null) {
        document.body.style.overflow = originalBodyOverflow.current;
        originalBodyOverflow.current = null;
      }
    };
    if (open) {
      node.dataset.state = "open";
      if (!node.open) {
        trigger.current = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
        originalOverflow.current = document.documentElement.style.overflow;
        originalBodyOverflow.current = document.body.style.overflow;
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        node.showModal();
      }
    } else if (node.open) {
      node.dataset.state = "closing";
      const done = () => {
        if (desiredOpen.current) return;
        node.close(); unlock();
        if (restoreFocus) requestAnimationFrame(() => { if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true }); });
      };
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) done();
      else void Promise.allSettled(surface.getAnimations().map((animation) => animation.finished)).then(done);
    }
  }, [open, restoreFocus, returnFocusRef]);

  useEffect(() => () => {
    if (originalOverflow.current !== null) {
      document.documentElement.style.overflow = originalOverflow.current;
      originalOverflow.current = null;
    }
    if (originalBodyOverflow.current !== null) {
      document.body.style.overflow = originalBodyOverflow.current;
      originalBodyOverflow.current = null;
    }
    desiredOpen.current = false;
  }, []);

  return (
    <dialog ref={dialog} aria-labelledby={titleId} className="ui-dialog" onCancel={(event) => { event.preventDefault(); onDismiss(); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
          .filter((element) => element.getClientRects().length > 0 && !element.closest("[inert]"));
        event.preventDefault();
        if (!elements.length) return;
        // Safari can skip links in native Tab order; cycle the complete DOM order.
        const current = elements.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey
          ? current <= 0 ? elements.length - 1 : current - 1
          : (current + 1) % elements.length;
        elements[next].focus();
      }}
      onClick={(event) => { if (event.target === event.currentTarget) onDismiss(); }}>
      <div ref={panel} className="ui-drawer">{children}</div>
    </dialog>
  );
}
