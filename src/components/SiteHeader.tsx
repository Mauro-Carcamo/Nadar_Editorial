import Image from "next/image";
import Link from "next/link";
import { CartButton } from "@/components/cart/CartButton";
import { socialLinks } from "@/data/site";

const navItems = [
  { href: "/proyecto", label: "Proyecto" },
  { href: "/colecciones", label: "Colecciones" },
  { href: "/libros", label: "Catálogo" },
  { href: "/contacto", label: "Contacto" },
];

function SocialIcon({ name }: { name: string }) {
  if (name === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.6.4-1 1-1z" />
      </svg>
    );
  }
  if (name === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5-2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
      </svg>
    );
  }
  if (name === "YouTube") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M23 12s0-3-1-4c-1-1-2-1-3-1H5C4 7 3 7 2 8c-1 1-1 4-1 4s0 3 1 4c1 1 2 1 3 1h14c1 0 2 0 3-1 1-1 1-4 1-4zM10 15V9l5 3-5 3z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M22 5.8c-.8.4-1.6.6-2.5.8.9-.6 1.5-1.4 1.8-2.4-.8.5-1.8.9-2.8 1.1A4.2 4.2 0 0 0 12 9v1C8.7 9.9 5.7 8.3 3.7 5.8a4.2 4.2 0 0 0 1.3 5.6c-.7 0-1.3-.2-1.9-.5v.1A4.2 4.2 0 0 0 6.4 15c-.6.2-1.3.2-2 .1A4.2 4.2 0 0 0 8.3 18a8.4 8.4 0 0 1-5.2 1.8H2a11.9 11.9 0 0 0 6.4 1.9c7.7 0 11.9-6.4 11.9-11.9v-.5c.8-.6 1.5-1.3 2-2.1z" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="nav-wrap" aria-label="Navegacion principal">
        <Link className="brand" href="/">
          <Image
            src="/images/logo/nadar-logo.jpg"
            alt="Logo Nadar Ediciones"
            width={400}
            height={111}
            className="brand-logo"
            priority
          />
        </Link>

        <ul className="menu desktop-menu">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>

        <div className="nav-social-icons" aria-label="Redes sociales">
          {socialLinks.map((social) => (
            <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer">
              <SocialIcon name={social.name} />
              <span className="sr-only">{social.name}</span>
            </a>
          ))}
        </div>

        <CartButton />

        <details className="mobile-nav">
          <summary>
            <span>Menú</span>
          </summary>
          <div className="mobile-sheet">
            <ul className="menu mobile-menu-list">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </nav>

      <div className="header-waves" aria-hidden="true">
        <svg
          className="waves waves--top"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 24 150 28"
          preserveAspectRatio="none"
          shapeRendering="auto"
        >
          <defs>
<path
              id="gentle-wave"
              d="M-160 44c30 0 58-12 88-12s58 12 88 12 58-12 88-12 58 12 88 12v44h-352z"
            />
          </defs>
          <g className="parallax">
            <use href="#gentle-wave" x="48" y="0" fill="rgba(160, 201, 200, 0.75)" />
            <use href="#gentle-wave" x="48" y="3" fill="rgba(120, 171, 184, 0.8)" />
            <use href="#gentle-wave" x="48" y="5" fill="rgba(113, 158, 190, 0.85)" />
            <use href="#gentle-wave" x="48" y="7" fill="#ffffff" />
          </g>
        </svg>
      </div>
    </header>
  );
}
