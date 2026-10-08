import Link from "next/link";
import { query } from "@/lib/db";
import { REGION_ORDER } from "@/services/points-of-sale/repository";
import { PointForm } from "./PointForm";

export const dynamic = "force-dynamic";

type Row = { id: string; name: string; comuna: string; region: string; active: boolean; has_coords: boolean; itinerant: boolean };

export default async function AdminPointsPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { error, ok } = await searchParams;
  const { rows } = await query<Row>(
    `SELECT id, name, comuna, region, active, itinerant, (lat IS NOT NULL AND lng IS NOT NULL) AS has_coords
     FROM points_of_sale ORDER BY position, name`,
  );
  const regions = [...new Set(rows.map((r) => r.region))].sort(
    (a, b) => (REGION_ORDER.indexOf(a) + 1 || 99) - (REGION_ORDER.indexOf(b) + 1 || 99),
  );

  return (
    <>
      <header className="admin-head admin-head-row">
        <div>
          <p className="eyebrow">
            <Link href="/admin/web">Editar web</Link>
          </p>
          <h2>Puntos de venta</h2>
          <p className="admin-sub">Librerías del mapa del inicio, agrupadas por región de norte a sur.</p>
        </div>
        <Link className="btn btn-outline" href="/#puntos-de-venta" target="_blank">
          Ver en el sitio
        </Link>
      </header>
      {error ? <p className="admin-error">{decodeURIComponent(error)}</p> : null}
      {ok ? <p className="admin-ok">Cambios guardados.</p> : null}

      <div className="admin-points">
        {regions.map((region) => (
          <section key={region} className="admin-panel">
            <h3>{region}</h3>
            <ul>
              {rows
                .filter((r) => r.region === region)
                .map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/web/puntos-de-venta/${p.id}`}>
                      <strong>{p.name}</strong>
                    </Link>
                    <small>{p.itinerant ? "Itinerante" : p.comuna}</small>
                    {!p.active ? <span className="admin-badge is-bad">Oculto</span> : null}
                    {!p.has_coords ? <span className="admin-badge is-wait">Sin ubicación</span> : null}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="admin-panel admin-discount-new">
        <h3>Nuevo punto de venta</h3>
        <PointForm
          submitLabel="Crear punto de venta"
          values={{
            name: "",
            address: "",
            comuna: "",
            city: "",
            region: "",
            itinerant: false,
            note: "",
            website: "",
            instagram: "",
            lat: "",
            lng: "",
            position: 0,
            active: true,
          }}
        />
      </section>
    </>
  );
}
