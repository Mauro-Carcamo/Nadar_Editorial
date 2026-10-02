import Link from "next/link";
import { dateTime } from "@/components/admin/format";
import { query } from "@/lib/db";
import { CONTACT_SUBJECTS } from "@/schemas/contact";
import { setMessageStatus } from "./actions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { NEW: "Nuevos", READ: "Leídos", ARCHIVED: "Archivados" };
const ACTIONS = [
  { status: "READ", label: "Marcar como leído" },
  { status: "ARCHIVED", label: "Archivar" },
  { status: "NEW", label: "Volver a nuevos" },
];

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const status = estado && estado in STATUS ? estado : "NEW";
  const { rows } = await query<{
    id: string;
    name: string;
    email: string;
    subject: keyof typeof CONTACT_SUBJECTS;
    message: string;
    status: string;
    created_at: Date;
  }>("SELECT id, name, email, subject, message, status, created_at FROM contact_messages WHERE status = $1 ORDER BY created_at DESC LIMIT 100", [
    status,
  ]);

  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">Atención</p>
        <h2>Mensajes de contacto</h2>
        <p className="admin-sub">Llegan desde el formulario de /contacto. Responde por correo y marca el mensaje como leído.</p>
      </header>
      <nav className="admin-filters" aria-label="Filtrar por estado">
        {Object.entries(STATUS).map(([k, v]) => (
          <Link key={k} href={`/admin/mensajes?estado=${k}`} className={status === k ? "is-active" : ""}>
            {v}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <ul className="admin-messages">
          {rows.map((m) => (
            <li key={m.id} className="admin-panel">
              <header>
                <strong>{m.name}</strong>
                <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: tu mensaje a Nadar Ediciones")}`}>{m.email}</a>
                <span className="admin-badge is-wait">{CONTACT_SUBJECTS[m.subject] ?? m.subject}</span>
                <small>{dateTime(m.created_at)}</small>
              </header>
              <p>{m.message}</p>
              <div className="admin-message-actions">
                {ACTIONS.filter((a) => a.status !== m.status).map((a) => (
                  <form key={a.status} action={setMessageStatus}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="status" value={a.status} />
                    <button className="btn btn-outline">{a.label}</button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-empty">No hay mensajes en esta bandeja.</p>
      )}
    </>
  );
}
