"use client";

import type { Map as MapLibreMap, Marker, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointOfSale } from "@/services/points-of-sale/repository";

// Lista de librerías a la izquierda y mapa (MapLibre + teselas de OpenFreeMap) a la derecha.
// El mapa se carga recién cuando la sección se acerca a la pantalla. Las coordenadas vienen
// geocodificadas desde la base: aquí no se consulta ningún geocodificador.

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
const ALL = "Todas";
const CHILE: [[number, number], [number, number]] = [
  [-75.5, -54],
  [-67, -28.5],
];

const regionLabel = (r: string) => (r === "Metropolitana de Santiago" ? "Región Metropolitana" : `Región de ${r}`);
const shortRegion = (r: string) => (r === "Metropolitana de Santiago" ? "Metropolitana" : r);
const directionsUrl = (p: PointOfSale) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    p.address ? `${p.name}, ${p.address}, ${p.comuna}, Chile` : `${p.comuna}, Chile`,
  )}`;
const host = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export function PointsOfSaleExplorer({ points, initialRegion }: { points: PointOfSale[]; initialRegion?: string }) {
  const regions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of points) counts.set(p.region, (counts.get(p.region) ?? 0) + 1);
    return [...counts.entries()];
  }, [points]);

  const [region, setRegion] = useState(initialRegion && regions.some(([r]) => r === initialRegion) ? initialRegion : ALL);
  const [active, setActive] = useState<string | null>(null);
  const [mapState, setMapState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const visible = useMemo(() => (region === ALL ? points : points.filter((p) => p.region === region)), [points, region]);

  // Agrupado por comuna dentro de cada región, respetando el orden de norte a sur
  const groups = useMemo(() => {
    const out: { key: string; region: string; comuna: string; items: PointOfSale[] }[] = [];
    for (const p of visible) {
      const key = `${p.region}|${p.comuna}`;
      const last = out.find((g) => g.key === key);
      if (last) last.items.push(p);
      else out.push({ key, region: p.region, comuna: p.comuna, items: [p] });
    }
    return out;
  }, [visible]);

  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const popup = useRef<Popup | null>(null);
  const lib = useRef<typeof import("maplibre-gl") | null>(null);
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Carga diferida del mapa
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    const markerMap = markers.current;

    const start = async () => {
      setMapState("loading");
      try {
        const maplibre = await import("maplibre-gl");
        if (cancelled || !mapRef.current) return;
        maplibre.setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
        lib.current = maplibre;
        const instance = new maplibre.Map({
          container: mapRef.current,
          style: MAP_STYLE,
          bounds: CHILE,
          cooperativeGestures: true,
          attributionControl: { compact: true },
          minZoom: 2,
        });
        instance.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        map.current = instance;

        for (const p of points) {
          const el = document.createElement("button");
          el.type = "button";
          el.className = `pos-marker${p.precision === "city" ? " is-approx" : ""}`;
          el.setAttribute("aria-label", `${p.name}, ${p.comuna}`);
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            setActive(p.slug);
          });
          const marker = new maplibre.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(instance);
          markerMap.set(p.slug, marker);
        }
        instance.once("load", () => {
          if (cancelled) return;
          setMapState("ready");
        });
        instance.on("error", (e) => console.warn("[mapa]", e.error?.message));
      } catch (error) {
        console.error("[mapa] no se pudo cargar", error);
        if (!cancelled) setMapState("error");
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void start();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(root);

    return () => {
      cancelled = true;
      io.disconnect();
      popup.current?.remove();
      markerMap.clear();
      map.current?.remove();
      map.current = null;
    };
  }, [points]);

  // Región: muestra solo sus marcadores y encuadra el mapa
  useEffect(() => {
    const instance = map.current;
    if (!instance || mapState !== "ready" || !lib.current) return;
    const inRegion = region === ALL ? points : points.filter((p) => p.region === region);
    const slugs = new Set(inRegion.map((p) => p.slug));
    for (const [slug, marker] of markers.current) marker.getElement().hidden = !slugs.has(slug);

    const duration = reducedMotion() ? 0 : 900;
    if (!inRegion.length) {
      instance.fitBounds(CHILE, { padding: 24, duration });
    } else if (inRegion.length === 1) {
      instance.flyTo({ center: [inRegion[0].lng, inRegion[0].lat], zoom: inRegion[0].precision === "city" ? 10 : 14, duration });
    } else {
      const bounds = new lib.current.LngLatBounds();
      for (const p of inRegion) bounds.extend([p.lng, p.lat]);
      instance.fitBounds(bounds, { padding: region === ALL ? 32 : 56, maxZoom: 14, duration });
    }
  }, [region, mapState, points]);

  // Punto activo: resalta el marcador, abre la ficha y lleva la lista hasta él
  useEffect(() => {
    for (const [slug, marker] of markers.current) marker.getElement().classList.toggle("is-active", slug === active);
    popup.current?.remove();
    const p = points.find((x) => x.slug === active);
    if (!p) return;

    const item = listRef.current?.querySelector<HTMLElement>(`[data-slug="${p.slug}"]`);
    const list = listRef.current;
    if (item && list) {
      const top = item.offsetTop - list.offsetTop - 12;
      if (top < list.scrollTop || top > list.scrollTop + list.clientHeight - item.offsetHeight) {
        list.scrollTo({ top, behavior: reducedMotion() ? "auto" : "smooth" });
      }
    }

    const instance = map.current;
    if (!instance || mapState !== "ready" || !lib.current) return;
    instance.flyTo({
      center: [p.lng, p.lat],
      zoom: Math.max(instance.getZoom(), p.precision === "city" ? 11 : 15),
      duration: reducedMotion() ? 0 : 900,
    });
    const content = document.createElement("div");
    content.className = "pos-popup";
    const title = document.createElement("strong");
    title.textContent = p.name;
    const address = document.createElement("span");
    address.textContent = p.address ? `${p.address}, ${p.comuna}` : (p.note ?? p.city);
    content.append(title, address);
    popup.current = new lib.current.Popup({ offset: 14, closeButton: false, maxWidth: "260px" })
      .setLngLat([p.lng, p.lat])
      .setDOMContent(content)
      .addTo(instance);
  }, [active, mapState, points]);

  const chooseRegion = (r: string) => {
    setRegion(r);
    setActive(null);
    listRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="pos-explorer" ref={rootRef}>
      <div className="pos-regions" role="tablist" aria-label="Filtrar por región">
        {[[ALL, points.length] as [string, number], ...regions].map(([r, count]) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={region === r}
            className={region === r ? "is-active" : ""}
            onClick={() => chooseRegion(r)}
          >
            {r === ALL ? "Todo Chile" : shortRegion(r)} <span>{count}</span>
          </button>
        ))}
      </div>

      <div className="pos-layout">
        <div className="pos-list" ref={listRef} aria-label="Librerías">
          {groups.map((g, i) => (
            <section key={g.key} className="pos-group">
              {i === 0 || groups[i - 1].region !== g.region ? <h3 className="pos-region">{regionLabel(g.region)}</h3> : null}
              <p className="pos-comuna">{g.comuna}</p>
              <ul>
                {g.items.map((p) => (
                  <li key={p.slug} data-slug={p.slug} className={active === p.slug ? "is-active" : ""}>
                    <button type="button" className="pos-item" onClick={() => setActive(p.slug)} aria-pressed={active === p.slug}>
                      <span className="pos-name">{p.name}</span>
                      <span className="pos-address">{p.address ?? p.note ?? p.city}</span>
                      {p.address && p.note ? <span className="pos-note">{p.note}</span> : null}
                      {p.itinerant ? <span className="pos-note">Itinerante</span> : null}
                    </button>
                    <div className="pos-links">
                      {p.website ? (
                        <a href={p.website} target="_blank" rel="noopener noreferrer">
                          {host(p.website)}
                        </a>
                      ) : null}
                      {p.instagram ? (
                        <a href={`https://www.instagram.com/${p.instagram}/`} target="_blank" rel="noopener noreferrer">
                          @{p.instagram}
                        </a>
                      ) : null}
                      {p.address ? (
                        <a href={directionsUrl(p)} target="_blank" rel="noopener noreferrer">
                          Cómo llegar
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="pos-map-wrap">
          <div ref={mapRef} className="pos-map" role="region" aria-label="Mapa de puntos de venta" />
          {mapState !== "ready" ? (
            <p className="pos-map-status">{mapState === "error" ? "No se pudo cargar el mapa." : "Cargando mapa…"}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
