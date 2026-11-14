import assert from "node:assert/strict";
import { test } from "node:test";
import { addCartItem, cartTotals, lineSubtotal, parseStoredCart, removeCartItem, setCartQuantity, type CartProduct } from "../src/lib/cart";
import { CART_STORAGE_KEY, createCartStore } from "../src/lib/cart-store";
import { formatPrice } from "../src/lib/format";

const guitar: CartProduct = { id: "guitar-1", title: "1965 Fender Stratocaster", price: 485000, image: null, finish: "Olympic White", stock: 3, status: "available" };

test("addition and duplicate additions obey dynamic stock without mutating inputs", () => {
  const first = addCartItem([], guitar);
  let items = first;
  for (let i = 0; i < 5; i++) items = addCartItem(items, guitar);
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 3);
  assert.equal(first[0].quantity, 1);
  assert.equal(addCartItem([], { ...guitar, stock: 1 })[0].quantity, 1);
});

test("adding at the stock limit is refused and does not report success", () => {
  const atLimit = setCartQuantity(addCartItem([], guitar), guitar.id, guitar.stock);
  assert.equal(atLimit[0].quantity, 3);
  // Same array reference means "nothing added"; the store relies on this.
  assert.equal(addCartItem(atLimit, guitar), atLimit);
  assert.equal(addCartItem(atLimit, { ...guitar, stock: 2 }), atLimit);

  let saved = JSON.stringify([{ ...guitar, quantity: 1 }]);
  let writes = 0;
  let notifications = 0;
  const store = createCartStore(() => ({ getItem: () => saved, setItem: (_key, value) => { saved = value; writes++; } }));
  store.subscribe(() => { notifications++; });
  assert.equal(store.addItem({ ...guitar, stock: 2 }), true);
  assert.equal(store.addItem({ ...guitar, stock: 2 }), false);
  assert.equal(store.getSnapshot()[0].quantity, 2);
  assert.equal(writes, 1);
  assert.equal(notifications, 1);
});

test("sold, zero stock, fractional stock and malformed products cannot be added", () => {
  for (const stock of [0, -1, 1.5, NaN, Infinity]) assert.deepEqual(addCartItem([], { ...guitar, stock }), []);
  assert.deepEqual(addCartItem([], { ...guitar, status: "sold" }), []);
  assert.deepEqual(addCartItem([], { ...guitar, price: NaN }), []);
});

test("quantity changes reject invalid input and cap at available stock", () => {
  const items = addCartItem([], guitar);
  for (const quantity of [0, -3, 1.5, NaN, Infinity]) assert.deepEqual(setCartQuantity(items, guitar.id, quantity), items);
  assert.equal(setCartQuantity(items, guitar.id, 2)[0].quantity, 2);
  assert.equal(setCartQuantity(items, guitar.id, 99)[0].quantity, 3);
  assert.deepEqual(removeCartItem(items, guitar.id), []);
  assert.deepEqual(removeCartItem(items, "missing"), items);
});

test("subtotals use quantities, cent precision and Philippine pesos", () => {
  const items = setCartQuantity(addCartItem([], guitar), guitar.id, 2);
  assert.deepEqual(cartTotals(items), { quantity: 2, subtotal: 970000 });
  assert.deepEqual(cartTotals([]), { quantity: 0, subtotal: 0 });
  assert.equal(lineSubtotal({ price: 0.1, quantity: 3 }), 0.3);
  assert.equal(formatPrice(485000), "₱485,000");
  assert.equal(formatPrice(168000.5), "₱168,000.50");
});

test("legacy persistence defaults quantity to one and keeps stock explicitly unknown", () => {
  const { stock, status, ...legacy } = guitar;
  void stock; void status;
  const items = parseStoredCart(JSON.stringify([legacy]));
  assert.equal(items[0].quantity, 1);
  assert.equal(items[0].stock, null);
  assert.equal(setCartQuantity(items, guitar.id, 5)[0].quantity, 1);
  const refreshed = addCartItem(items, { ...guitar, stock: 2, price: 100 });
  assert.equal(refreshed[0].stock, 2);
  assert.equal(refreshed[0].quantity, 2);
  assert.equal(refreshed[0].price, 100);
});

test("corrupt storage is ignored, valid entries survive and duplicates do not inflate quantities", () => {
  for (const raw of [null, "{", "null", "{}", '"bad"']) assert.deepEqual(parseStoredCart(raw), []);
  const valid = { ...guitar, quantity: 2 };
  const invalid = [null, 3, {}, { ...valid, price: "2" }, { ...valid, quantity: -1 }, { ...valid, stock: 0 }];
  const items = parseStoredCart(JSON.stringify([...invalid, valid, valid]));
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 2);
  assert.equal(parseStoredCart(JSON.stringify([{ ...valid, quantity: 20 }]))[0].quantity, 3);
  assert.equal(parseStoredCart(JSON.stringify([{ ...valid, image: "javascript:alert(1)" }]))[0].image, null);
});

test("store hydrates before writes, preserves rapid actions, clears, and tolerates unavailable storage", () => {
  let saved = JSON.stringify([{ ...guitar, quantity: 1 }]);
  const store = createCartStore(() => ({
    getItem: (key) => { assert.equal(key, CART_STORAGE_KEY); return saved; },
    setItem: (key, value) => { assert.equal(key, CART_STORAGE_KEY); saved = value; },
  }));
  assert.deepEqual(store.getServerSnapshot(), []);
  let notifications = 0;
  const unsubscribe = store.subscribe(() => { notifications++; });
  assert.equal(store.getSnapshot()[0].quantity, 1);
  store.addItem(guitar);
  store.addItem({ ...guitar, id: "guitar-2" });
  assert.equal(store.getSnapshot().length, 2);
  assert.equal(store.getSnapshot()[0].quantity, 2);
  store.setQuantity(guitar.id, 3);
  store.removeItem("guitar-2");
  assert.equal(parseStoredCart(saved)[0].quantity, 3);
  store.clearCart();
  assert.deepEqual(parseStoredCart(saved), []);
  assert.equal(notifications, 5);
  unsubscribe();
  const denied = createCartStore(() => { throw new Error("storage denied"); });
  assert.equal(denied.addItem(guitar), true);
  assert.equal(denied.getSnapshot()[0].quantity, 1);
  assert.equal(denied.addItem({ ...guitar, stock: 0 }), false);
});
