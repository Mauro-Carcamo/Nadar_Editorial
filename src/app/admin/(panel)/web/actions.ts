"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import { query, transaction } from "@/lib/db";
import { slugify } from "@/services/catalog/admin-books";

// Acciones de "Editar web": contenido que se ve en el sitio (destacados del hero, colecciones,
// puntos de venta). Cada una verifica rol, valida con zod, audita y regenera el sitio.

const EDITOR_ROLES = ["super_admin", "admin", "editor"];

async function requireEditor(back: string) {
  const session = await getAdminSession();
  if (!session || !EDITOR_ROLES.includes(session.role)) redirect(`${back}?error=${encodeURIComponent("No tienes permisos para editar la web")}`);
  return session;
}

async function audit(userId: string, action: string, entity: string, entityId: string | null, metadata: Record<string, unknown>) {
  await query("INSERT INTO audit_log (user_id, action, entity, entity_id, metadata) VALUES ($1, $2, $3, $4, $5)", [
    userId,
    action,
    entity,
    entityId,
    JSON.stringify(metadata),
  ]);
}

const fail = (path: string, message: string): never => redirect(`${path}?error=${encodeURIComponent(message)}`);
const text = (max: number) => z.string().trim().max(max);

// ---------------------------------------------------------------- Destacados del hero
// El hero muestra los libros con ranking 1..10 (books.sales_rank), en ese orden.

export async function saveHeroBooks(formData: FormData) {
  const back = "/admin/web/destacados";
  const session = await requireEditor(back);
  const ids = z.array(z.string().uuid()).max(10, "Máximo 10 destacados").safeParse(formData.getAll("bookId").map(String));
  if (!ids.success) fail(back, ids.error.issues[0]?.message ?? "Selección inválida");
  await transaction(async (client) => {
    await client.query("UPDATE books SET sales_rank = NULL WHERE sales_rank IS NOT NULL");
    for (const [index, id] of ids.data!.entries()) {
      await client.query("UPDATE books SET sales_rank = $2 WHERE id = $1", [id, index + 1]);
    }
  });
  await audit(session.sub, "HERO_UPDATED", "HOME", null, { bookIds: ids.data });
  revalidatePath("/", "layout");
  redirect(`${back}?ok=1`);
}

// ---------------------------------------------------------------- Colecciones

const CollectionInput = z.object({
  id: z.string().uuid(),
  name: text(80).min(2, "El nombre es obligatorio"),
  description: text(600),
  intro: text(2000),
  series: z.array(text(80).min(1)).max(20),
  position: z.coerce.number().int().min(0).max(999),
});

export async function saveCollection(formData: FormData) {
  const back = "/admin/web/colecciones";
  const session = await requireEditor(back);
  const parsed = CollectionInput.safeParse({
    id: formData.get("id"),
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    intro: formData.get("intro") ?? "",
    series: String(formData.get("series") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    position: formData.get("position") ?? 0,
  });
  if (!parsed.success) fail(back, parsed.error.issues[0]?.message ?? "Revisa los campos");
  const v = parsed.data!;
  await query(
    "UPDATE collections SET name = $2, description = NULLIF($3, ''), intro = NULLIF($4, ''), series = $5, position = $6 WHERE id = $1",
    [v.id, v.name, v.description, v.intro, v.series, v.position],
  );
  await audit(session.sub, "UPDATED", "COLLECTION", v.id, { name: v.name });
  revalidatePath("/", "layout");
  redirect(`${back}?ok=${v.id}#c-${v.id}`);
}

// ---------------------------------------------------------------- Puntos de venta

const optionalUrl = z.union([z.literal(""), z.string().trim().url("URL inválida (incluye https://)").max(300)]);
const coord = (min: number, max: number, label: string) =>
  z.union([z.literal(""), z.coerce.number().min(min, `${label} fuera de Chile`).max(max, `${label} fuera de Chile`)]);

const PointInput = z.object({
  name: text(120).min(2, "El nombre es obligatorio"),
  address: text(200),
  comuna: text(80).min(2, "La comuna es obligatoria"),
  city: text(80).min(2, "La ciudad es obligatoria"),
  region: text(80).min(2, "Elige una región"),
  itinerant: z.boolean(),
  note: text(300),
  website: optionalUrl,
  instagram: text(80),
  lat: coord(-56, -17, "Latitud"),
  lng: coord(-110, -66, "Longitud"),
  position: z.coerce.number().int().min(0).max(999),
  active: z.boolean(),
});

function readPoint(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "");
  return PointInput.safeParse({
    name: get("name"),
    address: get("address"),
    comuna: get("comuna"),
    city: get("city"),
    region: get("region"),
    itinerant: formData.get("itinerant") === "on",
    note: get("note"),
    website: get("website"),
    instagram: get("instagram").replace(/^@/, ""),
    lat: get("lat").replace(",", "."),
    lng: get("lng").replace(",", "."),
    position: get("position") || 0,
    active: formData.get("active") === "on",
  });
}

export async function savePointOfSale(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const back = id ? `/admin/web/puntos-de-venta/${id}` : "/admin/web/puntos-de-venta";
  const session = await requireEditor(back);
  const parsed = readPoint(formData);
  if (!parsed.success) fail(back, parsed.error.issues[0]?.message ?? "Revisa los campos");
  const v = parsed.data!;
  const lat = v.lat === "" ? null : v.lat;
  const lng = v.lng === "" ? null : v.lng;
  const params = [v.name, v.address || null, v.comuna, v.city, v.region, v.itinerant, v.note || null, v.website || null,
    v.instagram || null, lat, lng, v.position, v.active];

  let pointId = id;
  if (id) {
    await query(
      `UPDATE points_of_sale SET name = $1, address = $2, comuna = $3, city = $4, region = $5, itinerant = $6, note = $7,
              website = $8, instagram = $9, lat = $10, lng = $11, position = $12, active = $13,
              precision = CASE WHEN $2::text IS NULL THEN 'city' ELSE 'address' END
       WHERE id = $14`,
      [...params, id],
    );
  } else {
    // Identificador único a partir del nombre y la comuna
    const base = slugify(`${v.name} ${v.comuna}`).slice(0, 80) || "punto";
    const { rows } = await query<{ id: string }>(
      `INSERT INTO points_of_sale (slug, name, address, comuna, city, region, itinerant, note, website, instagram, lat, lng, position, active, precision)
       VALUES ($14 || CASE WHEN EXISTS (SELECT 1 FROM points_of_sale WHERE slug = $14) THEN '-' || substr(md5(random()::text), 1, 4) ELSE '' END,
               $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CASE WHEN $2::text IS NULL THEN 'city' ELSE 'address' END)
       RETURNING id`,
      [...params, base],
    );
    pointId = rows[0].id;
  }
  await audit(session.sub, id ? "UPDATED" : "CREATED", "POINT_OF_SALE", pointId, { name: v.name });
  revalidatePath("/", "layout");
  redirect(`/admin/web/puntos-de-venta/${pointId}?ok=1`);
}

export async function deletePointOfSale(formData: FormData) {
  const back = "/admin/web/puntos-de-venta";
  const session = await requireEditor(back);
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) fail(back, "Punto de venta inválido");
  await query("DELETE FROM points_of_sale WHERE id = $1", [id.data]);
  await audit(session.sub, "DELETED", "POINT_OF_SALE", id.data!, {});
  revalidatePath("/", "layout");
  redirect(`${back}?ok=1`);
}
