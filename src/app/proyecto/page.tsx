import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Proyecto editorial | Nadar Ediciones",
  description:
    "Nadar Ediciones es un impulso creativo e intelectual surgido en el sur del continente americano en la primavera de 2014.",
};

// Textos del sitio original (nadarediciones.cl/proyecto y /amistad)
const TEAM = [
  {
    name: "Diego Mellado Gómez",
    role: "Director editorial",
    bio: "Doctor en Estudios Americanos, especialidad Pensamiento y Cultura, por el Instituto de Estudios Avanzados de la Universidad de Santiago. Licenciado en Filosofía por la Universidad de Chile, donde también se formó como editor, y realizó cursos de cosmología y astrobiología en el Observatorio Astronómico Nacional.",
  },
  {
    name: "David Bascur Astroza",
    role: "Naturalismo, historia y educación",
    bio: "Profesor de Historia, Geografía y Educación Cívica (UMCE), especializado en educación y derechos humanos.",
  },
  {
    name: "Claudio Chávez Argandoña",
    role: "Narrativa y poesía",
    bio: "Licenciado en Lengua y Literatura Hispánica de la Universidad de Chile, dedicado también a la agricultura urbana en Cooperativa Chakrana.",
  },
  {
    name: "Carlos Arce Abarca",
    role: "Filosofía, patrimonio y literatura",
    bio: "Profesor de Filosofía formado en la Universidad de Chile.",
  },
  {
    name: "Adriano Skoda",
    role: "Asesoría editorial",
    bio: "Geógrafo y profesor de geografía formado en la Universidad de São Paulo, Brasil. Dirige el proyecto editorial Entremares.",
  },
  {
    name: "Aerolo Nebulaes",
    role: "Proyectos gráficos",
    bio: "Pintor y diseñador gráfico formado en la sede de Antofagasta de la Universidad de Chile.",
  },
  {
    name: "Camilo Terán",
    role: "Ilustración",
    bio: "Licenciado en Artes Plásticas de la Universidad de Chile.",
  },
];

const FRIENDS = [
  {
    name: "Editorial Eleuterio",
    country: "Chile",
    text: "Proyecto del Grupo de Estudios José Domingo Gómez Rojas enfocado a la edición de bibliografía ácrata.",
  },
  { name: "Entremares", country: "Brasil", text: "Desde São Paulo, ediciones independientes dedicadas al pensamiento social de ayer y hoy." },
  { name: "Oxímoron", country: "Chile", text: "Catálogo de dramaturgia, ensayo, narrativa, poesía y gráfica experimental." },
  { name: "Alter Ediciones", country: "Uruguay", text: "Ensayo, narrativa, historia social y política, fotografía y libros para niñes." },
  {
    name: "Pez en el hielo ediciones",
    country: "Uruguay",
    text: "Exploración literaria mediante un catálogo de narrativa y poesía contemporánea.",
  },
  {
    name: "Una temporada en Isla Negra",
    country: "Chile",
    text: "Desde un taller artesanal en el litoral central: poesía, narrativa e historia local.",
  },
  {
    name: "Editorial Universidad Nacional (EUNA)",
    country: "Costa Rica",
    text: "Proyecto académico y pedagógico de Centroamérica y el Caribe, con quien hemos co-editado.",
  },
  { name: "EUNED", country: "Costa Rica", text: "Universidad Estatal a Distancia: un completo catálogo de Humanidades y Ciencias." },
];

