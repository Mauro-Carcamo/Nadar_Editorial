import Image from "next/image";
import Link from "next/link";
import { CartButton } from "@/components/cart/CartButton";
import { HeaderScroll } from "@/components/HeaderScroll";
import { HOME_SECTIONS, sectionHref } from "@/data/navigation";

// El menú lleva a las secciones del home (no a páginas aparte)
const navItems = HOME_SECTIONS.map((s) => ({ href: sectionHref(s.id), label: s.label, id: s.id }));

// Cabecera minimal: logo, menú y carrito. Las redes sociales viven en el footer.
export function SiteHeader() {
  return (
    <header className="site-header">
      <HeaderScroll />
      <nav className="nav-wrap" aria-label="Navegación principal">
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
              <Link href={item.href} data-section={item.id}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <CartButton />

        <details className="mobile-nav">
          <summary>
            <span>Menú</span>
          </summary>
          <div className="mobile-sheet">
            <ul className="menu mobile-menu-list">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} data-section={item.id}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </nav>

      {/* Ola de marca: una sola capa suave */}
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
            <use href="#gentle-wave" x="48" y="3" fill="rgba(160, 201, 200, 0.45)" />
            <use href="#gentle-wave" x="48" y="7" fill="#ffffff" />
          </g>
        </svg>
      </div>
    </header>
  );
}
