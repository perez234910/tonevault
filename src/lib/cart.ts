import type { ProductStatus } from "../types";

/** Display previews only. The order API must recheck stock and calculate prices. */
export type CartItem = {
  id: string;
  title: string;
  price: number;
  image: string | null;
  finish: string | null;
  quantity: number;
  // Old persisted entries have no stock information until refreshed from the API.
  stock: number | null;
};

export type CartProduct = Omit<CartItem, "quantity" | "stock"> & {
  stock: number;
  status: ProductStatus;
};

function validQuantity(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

function safeImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "images.unsplash.com" ? value : null;
  } catch {
    return null;
  }
}

function parseItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" || !item.id.trim() ||
    typeof item.title !== "string" || !item.title.trim() ||
    typeof item.price !== "number" || !Number.isFinite(item.price) ||
    item.price < 0 || item.price > Number.MAX_SAFE_INTEGER / 100 ||
    (item.finish != null && typeof item.finish !== "string") ||
    (item.stock != null && !validQuantity(item.stock)) ||
    (item.quantity !== undefined && !validQuantity(item.quantity))
  ) return null;

  const stock = typeof item.stock === "number" ? item.stock : null;
  return {
    id: item.id,
    title: item.title,
    price: item.price,
    image: safeImage(item.image),
    finish: typeof item.finish === "string" ? item.finish : null,
    quantity: Math.min((item.quantity as number | undefined) ?? 1, stock ?? 1),
    stock,
  };
}

export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items: CartItem[] = [];
    for (const value of parsed) {
      const item = parseItem(value);
      // A corrupt duplicate must not multiply the saved quantity.
      if (item && !items.some((existing) => existing.id === item.id)) items.push(item);
    }
    return items;
  } catch {
    return [];
  }
}

export function addCartItem(items: CartItem[], product: CartProduct): CartItem[] {
  if (product.status !== "available" || !validQuantity(product.stock)) return items;
  const existing = items.find((item) => item.id === product.id);
  const item = parseItem({ ...product, quantity: (existing?.quantity ?? 0) + 1 });
  // At the stock limit, clamping returns the same quantity. Report that as "not added"
  // (same array) instead of a successful addition.
  if (!item || (existing && item.quantity <= existing.quantity)) return items;
  return existing
    ? items.map((current) => current.id === item.id ? item : current)
    : [...items, item];
}

export function setCartQuantity(items: CartItem[], id: string, quantity: number): CartItem[] {
  if (!validQuantity(quantity)) return items;
  return items.map((item) => item.id === id
    ? { ...item, quantity: Math.min(quantity, item.stock ?? 1) }
    : item);
}

export function removeCartItem(items: CartItem[], id: string): CartItem[] {
  return items.filter((item) => item.id !== id);
}

export function lineSubtotal(item: Pick<CartItem, "price" | "quantity">): number {
  return Math.round(item.price * 100) * item.quantity / 100;
}

export function cartTotals(items: CartItem[]) {
  return {
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((cents, item) => cents + Math.round(lineSubtotal(item) * 100), 0) / 100,
  };
}
