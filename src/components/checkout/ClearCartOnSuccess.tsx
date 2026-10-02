"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";

// Tras un pago aprobado se vacía el carrito y se usa un identificador nuevo para el próximo.
export function ClearCartOnSuccess() {
  useEffect(() => {
    void Promise.resolve(useCartStore.persist.rehydrate()).then(() => {
      useCartStore.getState().clear();
      useCartStore.getState().renewToken();
    });
  }, []);
  return null;
}
