"use client";

import { socialLinks } from "@/data/site";
import { trackEvent } from "@/lib/analytics";

type Props = {
  source: "footer" | "contacto" | "home" | "proyecto";
  ariaLabel?: string;
  /** "icons": solo íconos grandes (el nombre queda para lectores de pantalla) */
  variant?: "default" | "icons";
};

function iconFor(name: string) {
  switch (name) {
    case "Facebook":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.6.4-1 1-1z" />
        </svg>
      );
    case "Instagram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5-2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
        </svg>
      );
    case "YouTube":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M23 12s0-3-1-4c-1-1-2-1-3-1H5C4 7 3 7 2 8c-1 1-1 4-1 4s0 3 1 4c1 1 2 1 3 1h14c1 0 2 0 3-1 1-1 1-4 1-4zM10 15V9l5 3-5 3z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M22 5.8c-.8.4-1.6.6-2.5.8.9-.6 1.5-1.4 1.8-2.4-.8.5-1.8.9-2.8 1.1A4.2 4.2 0 0 0 12 9v1C8.7 9.9 5.7 8.3 3.7 5.8a4.2 4.2 0 0 0 1.3 5.6c-.7 0-1.3-.2-1.9-.5v.1A4.2 4.2 0 0 0 6.4 15c-.6.2-1.3.2-2 .1A4.2 4.2 0 0 0 8.3 18a8.4 8.4 0 0 1-5.2 1.8H2a11.9 11.9 0 0 0 6.4 1.9c7.7 0 11.9-6.4 11.9-11.9v-.5c.8-.6 1.5-1.3 2-2.1z" />
        </svg>
      );
  }
}

export function SocialLinks({ source, ariaLabel = "Redes sociales", variant = "default" }: Props) {
  return (
    <div className={variant === "icons" ? "social-links social-links--icons" : "social-links"} aria-label={ariaLabel}>
      {socialLinks.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent({
              eventType: "social_click",
              pagePath: window.location.pathname,
              buttonId: `social_${social.name.toLowerCase()}`,
              meta: {
                source,
                social: social.name,
              },
            })
          }
        >
          <span className="social-icon">{iconFor(social.name)}</span>
          <span className={variant === "icons" ? "sr-only" : undefined}>{social.name}</span>
        </a>
      ))}
    </div>
  );
}
