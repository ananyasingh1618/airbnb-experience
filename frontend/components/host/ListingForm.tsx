"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AmenityIcon } from "@/components/ui/Icons";
import { FieldError } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { btn } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/format";
import type { Listing, ListingInput, Meta } from "@/types";

type Errors = Partial<Record<string, string>>;

const input = "w-full rounded-xl border border-line-strong bg-bg px-3.5 py-3 outline-none transition-shadow focus:border-ink focus:shadow-[0_0_0_1px_var(--text)] aria-[invalid=true]:border-danger";

function Field({ label, id, error, hint, children }: { label: string; id: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-2">{hint}</p>}
      <FieldError id={`${id}-err`}>{error}</FieldError>
    </div>
  );
}

export function ListingForm({ meta, listing }: { meta: Meta; listing?: Listing }) {
  const router = useRouter();
  const { toast } = useToast();
  const [v, setV] = useState({
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    location: listing?.location ?? "",
    country: listing?.country ?? "",
    price: listing ? String(listing.price_per_night_cents / 100) : "",
    cleaning: listing ? String(listing.cleaning_fee_cents / 100) : "0",
    max_guests: String(listing?.max_guests ?? 2),
    bedrooms: String(listing?.bedrooms ?? 1),
    beds: String(listing?.beds ?? 1),
    bathrooms: String(listing?.bathrooms ?? 1),
    property_type: listing?.property_type ?? meta.property_types[0],
    category: listing?.category ?? meta.categories[0],
    images: (listing?.images ?? []).join("\n"),
    latitude: listing?.latitude != null ? String(listing.latitude) : "",
    longitude: listing?.longitude != null ? String(listing.longitude) : "",
  });
  const [locating, setLocating] = useState(false);
  const [amenityIds, setAmenityIds] = useState<number[]>(listing?.amenities.map((a) => a.id) ?? []);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  const validate = (): Errors => {
    const e: Errors = {};
    if (v.title.trim().length < 3) e.title = "Enter a title (at least 3 characters).";
    if (v.description.trim().length < 20) e.description = "Describe the place in at least 20 characters.";
    if (v.location.trim().length < 2) e.location = "Enter a location, e.g. “Lisbon, Portugal”.";
    const price = Number(v.price);
    if (!v.price || !(price >= 1)) e.price = "Enter a nightly price of at least $1.";
    if (v.cleaning === "" || Number(v.cleaning) < 0) e.cleaning = "Cleaning fee can't be negative.";
    const int = (s: string, min: number, max: number) => Number.isInteger(Number(s)) && Number(s) >= min && Number(s) <= max;
    if (!int(v.max_guests, 1, 30)) e.max_guests = "Whole number from 1 to 30.";
    if (!int(v.bedrooms, 0, 30)) e.bedrooms = "Whole number from 0 to 30.";
    if (!int(v.beds, 1, 60)) e.beds = "At least 1 bed.";
    if (!(Number(v.bathrooms) >= 0.5)) e.bathrooms = "At least 0.5 bathrooms.";
    if (v.latitude !== "" && !(Number(v.latitude) >= -90 && Number(v.latitude) <= 90)) e.latitude = "Latitude must be between -90 and 90.";
    if (v.longitude !== "" && !(Number(v.longitude) >= -180 && Number(v.longitude) <= 180)) e.longitude = "Longitude must be between -180 and 180.";
    const urls = v.images.split("\n").map((s) => s.trim()).filter(Boolean);
    if (urls.length === 0) e.images = "Add at least one image URL (one per line).";
    else if (urls.some((u) => !/^https?:\/\/\S+$/i.test(u))) e.images = "Each line must be a full http(s) URL.";
    return e;
  };

  // Optional: look the location up on OpenStreetMap Nominatim so the listing gets a pin on the map.
  const locate = async () => {
    if (v.location.trim().length < 2) return toast("Enter a location first.", "error");
    setLocating(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(v.location.trim())}`, { headers: { Accept: "application/json" } });
      const [hit] = (await r.json()) as { lat: string; lon: string }[];
      if (!hit) return toast("We couldn't find that place. You can type coordinates manually.", "error");
      setV((s) => ({ ...s, latitude: Number(hit.lat).toFixed(4), longitude: Number(hit.lon).toFixed(4) }));
      toast("Coordinates filled in from OpenStreetMap", "success");
    } catch {
      toast("Location lookup is unavailable right now.", "error");
    } finally {
      setLocating(false);
    }
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (saving) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`f-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    const body: ListingInput = {
      title: v.title.trim(), description: v.description.trim(), location: v.location.trim(),
      country: v.country.trim() || null,
      latitude: v.latitude === "" ? null : Number(v.latitude),
      longitude: v.longitude === "" ? null : Number(v.longitude),
      price_per_night_cents: Math.round(Number(v.price) * 100),
      cleaning_fee_cents: Math.round(Number(v.cleaning) * 100),
      max_guests: Number(v.max_guests), bedrooms: Number(v.bedrooms), beds: Number(v.beds), bathrooms: Number(v.bathrooms),
      property_type: v.property_type, category: v.category,
      image_urls: v.images.split("\n").map((s) => s.trim()).filter(Boolean),
      amenity_ids: amenityIds,
    };
    setSaving(true);
    try {
      const saved = listing ? await api.updateListing(listing.id, body) : await api.createListing(body);
      toast(listing ? "Listing updated" : "Listing created — it's live on Explore", "success");
      router.push(listing ? "/host" : `/listings/${saved.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        const map: Errors = {};
        for (const [k, m] of Object.entries(err.fields)) map[k.split(".")[0] === "image_urls" ? "images" : k.split(".")[0]] = m;
        setErrors(map);
      }
      toast(err instanceof Error ? err.message : "Couldn't save the listing", "error");
      setSaving(false);
    }
  };

  const err = (k: string) => errors[k];
  const inv = (k: string) => (errors[k] ? true : undefined);

  return (
    <form onSubmit={submit} noValidate className="space-y-10">
      <section className="space-y-5">
        <h2 className="text-[22px] font-semibold">The basics</h2>
        <Field label="Title" id="f-title" error={err("title")}><input id="f-title" value={v.title} onChange={set("title")} aria-invalid={inv("title")} aria-describedby="f-title-err" className={input} maxLength={160} /></Field>
        <Field label="Description" id="f-description" error={err("description")}><textarea id="f-description" value={v.description} onChange={set("description")} aria-invalid={inv("description")} rows={5} className={input} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Location" id="f-location" error={err("location")} hint="City, Country"><input id="f-location" value={v.location} onChange={set("location")} aria-invalid={inv("location")} className={input} /></Field>
          <Field label="Country (optional)" id="f-country"><input id="f-country" value={v.country} onChange={set("country")} className={input} /></Field>
          <Field label="Property type" id="f-property_type"><select id="f-property_type" value={v.property_type} onChange={set("property_type")} className={input}>{meta.property_types.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Category" id="f-category"><select id="f-category" value={v.category} onChange={set("category")} className={input}>{meta.categories.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>)}</select></Field>
          <Field label="Latitude (optional)" id="f-latitude" error={err("latitude")}><input id="f-latitude" inputMode="decimal" value={v.latitude} onChange={set("latitude")} aria-invalid={inv("latitude")} className={input} /></Field>
          <Field label="Longitude (optional)" id="f-longitude" error={err("longitude")}><input id="f-longitude" inputMode="decimal" value={v.longitude} onChange={set("longitude")} aria-invalid={inv("longitude")} className={input} /></Field>
        </div>
        <button type="button" onClick={locate} disabled={locating} className="text-sm font-medium underline disabled:opacity-50">{locating ? "Looking up…" : "Look up coordinates from the location (OpenStreetMap)"}</button>
        <p className="text-xs text-ink-2">Coordinates place your listing on the results map.</p>
      </section>

      <section className="space-y-5">
        <h2 className="text-[22px] font-semibold">Pricing &amp; capacity</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nightly price (USD)" id="f-price" error={err("price") ?? err("price_per_night_cents")}><input id="f-price" inputMode="decimal" value={v.price} onChange={set("price")} aria-invalid={inv("price")} className={input} /></Field>
          <Field label="Cleaning fee (USD)" id="f-cleaning" error={err("cleaning")}><input id="f-cleaning" inputMode="decimal" value={v.cleaning} onChange={set("cleaning")} aria-invalid={inv("cleaning")} className={input} /></Field>
          <Field label="Max guests" id="f-max_guests" error={err("max_guests")}><input id="f-max_guests" inputMode="numeric" value={v.max_guests} onChange={set("max_guests")} aria-invalid={inv("max_guests")} className={input} /></Field>
          <Field label="Bedrooms" id="f-bedrooms" error={err("bedrooms")}><input id="f-bedrooms" inputMode="numeric" value={v.bedrooms} onChange={set("bedrooms")} aria-invalid={inv("bedrooms")} className={input} /></Field>
          <Field label="Beds" id="f-beds" error={err("beds")}><input id="f-beds" inputMode="numeric" value={v.beds} onChange={set("beds")} aria-invalid={inv("beds")} className={input} /></Field>
          <Field label="Bathrooms" id="f-bathrooms" error={err("bathrooms")}><input id="f-bathrooms" inputMode="decimal" value={v.bathrooms} onChange={set("bathrooms")} aria-invalid={inv("bathrooms")} className={input} /></Field>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-[22px] font-semibold">Photos</h2>
        <Field label="Image URLs" id="f-images" error={err("images")} hint="One URL per line. The first image is the cover photo.">
          <textarea id="f-images" value={v.images} onChange={set("images")} aria-invalid={inv("images")} rows={5} placeholder="https://images.unsplash.com/photo-…" className={`${input} font-mono text-sm`} />
        </Field>
      </section>

      <section>
        <h2 className="mb-4 text-[22px] font-semibold">Amenities</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {meta.amenities.map((a) => {
            const on = amenityIds.includes(a.id);
            return (
              <button type="button" key={a.id} aria-pressed={on} onClick={() => setAmenityIds((l) => (on ? l.filter((x) => x !== a.id) : [...l, a.id]))} className={`flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${on ? "border-ink bg-surface shadow-[0_0_0_1px_var(--text)]" : "border-line-strong hover:border-ink"}`}>
                <AmenityIcon name={a.icon} className="size-5 shrink-0" />{a.name}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex items-center gap-3 border-t border-line pt-6">
        <button type="submit" disabled={saving} className={btn("brand")}>{saving ? "Saving…" : listing ? "Save changes" : "Create listing"}</button>
        <button type="button" onClick={() => router.push("/host")} className={btn("ghost")}>Cancel</button>
      </div>
    </form>
  );
}
