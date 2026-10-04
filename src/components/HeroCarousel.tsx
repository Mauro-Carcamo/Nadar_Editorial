"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { A11y, Autoplay, Keyboard, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { splitTitle } from "@/data/book-utils";
import { Book, getCover } from "@/data/site";

export function HeroCarousel({ books }: { books: Book[] }) {
  // Avanza solo cada 4 s (se pausa con el mouse encima); sin avance automático con "reducir movimiento"
  const reduceMotion = useReducedMotion();

  return (
    <>
      {/* Entrada del hero al cargar: los libros suben y aparecen */}
      {/* Franja continua del color de las tarjetas: solo se mueven los libros y su texto */}
      <motion.div
        className="home-hero-band"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <Swiper
          className="container home-hero-carousel"
          modules={[A11y, Autoplay, Keyboard, Pagination]}
          // Puntos de posición: solo se muestran en celular (CSS)
          pagination={{ el: ".home-hero-pagination", clickable: true }}
          autoplay={reduceMotion ? false : { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          speed={900}
          watchSlidesProgress
          roundLengths
          keyboard={{ enabled: true, onlyInViewport: true }}
          a11y={{ prevSlideMessage: "Libro anterior", nextSlideMessage: "Libro siguiente" }}
          centeredSlides
          loop
          slidesPerView="auto"
          spaceBetween={16}
          breakpoints={{
            640: { spaceBetween: 24 },
            1024: { spaceBetween: 40 },
          }}
        >
          {books.map((book, index) => {
            const cover = getCover(book);
            return (
            <SwiperSlide key={book.slug} className="home-hero-slide" tag="article">
              <Link href={`/libros/${book.slug}`} className="home-hero-slide-link">
                {/* Portada plana centrada sobre un marco claro */}
                <span className={`home-hero-slide-cover${cover.flat ? " is-flat" : ""}`}>
                  <Image
                    src={cover.src}
                    alt={`Portada de ${book.title}, de ${book.subtitle}`}
                    width={cover.width}
                    height={cover.height}
                    sizes="(min-width: 640px) 480px, 80vw"
                    priority={index < 3}
                  />
                </span>
                <span className="home-hero-slide-caption">
                  <span className="home-hero-rank" aria-label={`Puesto ${index + 1}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="home-hero-slide-text">
                    <span className="home-hero-slide-title">{splitTitle(book.title).main}</span>
                  </span>
                </span>
              </Link>
            </SwiperSlide>
            );
          })}
        </Swiper>
        <div className="home-hero-pagination" />
      </motion.div>

      <motion.div
        className="container home-hero-head"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.05, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <p className="home-hero-eyebrow">Top {books.length}</p>
          <h2 id="home-hero-title" className="home-hero-heading">
            Destacados
          </h2>
        </div>
      </motion.div>
    </>
  );
}
