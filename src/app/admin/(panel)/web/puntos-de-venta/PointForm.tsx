import { REGION_ORDER } from "@/services/points-of-sale/repository";
import { savePointOfSale } from "../actions";

export type PointValues = {
  id?: string;
  name: string;
  address: string;
  comuna: string;
  city: string;
  region: string;
  itinerant: boolean;
  note: string;
  website: string;
  instagram: string;
  lat: string;
  lng: string;
  position: number;
  active: boolean;
};

/** Formulario de punto de venta (crear y editar). */
export function PointForm({ values, submitLabel }: { values: PointValues; submitLabel: string }) {
  const mapsQuery = encodeURIComponent([values.address, values.comuna, values.city, "Chile"].filter(Boolean).join(", "));
  return (
    <form action={savePointOfSale} className="admin-form admin-discount-form">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <label>
        Nombre de la librería
        <input name="name" defaultValue={values.name} required maxLength={120} />
      </label>
      <label>
        Región
        <select name="region" defaultValue={values.region} required>
          <option value="" disabled>
            Elige una región…
          </option>
          {REGION_ORDER.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label>
        Comuna
        <input name="comuna" defaultValue={values.comuna} required maxLength={80} />
      </label>
      <label>
        Ciudad
        <input name="city" defaultValue={values.city} required maxLength={80} />
      </label>
      <label className="is-wide">
        Dirección
        <input name="address" defaultValue={values.address} maxLength={200} placeholder="Vacío si es itinerante" />
      </label>
      <label>
        Latitud
        <input name="lat" defaultValue={values.lat} inputMode="decimal" placeholder="-33.4372" />
      </label>
      <label>
        Longitud
        <input name="lng" defaultValue={values.lng} inputMode="decimal" placeholder="-70.6506" />
        <small>
          Sin coordenadas no aparece en el mapa.{" "}
          <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noopener noreferrer">
            Buscar en Google Maps
          </a>{" "}
          (clic derecho en el punto → copiar coordenadas).
        </small>
      </label>
      <label>
        Sitio web
        <input name="website" defaultValue={values.website} type="url" placeholder="https://" maxLength={300} />
      </label>
      <label>
        Instagram
        <input name="instagram" defaultValue={values.instagram} placeholder="usuario (sin @)" maxLength={80} />
      </label>
      <label className="is-wide">
        Nota (horario, referencia…)
        <input name="note" defaultValue={values.note} maxLength={300} />
      </label>
      <label>
        Orden dentro de la región
        <input type="number" name="position" defaultValue={values.position} min={0} max={999} />
      </label>
      <label className="admin-check">
        <input type="checkbox" name="itinerant" defaultChecked={values.itinerant} /> Librería itinerante
      </label>
      <label className="admin-check">
        <input type="checkbox" name="active" defaultChecked={values.active} /> Visible en el sitio
      </label>
      <div className="admin-form-actions is-wide">
        <button className="btn btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
