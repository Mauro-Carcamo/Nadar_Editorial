"use client";

import type { ActiveCampaign } from "@/data/book-utils";

/** Evento que activa el filtro de la campaña en el catálogo (lo escucha CatalogBrowser). */
export const CAMPAIGN_FILTER_EVENT = "nadar:campaign-filter";

const dateFmt = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", timeZone: "America/Santiago" });

/**
 * Banner de la campaña vigente (p. ej. Cyber Week) junto a "Top 10 Destacados".
 * Solo negro, rojo y blanco, con la tipografía de Nadar y el mismo círculo rojo de las portadas.
 * Al hacer clic baja al catálogo con el filtro de libros en descuento activado.
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
      {/* Mismo círculo rojo de las portadas */}
      <span className="campaign-banner-percent" aria-hidden="true">
        <small>hasta</small>
        <strong>{campaign.maxPercent}%</strong>
      </span>
      <span className="campaign-banner-text">
        <span className="campaign-banner-title">
          <span className="campaign-banner-word">{campaign.label}</span>
          <span className="campaign-banner-week">{campaign.headline}</span>
        </span>
        <small>
          {campaign.description || `${campaign.bookCount} libros en descuento`} · {until}
        </small>
      </span>
      <span className="campaign-banner-cta" aria-hidden="true">
        Ver libros <span>→</span>
      </span>
    </a>
  );
}
