import { cache } from "react";
import { isDatabaseConfigured, query } from "@/lib/db";

// Puntos de venta para el sitio (solo servidor). Fuente: PostgreSQL; respaldo: src/data/points-of-sale.json.

export type PointOfSale = {
  slug: string;
  name: string;
  address: string | null;
  comuna: string;
  city: string;
  region: string;
  itinerant: boolean;
  note: string | null;
  website: string | null;
  instagram: string | null;
  lat: number;
  lng: number;
  precision: "address" | "city";
  position: number;
};

// Orden geográfico, de norte a sur
export const REGION_ORDER = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes",
];

const regionRank = (r: string) => {
  const i = REGION_ORDER.indexOf(r);
  return i === -1 ? REGION_ORDER.length : i;
};

export const listPointsOfSale = cache(async (): Promise<PointOfSale[]> => {
  let points: PointOfSale[];
  if (isDatabaseConfigured()) {
    points = (
      await query<PointOfSale & { position: number }>(
        `SELECT slug, name, address, comuna, city, region, itinerant, note, website, instagram, lat, lng, precision, position
         FROM points_of_sale WHERE active AND lat IS NOT NULL AND lng IS NOT NULL`,
      )
    ).rows;
  } else {
    const data = (await import("@/data/points-of-sale.json")).default as PointOfSale[];
    points = data.filter((p) => p.lat !== null && p.lng !== null);
  }
  return points.sort((a, b) => regionRank(a.region) - regionRank(b.region) || a.position - b.position);
});
