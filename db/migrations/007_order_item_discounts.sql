-- Cada línea de pedido guarda el precio normal y la campaña del descuento aplicado (si hubo).
-- unit_price sigue siendo el precio cobrado; con estas columnas el pedido, el admin y la analítica
-- muestran "precio normal → precio Cyber" aunque la campaña cambie o se elimine después.

ALTER TABLE order_items
  ADD COLUMN list_price       integer CHECK (list_price IS NULL OR list_price >= 0),
  ADD COLUMN discount_percent integer CHECK (discount_percent IS NULL OR discount_percent BETWEEN 1 AND 90),
  ADD COLUMN campaign_name    text;

-- Un descuento solo tiene sentido en libros con precio: se descartan los que se cargaron sin precio
DELETE FROM book_discounts bd USING books b WHERE b.id = bd.book_id AND b.price IS NULL;
