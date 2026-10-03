import { HeroCarousel } from "@/components/HeroCarousel";
import { Book } from "@/data/site";

type Props = {
  books: Book[];
};

export function HeroBooks({ books }: Props) {
  if (!books.length) return null;

  return (
    <section id="inicio" className="home-hero" aria-labelledby="home-hero-title">
      <h1 className="sr-only">Nadar Ediciones, editorial independiente</h1>
      <HeroCarousel books={books} />
    </section>
  );
}
