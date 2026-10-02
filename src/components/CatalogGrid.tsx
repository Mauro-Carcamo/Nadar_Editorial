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
import { Book, getCover } from "@/data/site";

const formatPrice = (price: number) => `$${new Intl.NumberFormat("es-CL").format(price)}`;

const EASE = [0.22, 1, 0.36, 1] as const;

// Entrada en cascada al aparecer + elevación al pasar el mouse (el estado se propaga a la portada)
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (order: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.95, delay: order * 0.1, ease: EASE },
  }),
  hover: { y: -6, transition: { duration: 0.5, ease: "easeOut" } },
};

const coverVariants: Variants = {
  hover: { scale: 1.04, transition: { duration: 0.65, ease: "easeOut" } },
};

// Demo "Grid": 2 filas; las columnas deben coincidir con --catalog-cols en globals.css
export function CatalogGrid({ books }: { books: Book[] }) {
  return (
    <div className="catalog-shelf">
      <Swiper
        className="catalog-swiper"
        modules={[A11y, Grid, Keyboard, Pagination]}
        grid={{ rows: 2, fill: "row" }}
        slidesPerView={2}
        slidesPerGroup={2}
        spaceBetween={16}
        keyboard={{ enabled: true, onlyInViewport: true }}
        pagination={{ clickable: true }}
        a11y={{ containerMessage: "Catálogo completo de Nadar Ediciones" }}
        breakpoints={{
          640: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 24 },
          960: { slidesPerView: 4, slidesPerGroup: 4, spaceBetween: 28 },
        }}
      >
        {books.map((book, index) => (
          <SwiperSlide key={book.slug} tag="article" className="catalog-slide">
            <motion.div
              className="catalog-card"
              variants={cardVariants}
              custom={index % 8}
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
                      sizes="(min-width: 960px) 200px, (min-width: 640px) 24vw, 36vw"
                    />
                  </motion.span>
                </span>
                <span className="catalog-card-title">{book.title}</span>
                <span className="catalog-card-author">{book.subtitle}</span>
              </Link>
              <div className="catalog-card-buy">
                {book.price ? <span className="catalog-card-price">{formatPrice(book.price)}</span> : null}
                <AddToCartButton
                  slug={book.slug}
                  title={book.title}
                  subtitle={book.subtitle}
                  image={book.image}
                  price={book.price ?? null}
                  currency={book.currency ?? "CLP"}
                  className="catalog-card-cart"
                  ariaLabel={`Agregar ${book.title} al carrito`}
                >
                  Agregar
                </AddToCartButton>
              </div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
