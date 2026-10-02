-- =====================================================================
-- 002 · Modelo analítico (OLAP) en esquema estrella
-- Esquema separado "analytics": el modelo transaccional (public) no se diseña como estrella;
-- se transforma hacia dimensiones y hechos. Hoy son VISTAS (ELT liviano); cuando crezca el
-- volumen se materializan o se reemplazan por modelos dbt con la misma forma.
-- Claves: date_key = AAAAMMDD; el resto usa el id transaccional como clave natural.
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS analytics;

-- ---------------------------------------------------------------------
-- DIM_DATE (tabla real: calendario 2014–2035)
-- ---------------------------------------------------------------------
CREATE TABLE analytics.dim_date (
  date_key     integer PRIMARY KEY, -- 20261002
  date         date NOT NULL UNIQUE,
  day          smallint NOT NULL,
  month        smallint NOT NULL,
  month_name   text NOT NULL,
  quarter      smallint NOT NULL,
  year         smallint NOT NULL,
  iso_week     smallint NOT NULL,
  day_of_week  smallint NOT NULL, -- 1 = lunes
  day_name     text NOT NULL,
  is_weekend   boolean NOT NULL
);

INSERT INTO analytics.dim_date
SELECT to_char(d, 'YYYYMMDD')::int,
       d::date,
       extract(day FROM d)::smallint,
       extract(month FROM d)::smallint,
       (ARRAY['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'])[extract(month FROM d)::int],
       extract(quarter FROM d)::smallint,
       extract(year FROM d)::smallint,
       extract(week FROM d)::smallint,
       extract(isodow FROM d)::smallint,
       (ARRAY['lunes','martes','miércoles','jueves','viernes','sábado','domingo'])[extract(isodow FROM d)::int],
       extract(isodow FROM d) IN (6, 7)
FROM generate_series('2014-01-01'::date, '2035-12-31'::date, interval '1 day') AS d;

-- ---------------------------------------------------------------------
-- DIMENSIONES (vistas desnormalizadas)
-- ---------------------------------------------------------------------
CREATE VIEW analytics.dim_publisher AS
SELECT p.id AS publisher_key, p.name AS publisher_name, p.slug AS publisher_slug
FROM publishers p;

CREATE VIEW analytics.dim_author AS
SELECT a.id AS author_key, a.name AS author_name, a.slug AS author_slug
FROM authors a;

CREATE VIEW analytics.dim_category AS
SELECT c.id AS category_key, c.name AS category_name, c.slug AS category_slug,
       parent.name AS parent_category_name
FROM categories c
LEFT JOIN categories parent ON parent.id = c.parent_id;

-- Libro con atributos aplanados (autor principal, colección, serie, editorial)
CREATE VIEW analytics.dim_book AS
SELECT b.id AS book_key,
       b.isbn,
       b.title,
       b.slug,
       (SELECT string_agg(a.name, ', ' ORDER BY ba.position)
          FROM book_authors ba JOIN authors a ON a.id = ba.author_id
         WHERE ba.book_id = b.id AND ba.role = 'author') AS authors,
       pub.name AS publisher_name,
       col.name AS collection_name,
       b.series,
       (SELECT string_agg(c.name, ', ' ORDER BY c.name)
          FROM book_categories bc JOIN categories c ON c.id = bc.category_id
         WHERE bc.book_id = b.id) AS categories,
       b.format,
       b.language,
       b.publication_year,
       b.pages,
       b.price AS list_price,
       b.status
FROM books b
LEFT JOIN publishers pub ON pub.id = b.publisher_id
LEFT JOIN collections col ON col.id = b.collection_id;

-- Puentes para relaciones N:M (libro–autor, libro–categoría) en el análisis
CREATE VIEW analytics.bridge_book_author AS
SELECT ba.book_id AS book_key, ba.author_id AS author_key, ba.role,
       1.0 / count(*) OVER (PARTITION BY ba.book_id) AS allocation_factor
FROM book_authors ba
WHERE ba.role = 'author';

CREATE VIEW analytics.bridge_book_category AS
SELECT bc.book_id AS book_key, bc.category_id AS category_key,
       1.0 / count(*) OVER (PARTITION BY bc.book_id) AS allocation_factor
FROM book_categories bc;

CREATE VIEW analytics.dim_customer AS
SELECT c.id AS customer_key,
       c.email,
       c.full_name,
       (c.user_id IS NOT NULL) AS is_registered,
       to_char(c.created_at, 'YYYYMMDD')::int AS first_seen_date_key,
       (SELECT a.region FROM addresses a WHERE a.customer_id = c.id ORDER BY a.is_default DESC, a.created_at LIMIT 1) AS region,
       (SELECT a.commune FROM addresses a WHERE a.customer_id = c.id ORDER BY a.is_default DESC, a.created_at LIMIT 1) AS commune
