-- =====================================================================
-- 001 · Modelo transaccional (OLTP) de Nadar Ediciones
-- PostgreSQL 13+ estándar: se aplica igual en local y, más adelante, en Supabase.
-- Estados como TEXT + CHECK (más simples de migrar que tipos ENUM).
-- Montos en pesos chilenos como INTEGER (CLP no usa decimales).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- CATÁLOGO
-- ---------------------------------------------------------------------
CREATE TABLE publishers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  logo_url    text,
  website     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE authors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  biography   text,
  image_url   text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Colecciones editoriales (Horizontes de sentido, Nadar Contracorriente, ...): concepto propio de la editorial
CREATE TABLE collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  intro       text,
  series      text[] NOT NULL DEFAULT '{}',
  position    integer NOT NULL DEFAULT 0,
  source_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Categorías temáticas (Ensayo, Poesía, Crónica...), jerárquicas
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  parent_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE books (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text NOT NULL UNIQUE,
  title            text NOT NULL,
  isbn             text UNIQUE,
  bajada           text,
  description      text,
  author_bio       text,
  price            integer CHECK (price IS NULL OR price >= 0), -- NULL = sin precio confirmado (no se vende)
  currency         char(3) NOT NULL DEFAULT 'CLP',
  status           text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  publisher_id     uuid REFERENCES publishers(id) ON DELETE SET NULL,
  collection_id    uuid REFERENCES collections(id) ON DELETE SET NULL,
  series           text,
  publication_year integer,
  pages            integer,
  size             text,
  format           text,
  language         text DEFAULT 'es',
  subject          text, -- materia según registro ISBN (p. ej. "861CH - Poesía chilena")
  featured         boolean NOT NULL DEFAULT false,
  sales_rank       integer, -- ranking manual hasta que exista historial de ventas
  source_url       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX books_status_idx ON books (status);
CREATE INDEX books_collection_idx ON books (collection_id);
CREATE INDEX books_publisher_idx ON books (publisher_id);

CREATE TABLE book_authors (
  book_id   uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
  role      text NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'editor', 'translator', 'prologue', 'illustrator', 'coordinator')),
  position  integer NOT NULL DEFAULT 0,
  PRIMARY KEY (book_id, author_id, role)
);
CREATE INDEX book_authors_author_idx ON book_authors (author_id);

CREATE TABLE book_categories (
  book_id     uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  PRIMARY KEY (book_id, category_id)
);
CREATE INDEX book_categories_category_idx ON book_categories (category_id);

-- Las imágenes viven en storage (hoy /public; luego Supabase Storage). Aquí solo la URL.
CREATE TABLE book_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id    uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('cover', 'thumbnail', 'gallery', 'mockup')),
  url        text NOT NULL,
  width      integer,
  height     integer,
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX book_images_book_idx ON book_images (book_id, kind);

-- ---------------------------------------------------------------------
-- INVENTARIO (separado del catálogo)
-- ---------------------------------------------------------------------
CREATE TABLE inventory (
  book_id    uuid PRIMARY KEY REFERENCES books(id) ON DELETE CASCADE,
  stock      integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reserved   integer NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  available  integer GENERATED ALWAYS AS (stock - reserved) STORED,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reserved <= stock)
);

-- Cada cambio de stock queda registrado (auditoría + futuro fact_inventory)
CREATE TABLE inventory_movements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id        uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  delta_stock    integer NOT NULL DEFAULT 0,
  delta_reserved integer NOT NULL DEFAULT 0,
  reason         text NOT NULL CHECK (reason IN ('INITIAL', 'ADJUSTMENT', 'RESERVE', 'RELEASE', 'SALE', 'RETURN')),
  order_id       uuid,
  user_id        uuid,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inventory_movements_book_idx ON inventory_movements (book_id, created_at);

-- ---------------------------------------------------------------------
-- USUARIOS Y ROLES
-- Local: credenciales propias. En Supabase, id pasará a referenciar auth.users(id).
-- ---------------------------------------------------------------------
CREATE TABLE app_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  display_name  text,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'admin', 'editor', 'sales', 'inventory_manager', 'super_admin')),
  is_active     boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- CLIENTES
-- ---------------------------------------------------------------------
CREATE TABLE customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid UNIQUE REFERENCES app_users(id) ON DELETE SET NULL, -- NULL = compra como invitado
  email      text NOT NULL UNIQUE,
  full_name  text,
  phone      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label       text,
  recipient   text,
  street      text NOT NULL,
  number      text,
  apartment   text,
  commune     text NOT NULL,
  region      text NOT NULL,
  postal_code text,
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX addresses_customer_idx ON addresses (customer_id);

-- ---------------------------------------------------------------------
-- ENVÍO
-- ---------------------------------------------------------------------
CREATE TABLE shipping_zones (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  cost       integer NOT NULL CHECK (cost >= 0),
  is_active  boolean NOT NULL DEFAULT true,
  position   integer NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------
-- CARRITOS
-- Un carrito de invitado se identifica por guest_token (guardado en el navegador).
-- ---------------------------------------------------------------------
CREATE TABLE carts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id        uuid REFERENCES customers(id) ON DELETE SET NULL,
  guest_token        text UNIQUE,
  status             text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ABANDONED', 'CONVERTED', 'EXPIRED')),
  shipping_zone      text REFERENCES shipping_zones(code),
  converted_order_id uuid,
  last_activity_at   timestamptz NOT NULL DEFAULT now(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX carts_status_idx ON carts (status, last_activity_at);
CREATE INDEX carts_customer_idx ON carts (customer_id);

CREATE TABLE cart_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  book_id    uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  quantity   integer NOT NULL CHECK (quantity > 0 AND quantity <= 99),
  unit_price integer NOT NULL CHECK (unit_price >= 0), -- precio del servidor al momento de agregar
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, book_id)
);

