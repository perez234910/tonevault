import { addCartItem, parseStoredCart, removeCartItem, setCartQuantity, type CartItem, type CartProduct } from "./cart";

export const CART_STORAGE_KEY = "tonevault-cart";
const EMPTY_CART: CartItem[] = [];
type StorageAccess = () => Pick<Storage, "getItem" | "setItem">;

/** A per-provider external store keeps hydration and rapid actions consistent. */
export function createCartStore(getStorage: StorageAccess, storageKey = CART_STORAGE_KEY) {
  let items = EMPTY_CART;
  let hydrated = false;
  const listeners = new Set<() => void>();

  function hydrate() {
    if (hydrated) return;
    hydrated = true;
    try {
      items = parseStoredCart(getStorage().getItem(storageKey));
    } catch {
      items = EMPTY_CART;
    }
  }

  function update(transform: (current: CartItem[]) => CartItem[]) {
    hydrate();
    items = transform(items);
    try {
      getStorage().setItem(storageKey, JSON.stringify(items));
    } catch {
      // Privacy settings/quota must not prevent this tab's cart from working.
    }
    listeners.forEach((listener) => listener());
  }

  return {
    isHydrated: () => hydrated,
    getSnapshot: () => items,
    getServerSnapshot: () => EMPTY_CART,
    subscribe(listener: () => void) {
      hydrate();
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    addItem(product: CartProduct) {
      hydrate();
      const next = addCartItem(items, product);
      if (next === items) return false;
      update(() => next);
      return true;
    },
    setQuantity: (id: string, quantity: number) => update((current) => setCartQuantity(current, id, quantity)),
    removeItem: (id: string) => update((current) => removeCartItem(current, id)),
    clearCart: () => update(() => []),
  };
}
