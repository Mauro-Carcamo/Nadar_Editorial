"use client";

import { createContext, ReactNode, useContext, useMemo, useSyncExternalStore } from "react";

export type CartItem = {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  price: number | null;
  currency: string;
  quantity: number;
};

type AddItemPayload = Omit<CartItem, "quantity">;

export type ShippingZone = "rm" | "central" | "extreme" | "pickup";

export const SHIPPING_COSTS: Record<ShippingZone, number> = {
  rm: 3500,
  central: 4500,
  extreme: 7900,
  pickup: 0,
};

export const SHIPPING_LABELS: Record<ShippingZone, string> = {
  rm: "Región Metropolitana",
  central: "Regiones centrales",
  extreme: "Norte y Sur",
  pickup: "Retiro en librería",
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shippingZone: ShippingZone;
  shippingCost: number;
  total: number;
  setShippingZone: (zone: ShippingZone) => void;
  addItem: (item: AddItemPayload) => void;
  removeItem: (slug: string) => void;
  changeQty: (slug: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nadar_cart_v1";
const STORAGE_ZONE_KEY = "nadar_shipping_zone";
const EMPTY_CART: CartItem[] = [];
const listeners = new Set<() => void>();
let cachedRaw = "";
let cachedCart: CartItem[] = EMPTY_CART;

function emitCartChange() {
  listeners.forEach((listener) => listener());
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedRaw = "";
      cachedCart = EMPTY_CART;
      return cachedCart;
    }
    if (raw === cachedRaw) return cachedCart;
    const parsed = JSON.parse(raw) as CartItem[];
    cachedRaw = raw;
    cachedCart = Array.isArray(parsed) ? parsed : EMPTY_CART;
    return cachedCart;
  } catch {
    cachedRaw = "";
    cachedCart = EMPTY_CART;
    return cachedCart;
  }
}

function readStoredZone(): ShippingZone {
  if (typeof window === "undefined") return "rm";
  try {
    const raw = window.localStorage.getItem(STORAGE_ZONE_KEY);
    if (!raw) return "rm";
    const zone = raw as ShippingZone;
    if (zone in SHIPPING_COSTS) return zone;
    return "rm";
  } catch {
    return "rm";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  }

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getClientSnapshot() {
  return readStoredCart();
}

function getServerSnapshot() {
  return EMPTY_CART;
}

function writeStoredCart(items: CartItem[]) {
  const raw = JSON.stringify(items);
  cachedRaw = raw;
  cachedCart = items;
  window.localStorage.setItem(STORAGE_KEY, raw);
  emitCartChange();
}

function getServerZone(): ShippingZone {
  return "rm";
}

function writeStoredZone(zone: ShippingZone) {
  window.localStorage.setItem(STORAGE_ZONE_KEY, zone);
  emitCartChange();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  // La zona guardada se lee igual que el carrito (sin setState durante el render)
  const shippingZone = useSyncExternalStore(subscribe, readStoredZone, getServerZone);

  function setShippingZone(zone: ShippingZone) {
    writeStoredZone(zone);
  }

  const shippingCost = useMemo(() => {
    return items.length > 0 ? SHIPPING_COSTS[shippingZone] : 0;
  }, [shippingZone, items.length]);

  function addItem(payload: AddItemPayload) {
    const prev = readStoredCart();
    const found = prev.find((x) => x.slug === payload.slug);
    if (found) {
      writeStoredCart(
        prev.map((x) =>
          x.slug === payload.slug ? { ...x, quantity: Math.min(99, x.quantity + 1) } : x,
        ),
      );
      return;
    }

    writeStoredCart([...prev, { ...payload, quantity: 1 }]);
  }

  function removeItem(slug: string) {
    writeStoredCart(readStoredCart().filter((x) => x.slug !== slug));
  }

  function changeQty(slug: string, qty: number) {
    writeStoredCart(
      readStoredCart()
        .map((x) => (x.slug === slug ? { ...x, quantity: Math.min(99, Math.max(1, qty)) } : x))
        .filter((x) => x.quantity > 0),
    );
  }

  function clear() {
    writeStoredCart([]);
  }

const count = useMemo(() => items.reduce((acc, x) => acc + x.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((acc, x) => acc + (x.price ?? 0) * x.quantity, 0),
    [items],
  );
  const total = subtotal + shippingCost;

const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      subtotal,
      shippingZone,
      shippingCost,
      total,
      setShippingZone,
      addItem,
      removeItem,
      changeQty,
      clear,
    }),
    [items, count, subtotal, shippingZone, shippingCost, total],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