-- ---------------------------------------------------------------------
-- PEDIDOS
-- ---------------------------------------------------------------------
CREATE SEQUENCE order_number_seq START 1001;

CREATE TABLE orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     integer NOT NULL UNIQUE DEFAULT nextval('order_number_seq'),
  customer_id      uuid REFERENCES customers(id) ON DELETE SET NULL,
  cart_id          uuid REFERENCES carts(id) ON DELETE SET NULL,
  status           text NOT NULL DEFAULT 'PENDING' CHECK (status IN
                   ('PENDING', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')),
  subtotal         integer NOT NULL CHECK (subtotal >= 0),
  shipping         integer NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  discount         integer NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total            integer NOT NULL CHECK (total >= 0),
  currency         char(3) NOT NULL DEFAULT 'CLP',
  shipping_zone    text REFERENCES shipping_zones(code),
  email            text NOT NULL,
  customer_name    text,
  shipping_address jsonb, -- copia al momento de la compra (la dirección del cliente puede cambiar después)
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (total = subtotal + shipping - discount)
);
CREATE INDEX orders_customer_idx ON orders (customer_id, created_at DESC);
CREATE INDEX orders_status_idx ON orders (status, created_at DESC);

ALTER TABLE carts ADD CONSTRAINT carts_converted_order_fk
  FOREIGN KEY (converted_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- Grano: una línea de producto dentro de un pedido (base de fact_sales)
CREATE TABLE order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id    uuid REFERENCES books(id) ON DELETE SET NULL,
  title      text NOT NULL, -- copia del título al momento de la compra
  isbn       text,
  quantity   integer NOT NULL CHECK (quantity > 0),
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  line_total integer GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON order_items (order_id);
CREATE INDEX order_items_book_idx ON order_items (book_id);

CREATE TABLE order_status_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  changed_by  uuid REFERENCES app_users(id) ON DELETE SET NULL, -- NULL = sistema
  source      text NOT NULL DEFAULT 'system', -- system | admin | webhook | callback
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_status_history_order_idx ON order_status_history (order_id, created_at);

-- ---------------------------------------------------------------------
-- PAGOS (un pedido puede tener varios intentos)
-- ---------------------------------------------------------------------
CREATE TABLE payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider            text NOT NULL CHECK (provider IN ('webpay', 'mercadopago')),
  provider_payment_id text, -- token Webpay / id Mercado Pago
  buy_order           text NOT NULL UNIQUE, -- identificador que enviamos al proveedor
  amount              integer NOT NULL CHECK (amount >= 0),
  currency            char(3) NOT NULL DEFAULT 'CLP',
  status              text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED')),
  authorization_code  text,
  payment_method      text, -- p. ej. VD (débito), VN (crédito)
  card_last4          text,
  raw_response        jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id)
);
CREATE INDEX payments_order_idx ON payments (order_id);
CREATE INDEX payments_status_idx ON payments (status, created_at DESC);

-- Eventos recibidos de proveedores (webhooks/callbacks). UNIQUE => idempotencia.
CREATE TABLE payment_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id   uuid REFERENCES payments(id) ON DELETE SET NULL,
  provider     text NOT NULL,
  event_key    text NOT NULL, -- id del evento del proveedor o token+tipo
  event_type   text NOT NULL,
  payload      jsonb,
  result       text, -- APPLIED | DUPLICATE | REJECTED | ERROR
  error        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_key)
);

-- ---------------------------------------------------------------------
-- AUDITORÍA Y EVENTOS DE NAVEGACIÓN
-- ---------------------------------------------------------------------
CREATE TABLE audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES app_users(id) ON DELETE SET NULL,
  action     text NOT NULL, -- CREATED | UPDATED | DELETED | LOGIN | STATUS_CHANGED ...
  entity     text NOT NULL, -- BOOK | ORDER | PAYMENT | INVENTORY | USER ...
  entity_id  text,
  metadata   jsonb,
  ip         text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_entity_idx ON audit_log (entity, entity_id, created_at DESC);

-- Eventos de navegación (/api/events): base del funnel de conversión
CREATE TABLE analytics_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id text NOT NULL,
  event_type text NOT NULL, -- page_view | book_view | add_to_cart | checkout_start | ...
  page_path  text NOT NULL,
  button_id  text,
  book_id    uuid REFERENCES books(id) ON DELETE SET NULL,
  meta       jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_type_idx ON analytics_events (event_type, created_at);

-- ---------------------------------------------------------------------
-- Triggers updated_at
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['publishers', 'authors', 'collections', 'categories', 'books', 'app_users',
                           'customers', 'addresses', 'carts', 'cart_items', 'orders', 'payments']
  LOOP
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

CREATE TRIGGER inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION set_updated_at();
