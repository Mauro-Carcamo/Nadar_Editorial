import { CatalogSection } from "@/components/CatalogSection";
import { CollectionsSection } from "@/components/CollectionsSection";
import { HeroBooks } from "@/components/HeroBooks";
import { ManifestoSection } from "@/components/ManifestoSection";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getBestsellers } from "@/data/site";

export default function Home() {
  return (
    <MotionProvider>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <ScrollProgress />
      <SiteHeader />
      <main id="contenido" tabIndex={-1}>
        <HeroBooks books={getBestsellers(10)} />
        <ManifestoSection />
        <CollectionsSection />
        <CatalogSection />
      </main>
      <SiteFooter />
    </MotionProvider>
  );
}
