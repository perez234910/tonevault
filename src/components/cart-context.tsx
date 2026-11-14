"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { cartTotals, type CartProduct } from "@/src/lib/cart";
import { createCartStore } from "@/src/lib/cart-store";
export type { CartItem } from "@/src/lib/cart";

type CartContextValue = {
  store: ReturnType<typeof createCartStore>;
  isOpen: boolean;
  addItem: (item: CartProduct) => boolean;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  removeItem: (id: string) => void;
  feedback: { id: number; message: string } | null;
  feedbackVisible: boolean;
  dismissFeedback: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const serverHydrationSnapshot = () => false;

export function CartProvider({ children, storageKey }: { children: ReactNode; storageKey?: string }) {
  const [store] = useState(() => createCartStore(() => window.localStorage, storageKey));
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ id: number; message: string } | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const dismissFeedback = useCallback(() => setFeedbackVisible(false), []);
  const addItem = useCallback((item: CartProduct) => {
    const added = store.addItem(item);
    if (added) {
      setFeedback((previous) => ({ id: (previous?.id ?? 0) + 1, message: `Added ${item.title} to your cart.` }));
      setFeedbackVisible(true);
    }
    return added;
  }, [store]);
  const value = useMemo(() => ({
    store, isOpen, addItem, removeItem: store.removeItem, setQuantity: store.setQuantity,
    clearCart: store.clearCart, feedback, feedbackVisible, dismissFeedback,
    openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false), toggleCart: () => setIsOpen((open) => !open),
  }), [addItem, dismissFeedback, feedback, feedbackVisible, isOpen, store]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  const { store, ...actions } = context;
  // Each consumer needs its own server snapshot when hydrating a Suspense boundary.
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const hydrated = useSyncExternalStore(store.subscribe, store.isHydrated, serverHydrationSnapshot);
  const totals = useMemo(() => cartTotals(items), [items]);
  return { ...actions, items, hydrated, totalQuantity: totals.quantity, subtotal: totals.subtotal };
}
