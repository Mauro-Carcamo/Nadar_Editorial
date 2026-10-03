import { CatalogSection } from "@/components/CatalogSection";
import { CollectionsSection } from "@/components/CollectionsSection";
import { HeroBooks } from "@/components/HeroBooks";
import { HomeContactSection } from "@/components/HomeContactSection";
import { ManifestoSection } from "@/components/ManifestoSection";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { PointsOfSaleSection } from "@/components/points-of-sale/PointsOfSaleSection";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getBestsellers } from "@/services/catalog/repository";

export default async function Home() {
  const bestsellers = await getBestsellers(10);
  return (
    <MotionProvider>
      <ScrollProgress />
      <SiteHeader />
      <main id="contenido" tabIndex={-1}>
        <HeroBooks books={bestsellers} />
        {/* El manifiesto queda fijo de fondo solo dentro de este bloque: Colecciones lo cubre y ahí termina */}
        <div id="proyecto" className="home-pass">
          <ManifestoSection />
          <CollectionsSection />
        </div>
        <CatalogSection />
        <PointsOfSaleSection />
        <HomeContactSection />
      </main>
      <SiteFooter />
    </MotionProvider>
  );
}
