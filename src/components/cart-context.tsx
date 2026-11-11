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

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image: string | null;
  finish: string | null;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "tonevault-cart";
const EMPTY_CART: CartItem[] = [];

function readStoredItems(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createCartStore() {
  let items: CartItem[] | undefined;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => items ?? EMPTY_CART,
    getServerSnapshot: () => EMPTY_CART,
    subscribe(listener: () => void) {
      items ??= readStoredItems();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(change: (current: CartItem[]) => CartItem[]) {
      items = change(items ?? readStoredItems());
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {
        // The cart can still work in this tab when storage is unavailable.
      }
      listeners.forEach((listener) => listener());
    },
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createCartStore);
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback(
    (item: CartItem) => {
      store.update((current) =>
        current.some((existing) => existing.id === item.id) ? current : [...current, item],
      );
      setIsOpen(true);
    },
    [store],
  );

  const removeItem = useCallback(
    (id: string) => {
      store.update((current) => current.filter((item) => item.id !== id));
    },
    [store],
  );

  const value = useMemo(
    () => ({
      items,
      isOpen,
      addItem,
      removeItem,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((open) => !open),
    }),
    [addItem, isOpen, items, removeItem],
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
