// Cálculo de totales del pedido: función pura (fácil de probar con tests unitarios).
export type PricedLine = { quantity: number; unitPrice: number };

export function calculateTotals(lines: PricedLine[], shippingCost: number, discount = 0) {
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const shipping = lines.length ? shippingCost : 0;
  const appliedDiscount = Math.min(discount, subtotal);
  return { subtotal, shipping, discount: appliedDiscount, total: subtotal + shipping - appliedDiscount };
}
