"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { cartTotals, type CartItem, type CartProduct } from "@/src/lib/cart";
import { createCartStore } from "@/src/lib/cart-store";
export type { CartItem } from "@/src/lib/cart";

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartProduct) => boolean;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalQuantity: number;
  subtotal: number;
  removeItem: (id: string) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createCartStore(() => window.localStorage));
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback(
    (item: CartProduct) => {
      const added = store.addItem(item);
      if (added) setIsOpen(true);
      return added;
    },
    [store],
  );

  const value = useMemo(
    () => ({
      items,
      isOpen,
      addItem,
      removeItem: store.removeItem,
      setQuantity: store.setQuantity,
      clearCart: store.clearCart,
      totalQuantity: cartTotals(items).quantity,
      subtotal: cartTotals(items).subtotal,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((open) => !open),
    }),
    [addItem, isOpen, items, store],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
