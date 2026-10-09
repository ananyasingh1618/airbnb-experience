"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** Single-location map with a brand-coloured home marker (OpenStreetMap tiles). */
export default function PlaceMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: false }).setView([lat, lng], 11);
    L.control.zoom({ position: "topright" }).addTo(m);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(m);
    // Approximate area only (a soft circle), as exact addresses are shared after booking.
    L.circle([lat, lng], { radius: 2500, color: "#ff385c", weight: 2, fillColor: "#ff385c", fillOpacity: 0.15 }).addTo(m);
    L.marker([lat, lng], { title: label, icon: L.divIcon({ className: "", iconSize: [0, 0], html: '<div style="transform:translate(-50%,-50%);width:48px;height:48px;border-radius:50%;background:#ff385c;color:#fff;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.3)"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>' }) }).addTo(m);
    return () => { m.remove(); };
  }, [lat, lng, label]);
  return <div ref={el} className="size-full" role="region" aria-label={`Map of ${label}`} />;
}
