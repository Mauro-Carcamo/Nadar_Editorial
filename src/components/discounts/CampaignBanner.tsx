"use client";

import type { ActiveCampaign } from "@/data/book-utils";

/** Evento que activa el filtro de la campaña en el catálogo (lo escucha CatalogBrowser). */
export const CAMPAIGN_FILTER_EVENT = "nadar:campaign-filter";

const dateFmt = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", timeZone: "America/Santiago" });

/**
 * Banner de la campaña vigente (p. ej. Cyber Week) junto a "Top 10 Destacados".
 * Estética Cyber de Chile: fondo azul noche, magenta y cian eléctricos. Al hacer clic baja al
 * catálogo con el filtro de libros en descuento activado.
 */
export function CampaignBanner({ campaign }: { campaign: ActiveCampaign }) {
  const until = campaign.endsAt ? `Hasta el ${dateFmt.format(new Date(campaign.endsAt))}` : "Por tiempo limitado";

  return (
    <a
      href="#catalogo"
      className="campaign-banner"
      onClick={() => window.dispatchEvent(new CustomEvent(CAMPAIGN_FILTER_EVENT))}
      aria-label={`${campaign.headline}: hasta ${campaign.maxPercent}% de descuento. Ver libros en descuento`}
    >
      <span className="campaign-banner-word" aria-hidden="true">
        {campaign.label}
      </span>
      <span className="campaign-banner-text">
        <strong>{campaign.headline}</strong>
        <small>
          {campaign.description || `${campaign.bookCount} libros en descuento`} · {until}
        </small>
      </span>
      <span className="campaign-banner-percent" aria-hidden="true">
        <small>hasta</small>
        {campaign.maxPercent}%
      </span>
      <span className="campaign-banner-cta" aria-hidden="true">
        Ver libros →
      </span>
    </a>
  );
}
