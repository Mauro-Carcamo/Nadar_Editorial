import { transaction } from "@/lib/db";
import type { CartLineInput } from "@/schemas/checkout";
import { getSellableBooks } from "@/services/catalog/sellable";

export type ServerCartLine = {
  slug: string;
  quantity: number;
  unitPrice: number | null;
  available: number;
  sellable: boolean;
};

/**
 * Guarda el carrito de un invitado (identificado por guestToken) con precios del servidor.
 * Sirve para: carritos abandonados, analítica (fact_cart) y validar precios/stock antes del checkout.
 */
export async function syncGuestCart(guestToken: string, lines: CartLineInput[], shippingZone: string | null) {
  return transaction(async (client) => {
    const books = await getSellableBooks(lines.map((l) => l.slug), client);

    const cart = await client.query<{ id: string; status: string }>(
      `INSERT INTO carts (guest_token, shipping_zone) VALUES ($1, $2)
       ON CONFLICT (guest_token) DO UPDATE SET shipping_zone = EXCLUDED.shipping_zone, last_activity_at = now()
       RETURNING id, status`,
      [guestToken, shippingZone],
    );
    let cartId = cart.rows[0].id;

    // Un carrito ya convertido en pedido no se reutiliza: se abre uno nuevo con un token nuevo
    if (cart.rows[0].status !== "ACTIVE") {
      return { cartId: null, renewToken: true, lines: [] as ServerCartLine[] };
    }

    await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
    const result: ServerCartLine[] = [];
    for (const line of lines) {
      const book = books.get(line.slug);
      const sellable = Boolean(book && book.status === "PUBLISHED" && book.price !== null);
      result.push({
        slug: line.slug,
        quantity: line.quantity,
        unitPrice: book?.price ?? null,
        available: book?.available ?? 0,
        sellable,
      });
      if (book && sellable) {
        await client.query(
          `INSERT INTO cart_items (cart_id, book_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
          [cartId, book.id, line.quantity, book.price],
        );
      }
    }
    cartId = cart.rows[0].id;
    return { cartId, renewToken: false, lines: result };
  });
}