export default function ProyectoPage() {
  return (
    <>
      <SiteHeader />
      <main className="about-page">
        <section className="container about-hero">
          <div>
            <p className="home-hero-eyebrow">Proyecto editorial</p>
            <h1 className="home-collections-heading">Un proceso editorial</h1>
            <p className="about-lead">
              Nadar Ediciones es un impulso creativo e intelectual surgido en el sur del continente americano una
              primavera de 2014.
            </p>
          </div>
          <figure className="about-hero-photo">
            <Image
              src="/images/page/nadar-globo.jpg"
              alt="Gaspard-Félix Tournachon, «Nadar», en la canasta de un globo"
              fill
              sizes="(min-width: 900px) 40vw, 90vw"
              priority
            />
            <figcaption>Gaspard-Félix Tournachon, «Nadar» (c. 1863). Dominio público.</figcaption>
          </figure>
        </section>

        <section className="container about-section" aria-labelledby="vision-title">
          <h2 id="vision-title">Visión editorial</h2>
          <div className="about-text">
            <p>
              Su nombre alude tanto a la actividad misma de nadar como al apelativo con el que fuera conocido el
              fotógrafo y aeronauta Gaspard-Félix Tournachon (1820-1910), recordado como uno de los pioneros de la
              técnica fotográfica y por la serie de retratos que en el siglo XIX inmortalizaron los rostros de los
              hermanos Reclus, Caroline Rémy de Guebhard (Séverine), Charles Baudelaire, Émile Zola, Piotr Kropotkin y
              Mijaíl Bakunin, entre otras figuras del librepensamiento.
            </p>
            <p>
              Nuestro catálogo surge colectivamente, desde la autonomía y la colaboración. Buscamos aportar a la
              densidad del pensamiento, debatiendo perspectivas críticas e impulsando la socialización y autogestión
              del conocimiento. Exploramos distintos escorzos de la expresión humana, orientando nuestro quehacer
              editorial como hábito y como práctica de la libertad.
            </p>
            <p>
              En tal sentido, Nadar Ediciones no es un proyecto editorial, sino un proceso editorial. La edición de
              libros no se define en términos comerciales ni mide la calidad de una obra por su impacto mediático; la
              divulgación de libros es un modo de relación entre las personas, que genera vínculos en base al diálogo y
              contra todo dogmatismo, desafiando las fronteras y prejuicios heredados.
            </p>
          </div>
        </section>

        <section className="container about-section" aria-labelledby="porque-title">
          <h2 id="porque-title">¿Por qué Nadar?</h2>
          <div className="about-text">
            <p>
              Para nosotros, «Nadar» refiere a ese tránsito amplio, holgura del mar y de los cielos, hundida en el
              horizonte que se funde en lo siempre incógnito. Confuso como un pez volador, medio pájaro, medio pez,
              indeciso entre la libertad oceánica o del casco celeste. Solo una duda se nos disipa: aquella que se
              remite al impulso hacia la libertad, que se construye entre saltos, alas y aletas.
            </p>
            <p>
              La experiencia de los libros, al igual que el pez volador, guarda el misterio de la lectura: es una
              vivencia que se pierde en los océanos personales del lector y que luego se dispara por los aires de su
              pensamiento y habla.
            </p>
            <p>
              La aventura comienza durante la primavera del hemisferio sur, año 2014, cuando acontece el equinoccio
              vernal. Comienzan las vibraciones de los insectos y las aves, que pronto esparcirán el polen y las
              semillas por regiones diversas. Seguramente, el comportamiento de ciertos libros es similar al de un
              insecto, polinizador del pensamiento.
            </p>
          </div>
        </section>

        <section className="container about-section" aria-labelledby="equipo-title">
          <h2 id="equipo-title">Equipo editorial</h2>
          <ul className="about-team">
            {TEAM.map((person) => (
              <li key={person.name}>
                <h3>{person.name}</h3>
                <p className="about-role">{person.role}</p>
                <p>{person.bio}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="container about-section" aria-labelledby="amistad-title">
          <h2 id="amistad-title">Amistad</h2>
          <div>
          <div className="about-text">
            <p>
              Nadar Ediciones es parte de una constelación editorial vinculada por principios como la autonomía, la
              creatividad y la amistad. Algunos proyectos que inspiran este ímpetu a lo largo del continente:
            </p>
          </div>
          <ul className="about-friends">
            {FRIENDS.map((f) => (
              <li key={f.name}>
                <h3>
                  {f.name} <span>{f.country}</span>
                </h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
          </div>
        </section>

        <div className="container about-cta">
          <Link className="btn btn-primary" href="/libros">
            Ver el catálogo
          </Link>
          <Link className="btn btn-outline" href="/colecciones">
            Conocer las colecciones
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
