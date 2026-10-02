import Link from "next/link";
import { SocialLinks } from "@/components/SocialLinks";

const footerLinks = [
  { href: "/", label: "Inicio" },
  { href: "/libros", label: "Catálogo" },
  { href: "/colecciones", label: "Colecciones" },
  { href: "/proyecto", label: "Proyecto" },
  { href: "/contacto", label: "Contacto" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <p className="footer-name">Nadar Ediciones</p>
          <p className="footer-copy">Libros de arte y crítica para leer el presente.</p>
        </div>

        <nav className="footer-nav" aria-label="Navegación del pie de página">
          <p className="footer-heading">Explorar</p>
          <ul className="footer-links">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-social">
          <p className="footer-heading">Síguenos</p>
          <SocialLinks source="footer" ariaLabel="Redes sociales de Nadar Ediciones" />
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Nadar Ediciones. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
