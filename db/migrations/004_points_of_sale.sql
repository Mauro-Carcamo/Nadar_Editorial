-- Puntos de venta (librerías que venden libros Nadar). Coordenadas geocodificadas una vez
-- (scripts/geo/geocode-points.mjs) y guardadas: el mapa no consulta geocodificadores en cada visita.
CREATE TABLE points_of_sale (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  address     text,                       -- NULL = librería itinerante
  comuna      text NOT NULL,
  city        text NOT NULL,
  region      text NOT NULL,              -- región administrativa de Chile
  itinerant   boolean NOT NULL DEFAULT false,
  note        text,
  website     text,
  instagram   text,
  lat         double precision CHECK (lat BETWEEN -56 AND -17),
  lng         double precision CHECK (lng BETWEEN -110 AND -66),
  precision   text NOT NULL DEFAULT 'address' CHECK (precision IN ('address', 'city')),
  active      boolean NOT NULL DEFAULT true,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX points_of_sale_region_idx ON points_of_sale (region, position);

CREATE TRIGGER points_of_sale_updated_at BEFORE UPDATE ON points_of_sale
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
