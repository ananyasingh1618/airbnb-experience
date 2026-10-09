"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { money } from "@/lib/format";
import type { Listing } from "@/types";

/** Leaflet map with Airbnb-style price pins (OpenStreetMap tiles; light demo usage per the OSM tile policy). */
export default function ResultsMap({ items, hoveredId, onOpen }: { items: Listing[]; hoveredId: number | null; onOpen: (id: number) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef(new Map<number, L.Marker>());
  const open = useRef(onOpen);
  useEffect(() => { open.current = onOpen; });

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: false, scrollWheelZoom: true }).setView([30, 0], 2);
    L.control.zoom({ position: "topright" }).addTo(m);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    markers.current.clear();
    const pts: L.LatLngTuple[] = [];
    for (const l of items) {
      if (l.latitude == null || l.longitude == null) continue;
      const price = money(l.quote ? l.quote.total_price_cents : l.price_per_night_cents);
      const icon = L.divIcon({ className: "", html: `<div class="map-pin" role="button" aria-label="${l.title}, ${price}">${price}</div>`, iconSize: [0, 0] });
      const mk = L.marker([l.latitude, l.longitude], { icon, keyboard: true, title: l.title }).on("click", () => open.current(l.id));
      mk.addTo(g);
      markers.current.set(l.id, mk);
      pts.push([l.latitude, l.longitude]);
    }
    if (pts.length === 1) m.setView(pts[0], 9);
    else if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 10 });
    setTimeout(() => m.invalidateSize(), 0);
  }, [items]);

  useEffect(() => {
    markers.current.forEach((mk, id) => mk.getElement()?.querySelector(".map-pin")?.classList.toggle("is-active", id === hoveredId));
  }, [hoveredId, items]);

  return <div ref={el} className="size-full" role="region" aria-label="Map of results" />;
}
