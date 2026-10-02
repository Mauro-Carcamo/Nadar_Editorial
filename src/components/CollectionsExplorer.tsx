"use client";

import Image from "next/image";
import Link from "next/link";
import { animate, motion, useMotionValue } from "motion/react";
import { RefObject, useLayoutEffect, useRef, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { A11y, Keyboard, Parallax } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Book, getCover, getLeadAndBody } from "@/data/site";

type CollectionWithBooks = {
  slug: string;
  name: string;
  description: string;
  books: Book[];
};

const formatPrice = (price: number) => `$${new Intl.NumberFormat("es-CL").format(price)}`;
const pad = (n: number) => String(n).padStart(2, "0");

type PillBox = { x: number; y: number; w: number; h: number };
const PILL_SPRING = { type: "spring", stiffness: 200, damping: 28 } as const;

// Posición de la píldora del menú entre montajes del panel (se remonta al cambiar de colección)
let lastPill: PillBox | null = null;

/** Píldora azul del menú: mide la pestaña activa y se desliza hasta ella con un resorte. */
function useTabPill(menuRef: RefObject<HTMLDivElement | null>) {
  const x = useMotionValue(lastPill?.x ?? 0);
  const y = useMotionValue(lastPill?.y ?? 0);
  const w = useMotionValue(lastPill?.w ?? 0);
  const h = useMotionValue(lastPill?.h ?? 0);

  useLayoutEffect(() => {
    const measure = (): PillBox | null => {
      const tab = menuRef.current?.querySelector<HTMLElement>(".collections-tab.is-active");
      return tab ? { x: tab.offsetLeft, y: tab.offsetTop, w: tab.offsetWidth, h: tab.offsetHeight } : null;
    };
    const target = measure();
    if (!target) return;

    const controls: { stop: () => void }[] = [];
    let frame = 0;
    if (lastPill) {
      // Espera dos cuadros: al cambiar de colección Swiper se reconstruye y bloquea el hilo;
      // si la animación empieza antes, gran parte del deslizamiento no llega a pintarse.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          controls.push(animate(x, target.x, PILL_SPRING), animate(w, target.w, PILL_SPRING));
        });
      });
    } else {
      x.set(target.x);
      w.set(target.w);
    }
    y.set(target.y);
    h.set(target.h);
    lastPill = target;

    const onResize = () => {
      const box = measure();
      if (!box) return;
      x.set(box.x);
      y.set(box.y);
      w.set(box.w);
      h.set(box.h);
      lastPill = box;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      controls.forEach((c) => c.stop());
      window.removeEventListener("resize", onResize);
    };
  }, [menuRef, x, y, w, h]);

  return { x, y, width: w, height: h };
}

export function CollectionsExplorer({ collections }: { collections: CollectionWithBooks[] }) {
  const [activeSlug, setActiveSlug] = useState(collections[0]?.slug);
  const active = collections.find((c) => c.slug === activeSlug) ?? collections[0];

  if (!active) return null;

  // key: al cambiar de colección se montan swipers nuevos desde el primer libro
  return (
    <CollectionStage
      key={active.slug}
      collections={collections}
      active={active}
      onSelect={setActiveSlug}
    />
  );
}

