"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCartStore } from "@/stores/cart-store";

// Al agregar un libro, una copia de su portada vuela hasta el ícono del carrito; al llegar, el contador
// rebota y se abre el carrito lateral. Origen y destino se miden en el clic (AddToCartButton).
export function FlyToCart() {
  const fly = useCartStore((s) => s.fly);
  const clearFly = useCartStore((s) => s.clearFly);
  const open = useCartStore((s) => s.open);

  return (
    <AnimatePresence>
      {fly ? (
        <motion.img
          key={fly.id}
          src={fly.src}
          alt=""
          aria-hidden="true"
          className="fly-to-cart"
          initial={{ left: fly.x, top: fly.y, width: fly.width, height: fly.height, opacity: 1, rotate: 0 }}
          animate={{ left: fly.toX - 14, top: fly.toY - 20, width: 28, height: 40, opacity: 0.6, rotate: -8 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.5, 0, 0.2, 1] }}
          onAnimationComplete={() => {
            clearFly();
            open();
          }}
        />
      ) : null}
    </AnimatePresence>
  );
}
