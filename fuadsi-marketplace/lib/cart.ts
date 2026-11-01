export type CartLine = { productId: string; quantity: number };
const KEY = "fuadsi.cart.v1";

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw)
      ? raw.filter((l) => l && typeof l.productId === "string" && Number.isInteger(l.quantity) && l.quantity > 0)
      : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("fuadsi:cart"));
}

export function addToCart(productId: string, quantity = 1, max = 99) {
  const lines = readCart();
  const found = lines.find((l) => l.productId === productId);
  if (found) found.quantity = Math.min(max, found.quantity + quantity);
  else lines.push({ productId, quantity: Math.min(max, quantity) });
  writeCart(lines);
}

export function setQuantity(productId: string, quantity: number) {
  writeCart(readCart().map((l) => (l.productId === productId ? { ...l, quantity } : l)).filter((l) => l.quantity > 0));
}

export function removeFromCart(productId: string) {
  writeCart(readCart().filter((l) => l.productId !== productId));
}

export function clearCart() {
  writeCart([]);
}
