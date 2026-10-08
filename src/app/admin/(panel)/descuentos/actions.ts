"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import { query } from "@/lib/db";

// Acciones del panel de descuentos (campañas y libros con descuento).
// Cada una vuelve a verificar la sesión y el rol, valida con zod y deja registro en audit_log.

const CATALOG_ROLES = ["super_admin", "admin", "editor"];

async function requireEditor() {
  const session = await getAdminSession();
  if (!session || !CATALOG_ROLES.includes(session.role)) redirect("/admin/descuentos?error=permisos");
  return session;
}

async function audit(userId: string, action: string, entityId: string, metadata: Record<string, unknown>) {
  await query("INSERT INTO audit_log (user_id, action, entity, entity_id, metadata) VALUES ($1, $2, 'DISCOUNT_CAMPAIGN', $3, $4)", [
    userId,
    action,
    entityId,
    JSON.stringify(metadata),
  ]);
}

/** El descuento se ve en todo el sitio (hero, catálogo, colecciones, fichas): se regenera completo. */
function revalidateStore(campaignId?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/admin/descuentos");
  if (campaignId) revalidatePath(`/admin/descuentos/${campaignId}`);
}

const text = (max: number) => z.string().trim().max(max);
// "2026-10-01T00:00" (datetime-local), en hora de Chile
const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Fecha inválida");

const CampaignInput = z
  .object({
    name: text(80).min(3, "El nombre es obligatorio"),
    slug: text(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones"),
    badgeLabel: text(20).min(2, "La etiqueta es obligatoria"),
    headline: text(80),
    description: text(160),
    startsAt: localDateTime,
    endsAt: z.union([localDateTime, z.literal("")]),
    isActive: z.boolean(),
    showBanner: z.boolean(),
  })
  .refine((v) => !v.endsAt || v.endsAt > v.startsAt, { message: "El término debe ser posterior al inicio", path: ["endsAt"] });

function readCampaign(formData: FormData) {
  return CampaignInput.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    badgeLabel: formData.get("badgeLabel") ?? "",
    headline: formData.get("headline") ?? "",
    description: formData.get("description") ?? "",
    startsAt: formData.get("startsAt") ?? "",
    endsAt: formData.get("endsAt") ?? "",
    isActive: formData.get("isActive") === "on",
    showBanner: formData.get("showBanner") === "on",
  });
}

const fail = (path: string, message: string): never => redirect(`${path}?error=${encodeURIComponent(message)}`);

/** Crea (sin id) o actualiza una campaña. */
export async function saveCampaign(formData: FormData) {
  const session = await requireEditor();
  const id = String(formData.get("id") ?? "");
  const back = id ? `/admin/descuentos/${id}` : "/admin/descuentos";
  const parsed = readCampaign(formData);
  if (!parsed.success) fail(back, parsed.error.issues[0]?.message ?? "Revisa los campos");
  const v = parsed.data!;
  const params = [v.name, v.slug, v.badgeLabel, v.headline || null, v.description || null, v.startsAt, v.endsAt || null, v.isActive, v.showBanner];

  let campaignId = id;
  try {
    if (id) {
      await query(
        `UPDATE discount_campaigns SET name = $1, slug = $2, badge_label = $3, headline = $4, description = $5,
                starts_at = $6::timestamp AT TIME ZONE 'America/Santiago',
                ends_at = $7::timestamp AT TIME ZONE 'America/Santiago', is_active = $8, show_banner = $9
         WHERE id = $10`,
        [...params, id],
      );
    } else {
      const { rows } = await query<{ id: string }>(
        `INSERT INTO discount_campaigns (name, slug, badge_label, headline, description, starts_at, ends_at, is_active, show_banner)
         VALUES ($1, $2, $3, $4, $5, $6::timestamp AT TIME ZONE 'America/Santiago',
                 $7::timestamp AT TIME ZONE 'America/Santiago', $8, $9)
         RETURNING id`,
        params,
      );
      campaignId = rows[0].id;
    }
  } catch (error) {
    const message = (error as { code?: string }).code === "23505" ? "Ya existe una campaña con ese identificador" : "No se pudo guardar la campaña";
    fail(back, message);
  }
  await audit(session.sub, id ? "UPDATED" : "CREATED", campaignId, { name: v.name, slug: v.slug });
  revalidateStore(campaignId);
  redirect(`/admin/descuentos/${campaignId}?ok=1`);
}

export async function deleteCampaign(formData: FormData) {
  const session = await requireEditor();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) fail("/admin/descuentos", "Campaña inválida");
  await query("DELETE FROM discount_campaigns WHERE id = $1", [id.data]);
  await audit(session.sub, "DELETED", id.data!, {});
  revalidateStore();
  redirect("/admin/descuentos?ok=1");
}

const BookDiscountInput = z.object({
  campaignId: z.string().uuid(),
  bookId: z.string().uuid("Elige un libro"),
  percent: z.coerce.number().int("El porcentaje debe ser entero").min(1, "Mínimo 1%").max(90, "Máximo 90%"),
});

/** Agrega un libro a la campaña o cambia su porcentaje. */
export async function setBookDiscount(formData: FormData) {
  const session = await requireEditor();
  const campaignId = String(formData.get("campaignId") ?? "");
  const parsed = BookDiscountInput.safeParse({
    campaignId,
    bookId: formData.get("bookId"),
    percent: formData.get("percent"),
  });
  if (!parsed.success) fail(`/admin/descuentos/${campaignId}`, parsed.error.issues[0]?.message ?? "Revisa el descuento");
  const v = parsed.data!;
  await query(
    `INSERT INTO book_discounts (campaign_id, book_id, percent) VALUES ($1, $2, $3)
     ON CONFLICT (campaign_id, book_id) DO UPDATE SET percent = EXCLUDED.percent`,
    [v.campaignId, v.bookId, v.percent],
  );
  await audit(session.sub, "BOOK_DISCOUNT_SET", v.campaignId, { bookId: v.bookId, percent: v.percent });
  revalidateStore(v.campaignId);
  redirect(`/admin/descuentos/${v.campaignId}?ok=1`);
}

export async function removeBookDiscount(formData: FormData) {
  const session = await requireEditor();
  const campaignId = String(formData.get("campaignId") ?? "");
  const ids = z.object({ campaignId: z.string().uuid(), bookId: z.string().uuid() }).safeParse({
    campaignId,
    bookId: formData.get("bookId"),
  });
  if (!ids.success) fail(`/admin/descuentos/${campaignId}`, "Libro inválido");
  await query("DELETE FROM book_discounts WHERE campaign_id = $1 AND book_id = $2", [ids.data!.campaignId, ids.data!.bookId]);
  await audit(session.sub, "BOOK_DISCOUNT_REMOVED", ids.data!.campaignId, { bookId: ids.data!.bookId });
  revalidateStore(ids.data!.campaignId);
  redirect(`/admin/descuentos/${ids.data!.campaignId}?ok=1`);
}
