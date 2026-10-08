import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { deletePointOfSale } from "../../actions";
import { PointForm } from "../PointForm";

export const dynamic = "force-dynamic";

export default async function AdminPointPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const point = (
    await query<{
      id: string;
      name: string;
      address: string | null;
      comuna: string;
      city: string;
      region: string;
      itinerant: boolean;
      note: string | null;
      website: string | null;
      instagram: string | null;
      lat: number | null;
      lng: number | null;
      position: number;
      active: boolean;
    }>("SELECT * FROM points_of_sale WHERE id = $1", [id])
  ).rows[0];
  if (!point) notFound();

  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">
          <Link href="/admin/web">Editar web</Link> / <Link href="/admin/web/puntos-de-venta">Puntos de venta</Link>
        </p>
        <h2>{point.name}</h2>
      </header>
      {error ? <p className="admin-error">{decodeURIComponent(error)}</p> : null}
      {ok ? <p className="admin-ok">Cambios guardados.</p> : null}

      <section className="admin-panel">
        <PointForm
          submitLabel="Guardar cambios"
          values={{
            id: point.id,
            name: point.name,
            address: point.address ?? "",
            comuna: point.comuna,
            city: point.city,
            region: point.region,
            itinerant: point.itinerant,
            note: point.note ?? "",
            website: point.website ?? "",
            instagram: point.instagram ?? "",
            lat: point.lat === null ? "" : String(point.lat),
            lng: point.lng === null ? "" : String(point.lng),
            position: point.position,
            active: point.active,
          }}
        />
      </section>

      <form action={deletePointOfSale} className="admin-danger-zone">
        <input type="hidden" name="id" value={point.id} />
        <button className="btn btn-outline pill-danger">Eliminar punto de venta</button>
        <small>Para ocultarlo sin borrarlo, desmarca «Visible en el sitio».</small>
      </form>
    </>
  );
}