FROM customers c;

CREATE VIEW analytics.dim_payment_method AS
SELECT DISTINCT
       provider || ':' || coalesce(payment_method, 'NA') AS payment_method_key,
       provider,
       coalesce(payment_method, 'NA') AS payment_method
FROM payments;

CREATE VIEW analytics.dim_shipping_zone AS
SELECT code AS shipping_zone_key, label, cost FROM shipping_zones;

-- ---------------------------------------------------------------------
-- HECHOS
-- ---------------------------------------------------------------------

-- FACT_SALES · grano: una línea de producto vendida dentro de un pedido pagado
-- (el envío y el descuento del pedido se prorratean por línea según su peso en el subtotal)
CREATE VIEW analytics.fact_sales AS
SELECT oi.id AS sale_id,
       to_char(o.created_at, 'YYYYMMDD')::int AS date_key,
       o.customer_id AS customer_key,
       oi.book_id AS book_key,
       paid.provider || ':' || coalesce(paid.payment_method, 'NA') AS payment_method_key,
       o.shipping_zone AS shipping_zone_key,
       o.id AS order_id,
       o.order_number,
       oi.quantity,
       oi.unit_price,
       oi.line_total AS gross_amount,
       CASE WHEN o.subtotal > 0 THEN round(o.discount::numeric * oi.line_total / o.subtotal) ELSE 0 END AS discount_amount,
       CASE WHEN o.subtotal > 0 THEN round(o.shipping::numeric * oi.line_total / o.subtotal) ELSE 0 END AS shipping_amount,
       oi.line_total - CASE WHEN o.subtotal > 0 THEN round(o.discount::numeric * oi.line_total / o.subtotal) ELSE 0 END AS net_amount,
       o.status AS order_status
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
LEFT JOIN LATERAL (
  SELECT p.provider, p.payment_method
  FROM payments p
  WHERE p.order_id = o.id AND p.status = 'APPROVED'
  ORDER BY p.updated_at DESC LIMIT 1
) paid ON true
WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED');

-- FACT_CART · grano: una línea de carrito (incluye abandonados y convertidos)
CREATE VIEW analytics.fact_cart AS
SELECT ci.id AS cart_line_id,
       c.id AS cart_id,
       to_char(c.created_at, 'YYYYMMDD')::int AS date_key,
       c.customer_id AS customer_key,
       ci.book_id AS book_key,
       CASE
         WHEN c.status = 'ACTIVE' AND c.last_activity_at < now() - interval '24 hours' THEN 'ABANDONED'
         ELSE c.status
       END AS cart_status,
       ci.quantity,
       ci.unit_price,
       ci.quantity * ci.unit_price AS line_value,
       c.converted_order_id,
       extract(epoch FROM (c.last_activity_at - c.created_at)) / 60 AS minutes_active
FROM cart_items ci
JOIN carts c ON c.id = ci.cart_id;

-- FACT_PAYMENT · grano: un intento de pago
CREATE VIEW analytics.fact_payment AS
SELECT p.id AS payment_id,
       to_char(p.created_at, 'YYYYMMDD')::int AS date_key,
       o.customer_id AS customer_key,
       p.provider || ':' || coalesce(p.payment_method, 'NA') AS payment_method_key,
       p.order_id,
       p.status,
       p.amount,
       row_number() OVER (PARTITION BY p.order_id ORDER BY p.created_at) AS attempt_number,
       extract(epoch FROM (p.updated_at - p.created_at)) AS seconds_to_resolution
FROM payments p
JOIN orders o ON o.id = p.order_id;

-- FACT_INVENTORY · grano: un movimiento de inventario
CREATE VIEW analytics.fact_inventory AS
SELECT m.id AS movement_id,
       to_char(m.created_at, 'YYYYMMDD')::int AS date_key,
       m.book_id AS book_key,
       m.reason,
       m.delta_stock,
       m.delta_reserved,
       m.order_id
FROM inventory_movements m;

-- FUNNEL · eventos de navegación agregados por día
CREATE VIEW analytics.fact_funnel_daily AS
SELECT to_char(e.created_at, 'YYYYMMDD')::int AS date_key,
       e.event_type,
       count(*) AS events,
       count(DISTINCT e.session_id) AS sessions
FROM analytics_events e
GROUP BY 1, 2;
