"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FlyToCart } from "@/components/cart/FlyToCart";
import {
  SHIPPING_COSTS,
  SHIPPING_LABELS,
  selectCount,
  selectShippingCost,
  selectSubtotal,
  useCartStore,
  type CartItem,
  type ShippingZone,
} from "@/stores/cart-store";

export { SHIPPING_COSTS, SHIPPING_LABELS };
export type { CartItem, ShippingZone };

const LEGACY_KEY = "nadar_cart_v1";
const LEGACY_ZONE_KEY = "nadar_shipping_zone";

/** Hidrata el carrito guardado, migra el formato anterior y lo sincroniza con el servidor. */
function CartRuntime() {
  const items = useCartStore((s) => s.items);
  const shippingZone = useCartStore((s) => s.shippingZone);
  const guestToken = useCartStore((s) => s.guestToken);
  const hydrated = useRef(false);

  useEffect(() => {
    void Promise.resolve(useCartStore.persist.rehydrate()).then(() => {
      hydrated.current = true;
      try {
        // Migración única desde el carrito anterior (localStorage nadar_cart_v1)
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy) as CartItem[];
          if (Array.isArray(parsed) && parsed.length && !useCartStore.getState().items.length) {
            const zone = localStorage.getItem(LEGACY_ZONE_KEY) as ShippingZone | null;
            useCartStore.setState({ items: parsed, ...(zone && zone in SHIPPING_COSTS ? { shippingZone: zone } : {}) });
          }
          localStorage.removeItem(LEGACY_KEY);
          localStorage.removeItem(LEGACY_ZONE_KEY);
        }
      } catch {
        // almacenamiento no disponible: el carrito funciona igual en memoria
      }
    });
  }, []);

  // Persistencia en el servidor (debounce): precios y stock reales, base de carritos abandonados
  useEffect(() => {
    if (!hydrated.current || !guestToken) return;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: guestToken,
            items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
            shippingZone,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.renewToken) useCartStore.getState().renewToken();
        else if (Array.isArray(data.lines)) useCartStore.getState().applyServerPrices(data.lines);
      } catch {
        // sin conexión con el servidor: se reintenta en el próximo cambio
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [items, shippingZone, guestToken]);

  return null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CartRuntime />
      <CartDrawer />
      <FlyToCart />
    </>
  );
}

/** API del carrito para los componentes (se mantiene la misma forma que antes de Zustand). */
export function useCart() {
  const state = useCartStore(
    useShallow((s) => ({
      items: s.items,
      shippingZone: s.shippingZone,
      guestToken: s.guestToken,
      addItem: s.addItem,
      removeItem: s.removeItem,
      changeQty: s.changeQty,
      setShippingZone: s.setShippingZone,
      clear: s.clear,
      open: s.open,
      close: s.close,
    })),
  );
  const count = useCartStore(selectCount);
  const subtotal = useCartStore(selectSubtotal);
  const shippingCost = useCartStore(selectShippingCost);
  return { ...state, count, subtotal, shippingCost, total: subtotal + shippingCost };
}
