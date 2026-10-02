"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Book, getCover } from "@/data/site";

export function HeroCarousel({ books }: { books: Book[] }) {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const syncEdges = (s: SwiperInstance) => setEdges({ start: s.isBeginning, end: s.isEnd });

  return (
    <>
      {/* Entrada del hero al cargar: los libros suben y aparecen */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <Swiper
          className="container home-hero-carousel"
          modules={[A11y, Keyboard]}
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
          onSwiper={(s) => {
            setSwiper(s);
            syncEdges(s);
          }}
          onSlideChange={syncEdges}
          onResize={syncEdges}
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
                    <span className="home-hero-slide-title">{book.title}</span>
                    <span className="home-hero-slide-author">{book.subtitle}</span>
                  </span>
                </span>
              </Link>
            </SwiperSlide>
            );
          })}
        </Swiper>
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
            Los más vendidos
          </h2>
        </div>
        <div className="home-hero-controls">
          <Link href="/libros" className="text-link">
            Ver catálogo
          </Link>
          <button
            type="button"
            className="home-hero-nav"
            aria-label="Libros anteriores"
            disabled={edges.start}
            onClick={() => swiper?.slidePrev()}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="home-hero-nav"
            aria-label="Libros siguientes"
            disabled={edges.end}
            onClick={() => swiper?.slideNext()}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </motion.div>
    </>
  );
}