function CollectionStage({
  collections,
  active,
  onSelect,
}: {
  collections: CollectionWithBooks[];
  active: CollectionWithBooks;
  onSelect: (slug: string) => void;
}) {
  const [main, setMain] = useState<SwiperInstance | null>(null);
  const [strip, setStrip] = useState<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = active.books.length;
  const menuRef = useRef<HTMLDivElement>(null);
  const pill = useTabPill(menuRef);

  return (
    <Swiper
      className="collection-stage"
      modules={[A11y, Keyboard, Parallax]}
      speed={700}
      parallax
      autoHeight
      keyboard={{ enabled: true, onlyInViewport: true }}
      a11y={{ prevSlideMessage: "Libro anterior", nextSlideMessage: "Libro siguiente" }}
      onSwiper={setMain}
      onSlideChange={(s) => {
        setActiveIndex(s.activeIndex);
        strip?.slideTo(Math.max(0, s.activeIndex - 1));
      }}
    >

      {/* Menú de colecciones dentro del panel; swiper-no-swiping evita arrastrar el visor desde aquí */}
      <div slot="container-start" className="collection-stage-head swiper-no-swiping">
        <div className="collections-menu" role="tablist" aria-label="Colecciones" ref={menuRef}>
          <motion.span className="collections-tab-pill" style={pill} aria-hidden="true" />
          {collections.map((collection, index) => {
            const selected = collection.slug === active.slug;
            return (
              <button
                key={collection.slug}
                type="button"
                role="tab"
                id={`tab-${collection.slug}`}
                aria-selected={selected}
                aria-controls={`panel-${collection.slug}`}
                className={`collections-tab${selected ? " is-active" : ""}`}
                onClick={() => onSelect(collection.slug)}
              >
                <span className="collections-tab-index">{pad(index + 1)}</span>
                <span className="collections-tab-name">{collection.name}</span>
                <span className="collections-tab-count" aria-label={`${collection.books.length} títulos`}>
                  {collection.books.length}
                </span>
              </button>
            );
          })}
        </div>
        <p
          className="collections-panel-description"
          id={`panel-${active.slug}`}
          role="tabpanel"
          aria-labelledby={`tab-${active.slug}`}
        >
          {active.description}
        </p>
      </div>

      {/* Tira "Grab cursor" bajo el menú: solo fotos; al elegir una se abre el libro abajo */}
      <div slot="container-start" className="collection-stage-foot">
        <Swiper
          className="collection-strip"
          modules={[A11y]}
          nested
          grabCursor
          slidesPerView={2.4}
          spaceBetween={12}
          breakpoints={{
            640: { slidesPerView: 3.6, spaceBetween: 14 },
            960: { slidesPerView: 8, spaceBetween: 16 },
          }}
          onSwiper={setStrip}
        >
          {active.books.map((book, index) => (
            <SwiperSlide key={book.slug} className="collection-strip-slide">
              <button
                type="button"
                className={`collection-strip-item${index === activeIndex ? " is-active" : ""}`}
                aria-label={`Ver ${book.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => main?.slideTo(index)}
              >
                <span className="collection-strip-cover">
                  <Image
                    src={getCover(book).src}
                    alt=""
                    width={getCover(book).width}
                    height={getCover(book).height}
                    sizes="120px"
                  />
                </span>
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {active.books.map((book, index) => (
        <SwiperSlide key={book.slug} tag="article" className="collection-parallax-slide">
          <div className="collection-parallax-cover" data-swiper-parallax="-40%" data-swiper-parallax-opacity="0.3">
            <motion.div
              className={`collection-parallax-cover-inner${getCover(book).flat ? " is-flat" : ""}`}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={getCover(book).src}
                alt={`Portada de ${book.title}, de ${book.subtitle}`}
                width={getCover(book).width}
                height={getCover(book).height}
                sizes="(min-width: 960px) 380px, 70vw"
                priority={index === 0}
              />
            </motion.div>
          </div>

          <motion.div
            className="collection-parallax-info"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.0, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="collection-parallax-eyebrow" data-swiper-parallax="-400">
              {active.name}
              {book.series ? ` · ${book.series}` : ""} · {pad(index + 1)}/{pad(total)}
            </p>
            <h3 className="collection-parallax-title" data-swiper-parallax="-300">
              {book.title}
            </h3>
            <p className="collection-parallax-author" data-swiper-parallax="-200">
              {book.subtitle}
            </p>
            <div className="collection-parallax-text" data-swiper-parallax="-100">
              {getLeadAndBody(book).lead ? (
                <p className="collection-parallax-bajada">{getLeadAndBody(book).lead}</p>
              ) : null}
              {getLeadAndBody(book).body ? (
                <p className="collection-parallax-description">{getLeadAndBody(book).body}</p>
              ) : null}
              {book.isbn || book.publishDate || book.subject ? (
                <dl className="collection-parallax-facts">
                  {book.isbn ? (
                    <div>
                      <dt>ISBN</dt>
                      <dd>{book.isbn}</dd>
                    </div>
                  ) : null}
                  {book.publishDate ? (
                    <div>
                      <dt>Publicación</dt>
                      <dd>{book.publishDate}</dd>
                    </div>
                  ) : null}
                  {book.subject ? (
                    <div>
                      <dt>Materia</dt>
                      <dd>{book.subject}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </div>
            <div className="collection-parallax-buy" data-swiper-parallax="-50">
              {book.price ? (
                <p className="collection-parallax-price">
                  {formatPrice(book.price)} <span>{book.currency ?? "CLP"}</span>
                </p>
              ) : null}
              <div className="collection-parallax-actions">
                {book.price ? (
                <AddToCartButton
                  slug={book.slug}
                  title={book.title}
                  subtitle={book.subtitle}
                  image={book.image}
                  price={book.price ?? null}
                  currency={book.currency ?? "CLP"}
                  className="btn btn-primary"
                  ariaLabel={`Agregar ${book.title} al carrito`}
                />
                ) : (
                  <Link href="/contacto" className="btn btn-primary">
                    Consultar disponibilidad
                  </Link>
                )}
                <Link href={`/libros/${book.slug}`} className="btn btn-outline">
                  Ver ficha
                </Link>
              </div>
            </div>
          </motion.div>
        </SwiperSlide>
      ))}

    </Swiper>
  );
}
