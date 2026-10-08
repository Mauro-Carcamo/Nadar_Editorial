import { saveCampaign } from "./actions";

export type CampaignFormValues = {
  id?: string;
  name: string;
  slug: string;
  badgeLabel: string;
  headline: string;
  description: string;
  startsAt: string; // datetime-local en hora de Chile
  endsAt: string;
  isActive: boolean;
  showBanner: boolean;
};

/** Formulario de campaña (crear y editar). Las fechas se ingresan en hora de Chile. */
export function CampaignForm({ values, submitLabel }: { values: CampaignFormValues; submitLabel: string }) {
  return (
    <form action={saveCampaign} className="admin-form admin-discount-form">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
      <label>
        Nombre de la campaña
        <input name="name" defaultValue={values.name} required maxLength={80} placeholder="Cyber Week Nadar" />
      </label>
      <label>
        Identificador (URL)
        <input name="slug" defaultValue={values.slug} required maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="cyber-week-nadar" />
      </label>
      <label>
        Texto del círculo
        <input name="badgeLabel" defaultValue={values.badgeLabel} required maxLength={20} placeholder="Cyber" />
        <small>Se muestra como «50% Descuento Cyber» sobre cada portada.</small>
      </label>
      <label>
        Título del banner
        <input name="headline" defaultValue={values.headline} maxLength={80} placeholder="Cyber Week en Nadar" />
      </label>
      <label className="is-wide">
        Bajada del banner
        <input name="description" defaultValue={values.description} maxLength={160} placeholder="Hasta 50% de descuento en libros seleccionados" />
      </label>
      <label>
        Inicio (hora de Chile)
        <input type="datetime-local" name="startsAt" defaultValue={values.startsAt} required />
      </label>
      <label>
        Término (opcional)
        <input type="datetime-local" name="endsAt" defaultValue={values.endsAt} />
        <small>Vacío = sin fecha de término.</small>
      </label>
      <label className="admin-check">
        <input type="checkbox" name="isActive" defaultChecked={values.isActive} /> Campaña activa
      </label>
      <label className="admin-check">
        <input type="checkbox" name="showBanner" defaultChecked={values.showBanner} /> Mostrar banner junto a «Top 10 Destacados»
      </label>
      <div className="admin-form-actions is-wide">
        <button className="btn btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}
