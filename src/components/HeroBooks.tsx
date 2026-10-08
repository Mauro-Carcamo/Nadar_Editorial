import { HeroCarousel } from "@/components/HeroCarousel";
import { Book } from "@/data/site";
import { getActiveCampaign } from "@/services/catalog/repository";

type Props = {
  books: Book[];
};

export async function HeroBooks({ books }: Props) {
  if (!books.length) return null;

  return (
    <section id="inicio" className="home-hero" aria-labelledby="home-hero-title">
      <h1 className="sr-only">Nadar Ediciones, editorial independiente</h1>
      <HeroCarousel books={books} campaign={await getActiveCampaign()} />
    </section>
  );
}
