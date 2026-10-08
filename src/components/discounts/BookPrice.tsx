import type { Book } from "@/data/book-utils";
import { finalPrice } from "@/data/book-utils";

const formatPrice = (price: number) => `$${new Intl.NumberFormat("es-CL").format(price)}`;

/**
 * Precio del libro. Con descuento vigente: precio final destacado y el de lista tachado.
 * `currency` agrega la moneda en un <span> (como en la ficha y en Colecciones).
 */
export function BookPrice({ book, currency = false }: { book: Book; currency?: boolean }) {
  const price = finalPrice(book);
  if (!price) return null;
  const unit = currency ? <span>{book.currency ?? "CLP"}</span> : null;
  if (!book.discount || !book.price || book.discount.price === null) {
    return (
      <>
        {formatPrice(price)} {unit}
      </>
    );
  }
  return (
    <>
      <s className="price-list" aria-label={`Precio normal ${formatPrice(book.price)}`}>
        {formatPrice(book.price)}
      </s>{" "}
      <strong className="price-final">{formatPrice(price)}</strong> {unit}
    </>
  );
}
