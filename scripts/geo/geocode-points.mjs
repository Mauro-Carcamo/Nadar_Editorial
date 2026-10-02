// Geocodifica los puntos de venta una sola vez y guarda lat/lng en src/data/points-of-sale.json.
// Fuente: Nominatim (OpenStreetMap), sin API key. Política de uso: 1 consulta por segundo e identificarse.
// Solo completa los puntos sin coordenadas; para forzar uno, deja lat/lng en null.
//   node scripts/geo/geocode-points.mjs
import { readFile, writeFile } from "node:fs/promises";

const FILE = new URL("../../src/data/points-of-sale.json", import.meta.url);
const UA = "NadarEdiciones-geocoder/1.0 (contacto@nadarediciones.cl)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nominatim(params) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  for (const [k, v] of Object.entries({ format: "jsonv2", countrycodes: "cl", limit: "1", addressdetails: "1", ...params })) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "es" } });
  await sleep(1100);
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return (await res.json())[0] ?? null;
}

// "Merced 344, local 2 (Centro GAM)" -> "Merced 344"
const street = (address) => address.split(/,|\(/)[0].replace(/^Av\.\s*/i, "Avenida ").trim();

const points = JSON.parse(await readFile(FILE, "utf8"));
for (const p of points) {
  if (p.lat !== null && p.lng !== null) continue;
  let hit = null;
  let precision = "address";
  if (p.address) {
    hit = await nominatim({ street: street(p.address), city: p.comuna, country: "Chile" });
    if (!hit) hit = await nominatim({ q: `${street(p.address)}, ${p.comuna}, Chile` });
  }
  if (!hit) {
    // Itinerantes o dirección no encontrada: centro de la comuna (se marca como aproximado)
    hit = await nominatim({ q: `${p.comuna}, Chile` });
    precision = "city";
  }
  if (!hit) {
    console.warn("Sin resultado:", p.name);
    continue;
  }
  p.lat = Number(Number(hit.lat).toFixed(6));
  p.lng = Number(Number(hit.lon).toFixed(6));
  p.precision = precision;
  const found = hit.address ?? {};
  console.log(
    `${precision === "city" ? "~" : "✓"} ${p.name} → ${p.lat}, ${p.lng} · ${found.road ?? ""} ${found.house_number ?? ""} · ${found.city ?? found.town ?? found.suburb ?? ""} · ${found.state ?? ""}`,
  );
}
await writeFile(FILE, JSON.stringify(points, null, 2) + "\n", "utf8");
console.log("Listo:", points.filter((p) => p.lat !== null).length, "de", points.length, "con coordenadas");
