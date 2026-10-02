"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import { query } from "@/lib/db";

const Input = z.object({ id: z.string().uuid(), status: z.enum(["NEW", "READ", "ARCHIVED"]) });

/** Cambia el estado de un mensaje (formulario del panel). */
export async function setMessageStatus(formData: FormData) {
  const session = await getAdminSession();
  if (!session) return;
  const parsed = Input.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  await query("UPDATE contact_messages SET status = $2 WHERE id = $1", [parsed.data.id, parsed.data.status]);
  await query("INSERT INTO audit_log (user_id, action, entity, entity_id, metadata) VALUES ($1, 'STATUS_CHANGED', 'MESSAGE', $2, $3)", [
    session.sub,
    parsed.data.id,
    JSON.stringify({ status: parsed.data.status }),
  ]);
  revalidatePath("/admin/mensajes");
  revalidatePath("/admin");
}
