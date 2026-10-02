import { CatalogSection } from "@/components/CatalogSection";
import { CollectionsSection } from "@/components/CollectionsSection";
import { HeroBooks } from "@/components/HeroBooks";
import { ManifestoSection } from "@/components/ManifestoSection";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getBestsellers } from "@/services/catalog/repository";

export default async function Home() {
  const bestsellers = await getBestsellers(10);
  return (
    <MotionProvider>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <ScrollProgress />
      <SiteHeader />
      <main id="contenido" tabIndex={-1}>
        <HeroBooks books={bestsellers} />
        <ManifestoSection />
        <CollectionsSection />
        <CatalogSection />
      </main>
      <SiteFooter />
    </MotionProvider>
  );
}
