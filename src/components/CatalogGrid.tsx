"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { A11y, Grid, Keyboard, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/grid";
import "swiper/css/pagination";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BookPrice } from "@/components/discounts/BookPrice";
import { DiscountBadge } from "@/components/discounts/DiscountBadge";
import { finalPrice } from "@/data/book-utils";
import { Book, getCover } from "@/data/site";


const EASE = [0.22, 1, 0.36, 1] as const;

// Entrada en cascada al aparecer + elevación al pasar el mouse (el estado se propaga a la portada)
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (order: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.95, delay: order * 0.06, ease: EASE },
  }),
  hover: { y: -6, transition: { duration: 0.5, ease: "easeOut" } },
};

const coverVariants: Variants = {
  hover: { scale: 1.04, transition: { duration: 0.65, ease: "easeOut" } },
};

// Demo "Grid": 3 filas (5 columnas en escritorio); las columnas deben coincidir con --catalog-cols en globals.css
export function CatalogGrid({ books }: { books: Book[] }) {
  return (
    <div className="catalog-shelf">
      {/* Paginación también al comienzo: comparte estado con la de abajo (misma clase, uniqueNavElements=false) */}
      <div className="catalog-pagination catalog-pagination-top" />
      <Swiper
        className="catalog-swiper"
        modules={[A11y, Grid, Keyboard, Pagination]}
        // Celular: 3 columnas x 4 filas; desde 640 px: 3 filas (5 columnas en escritorio)
        grid={{ rows: 4, fill: "row" }}
        slidesPerView={3}
        slidesPerGroup={3}
        spaceBetween={10}
        keyboard={{ enabled: true, onlyInViewport: true }}
        pagination={{ el: ".catalog-pagination", clickable: true }}
        uniqueNavElements={false}
        a11y={{ containerMessage: "Catálogo completo de Nadar Ediciones" }}
        breakpoints={{
          640: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 24, grid: { rows: 3, fill: "row" } },
          960: { slidesPerView: 5, slidesPerGroup: 5, spaceBetween: 24, grid: { rows: 3, fill: "row" } },
        }}
      >
        {books.map((book, index) => (
          <SwiperSlide key={book.slug} tag="article" className="catalog-slide">
            <CatalogCard book={book} index={index} />
          </SwiperSlide>
        ))}
        <div slot="container-end" className="swiper-pagination catalog-pagination catalog-pagination-bottom" />
      </Swiper>
    </div>
  );
}

/** Tarjeta de libro del catálogo (la usan el carrusel y la grilla filtrada). */
export function CatalogCard({ book, index }: { book: Book; index: number }) {
  return (
    <motion.div
      className="catalog-card"
      variants={cardVariants}
      custom={index % 15}
      initial="hidden"
      whileInView="visible"
      whileHover="hover"
      viewport={{ once: true, amount: 0.3 }}
    >
      <Link href={`/libros/${book.slug}`} className="catalog-card-link">
        <span className={`catalog-card-frame${getCover(book).flat ? " is-flat" : ""}`}>
          <motion.span className="catalog-card-cover" variants={coverVariants}>
            <Image
              src={getCover(book).src}
              alt={`Portada de ${book.title}, de ${book.subtitle}`}
              width={getCover(book).width}
              height={getCover(book).height}
              sizes="(min-width: 960px) 260px, (min-width: 640px) 30vw, 44vw"
            />
          </motion.span>
          <DiscountBadge discount={book.discount} />
        </span>
        <span className="catalog-card-title">{book.title}</span>
        <span className="catalog-card-author">{book.subtitle}</span>
      </Link>
      <div className="catalog-card-buy">
        {book.price ? (
          <span className={`catalog-card-price${book.discount ? " has-discount" : ""}`}>
            <BookPrice book={book} />
          </span>
        ) : null}
        {book.price ? (
        <AddToCartButton
          slug={book.slug}
          title={book.title}
          subtitle={book.subtitle}
          image={getCover(book).src}
          price={finalPrice(book)}
          currency={book.currency ?? "CLP"}
          className="catalog-card-cart"
          ariaLabel={`Agregar ${book.title} al carrito`}
        >
          Agregar
        </AddToCartButton>
        ) : (
          // Sin precio confirmado no se agrega al carrito: se consulta disponibilidad
          <Link href="/contacto" className="catalog-card-cart catalog-card-ask">
            Consultar
          </Link>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Grilla simple para resultados filtrados: suelen ser pocos libros y el módulo Grid de Swiper
 * los ubica mal cuando no completan una página (deja filas vacías).
 */
export function CatalogPlainGrid({ books }: { books: Book[] }) {
  return (
    <div className="catalog-plain-grid">
      {books.map((book, index) => (
        <article key={book.slug} className="catalog-slide">
          <CatalogCard book={book} index={index} />
        </article>
      ))}
    </div>
  );
}
