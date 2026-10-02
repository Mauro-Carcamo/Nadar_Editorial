"use client";

import { motion } from "motion/react";
import { useCart } from "@/components/cart/CartProvider";
import { useCartStore } from "@/stores/cart-store";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4h-2l-1 2v2h2l2.4 7.2c.2.5.7.8 1.2.8h7.9c.5 0 .9-.3 1.1-.8L21 8H8.1l-.5-2H7zm3 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </svg>
  );
}

// Botón del carrito en la cabecera: abre el carrito lateral; el contador rebota en cada agregado.
export function CartButton() {
  const { count, open } = useCart();
  const bump = useCartStore((s) => s.bump);

  return (
    <button type="button" className="cart-trigger" onClick={open} aria-label={`Abrir carrito (${count} libros)`}>
      <span className="cart-icon-wrap" data-cart-target>
        <CartIcon />
      </span>
      <span className="cart-trigger-label">Carrito</span>
      <motion.span
        key={bump}
        className="cart-count"
        initial={bump ? { scale: 1.6 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.85 }}
        suppressHydrationWarning
      >
        {count}
      </motion.span>
    </button>
  );
}
