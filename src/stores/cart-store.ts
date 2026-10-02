"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Estado del carrito en el navegador (Zustand): interacción inmediata, panel lateral y animaciones.
// La fuente de verdad de precios y stock es el servidor: /api/cart guarda el carrito y devuelve
// precios reales; /api/checkout vuelve a calcularlo todo.

export type ShippingZone = "rm" | "central" | "extreme" | "pickup";

export const SHIPPING_COSTS: Record<ShippingZone, number> = { rm: 3500, central: 4500, extreme: 7900, pickup: 0 };
export const SHIPPING_LABELS: Record<ShippingZone, string> = {
  rm: "Región Metropolitana",
  central: "Regiones centrales",
  extreme: "Norte y Sur",
  pickup: "Retiro en librería",
};

export type CartItem = {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  price: number | null;
  currency: string;
  quantity: number;
  available?: number; // stock informado por el servidor
};

// Animación "vuelo al carrito": origen (portada) y destino (ícono del carrito), medidos al hacer clic
export type FlyFrom = { id: number; src: string; x: number; y: number; width: number; height: number; toX: number; toY: number };

type CartState = {
  items: CartItem[];
  shippingZone: ShippingZone;
  guestToken: string | null;
  isOpen: boolean;
  fly: FlyFrom | null;
  bump: number; // cambia en cada agregado: dispara la animación del contador
  addItem: (item: Omit<CartItem, "quantity">, from?: Omit<FlyFrom, "id">) => void;
  removeItem: (slug: string) => void;
  changeQty: (slug: string, quantity: number) => void;
  setShippingZone: (zone: ShippingZone) => void;
  applyServerPrices: (lines: { slug: string; unitPrice: number | null; available: number }[]) => void;
  clear: () => void;
  renewToken: () => void;
  open: () => void;
  close: () => void;
  clearFly: () => void;
};

const newToken = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shippingZone: "rm",
      guestToken: null,
      isOpen: false,
      fly: null,
      bump: 0,

      addItem: (item, from) =>
        set((state) => {
          const existing = state.items.find((x) => x.slug === item.slug);
          const items = existing
            ? state.items.map((x) => (x.slug === item.slug ? { ...x, quantity: Math.min(99, x.quantity + 1) } : x))
            : [...state.items, { ...item, quantity: 1 }];
          return {
            items,
            guestToken: state.guestToken ?? newToken(),
            fly: from ? { ...from, id: Date.now() } : null,
            // Sin animación (movimiento reducido o sin origen) el carrito se abre de inmediato
            isOpen: from ? state.isOpen : true,
            bump: state.bump + 1,
          };
        }),
      removeItem: (slug) => set((state) => ({ items: state.items.filter((x) => x.slug !== slug) })),
      changeQty: (slug, quantity) =>
        set((state) => ({
          items: state.items.map((x) => (x.slug === slug ? { ...x, quantity: Math.min(99, Math.max(1, Math.round(quantity) || 1)) } : x)),
        })),
      setShippingZone: (shippingZone) => set({ shippingZone }),
      applyServerPrices: (lines) =>
        set((state) => ({
          items: state.items.map((x) => {
            const line = lines.find((l) => l.slug === x.slug);
            return line ? { ...x, price: line.unitPrice, available: line.available } : x;
          }),
        })),
      clear: () => set({ items: [] }),
      renewToken: () => set({ guestToken: newToken() }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      clearFly: () => {
        if (get().fly) set({ fly: null });
      },
    }),
    {
      name: "nadar_cart_v2",
      storage: createJSONStorage(() => localStorage),
      // Solo se persiste el contenido; el panel y las animaciones son efímeros
      partialize: (s) => ({ items: s.items, shippingZone: s.shippingZone, guestToken: s.guestToken }),
      // Se hidrata en el cliente después del primer render (evita desajustes con el HTML del servidor)
      skipHydration: true,
    },
  ),
);

// Selectores derivados
export const selectCount = (s: CartState) => s.items.reduce((n, x) => n + x.quantity, 0);
export const selectSubtotal = (s: CartState) => s.items.reduce((n, x) => n + (x.price ?? 0) * x.quantity, 0);
export const selectShippingCost = (s: CartState) => (s.items.length ? SHIPPING_COSTS[s.shippingZone] : 0);
