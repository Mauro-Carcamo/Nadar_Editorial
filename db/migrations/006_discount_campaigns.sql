-- Campañas de descuento (Cyber, aniversario, etc.) y descuentos por libro.
-- Un libro tiene descuento vigente si su campaña está activa y la fecha actual cae entre
-- starts_at y ends_at (ends_at NULL = sin fecha de término). Si un libro está en varias campañas
-- vigentes se aplica el mayor porcentaje. El precio con descuento se calcula en el servidor
-- (catálogo, carrito y checkout); el precio de lista de books.price no se modifica.

CREATE TABLE discount_campaigns (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text NOT NULL UNIQUE,
  name         text NOT NULL,                 -- nombre interno y del banner: "Cyber Week Nadar"
  badge_label  text NOT NULL,                 -- texto del círculo rojo: "Descuento <badge_label>"
  headline     text,                          -- título del banner
  description  text,                          -- bajada del banner
  starts_at    timestamptz NOT NULL DEFAULT now(),
  ends_at      timestamptz,
  is_active    boolean NOT NULL DEFAULT true,
  show_banner  boolean NOT NULL DEFAULT true, -- muestra el banner junto a "Top 10 Destacados"
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);
CREATE TRIGGER discount_campaigns_updated_at BEFORE UPDATE ON discount_campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE book_discounts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid NOT NULL REFERENCES discount_campaigns(id) ON DELETE CASCADE,
  book_id      uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  percent      integer NOT NULL CHECK (percent BETWEEN 1 AND 90),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, book_id)
);
CREATE INDEX book_discounts_book_idx ON book_discounts (book_id);

-- Ejemplo permanente: Cyber Week Nadar con 3 libros (sin fecha de término; se edita en /admin/descuentos)
INSERT INTO discount_campaigns (slug, name, badge_label, headline, description, starts_at, ends_at)
VALUES ('cyber-week-nadar', 'Cyber Week Nadar', 'Cyber', 'Cyber Week en Nadar',
        'Hasta 50% de descuento en libros seleccionados', '2026-10-01 00:00:00-03', NULL);

INSERT INTO book_discounts (campaign_id, book_id, percent)
SELECT c.id, b.id, x.percent
FROM discount_campaigns c
CROSS JOIN (VALUES ('colonia-penal-de-ismael-rivera', 50),
                   ('la-culpa-de-gustavo-solorzano-alfaro', 30),
                   ('cartas-desde-argel-1882-de-karl-marx', 25)) AS x(slug, percent)
JOIN books b ON b.slug = x.slug
WHERE c.slug = 'cyber-week-nadar';
