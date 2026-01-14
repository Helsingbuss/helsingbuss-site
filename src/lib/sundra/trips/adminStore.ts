// src/lib/sundra/trips/adminStore.ts
import { listTrips, type TripRecord } from "@/lib/sundra/trips/localStore";

const KEY = "sundra_trips_v1";

/**
 * ✅ TripKind: fungerar även om TripRecord saknar "kind".
 * Om TripRecord har "type" så använder vi den typen, annars fallback.
 */
export type TripKind = TripRecord extends { type: infer T }
  ? T
  : "DAY" | "MULTI" | "FUN";

function isBrowser() {
  return typeof window !== "undefined";
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadAll(): TripRecord[] {
  if (!isBrowser()) return [];
  const existing = safeParse<TripRecord[]>(window.localStorage.getItem(KEY), []);
  // Seed första gången
  if (!existing || existing.length === 0) {
    const seed = listTrips(); // demo-resor från localStore.ts
    window.localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }
  return existing;
}

function saveAll(trips: TripRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(trips));
}

function uid() {
  return "t_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ensureUniqueSlug(slugBase: string, trips: TripRecord[], ignoreId?: string) {
  let slug = slugBase || "ny-resa";
  let i = 2;
  while (trips.some((t) => t.slug === slug && t.id !== ignoreId)) {
    slug = `${slugBase}-${i++}`;
  }
  return slug;
}

export function listAdminTrips(): TripRecord[] {
  return loadAll().slice().sort((a, b) => a.title.localeCompare(b.title));
}

export function getAdminTripById(id: string): TripRecord | null {
  return loadAll().find((t) => t.id === id) ?? null;
}

export function getAdminTripBySlug(slug: string): TripRecord | null {
  return loadAll().find((t) => t.slug === slug) ?? null;
}

export function upsertAdminTrip(next: TripRecord): TripRecord {
  const all = loadAll();
  const idx = all.findIndex((t) => t.id === next.id);

  // håll slug stabil & unik
  const slugBase = slugify((next as any).slug || (next as any).title || "ny-resa");
  const slug = ensureUniqueSlug(slugBase, all, next.id);

  const normalized: TripRecord = {
    ...(next as any),
    slug,
    media: {
      heroVideoUrl: (next as any).media?.heroVideoUrl || "",
      heroImageUrl: (next as any).media?.heroImageUrl || "",
      gallery: (((next as any).media?.gallery || []) as any[]).slice(0, 5),
    },
    chips: Array.isArray((next as any).chips) ? (next as any).chips : [],
  } as TripRecord;

  if (idx >= 0) {
    all[idx] = normalized;
  } else {
    all.push(normalized);
  }
  saveAll(all);
  return normalized;
}

export function createDraftTrip(kind: TripKind): TripRecord {
  const all = loadAll();
  const id = uid();

  /**
   * ✅ Viktigt:
   * Din kodbas verkar ibland använda "type" och ibland "kind".
   * TripRecord från localStore saknar "kind" (enligt build-felet),
   * men för att INTE knäcka andra delar så skriver vi båda i runtime.
   */
  const draft: any = {
    id,
    slug: ensureUniqueSlug("ny-resa", all),
    status: "DRAFT",

    // skriv båda, så allt fortsätter funka oavsett vad resten läser
    type: kind,
    kind,

    title: "Ny resa",
    subtitle:
      kind === "DAY" ? "Dagsresa" : kind === "MULTI" ? "Flerdagsresa" : "Nöjesresa",
    intro: "",
    fromPriceSEK: undefined,
    chips: [],
    rating: undefined,
    about: "",
    facts:
      kind === "MULTI"
        ? { durationLabel: "—", accommodation: "—", meals: "—" }
        : { durationLabel: "—" },
    itinerary: kind === "MULTI" ? [{ title: "Dag 1", description: "" }] : [],
    media: {
      heroVideoUrl: "",
      heroImageUrl: "",
      gallery: ["", "", "", "", ""],
    },
  };

  all.push(draft as TripRecord);
  saveAll(all);
  return draft as TripRecord;
}

export function setTripStatus(id: string, status: TripRecord["status"]) {
  const all = loadAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx < 0) return;
  all[idx] = { ...(all[idx] as any), status } as TripRecord;
  saveAll(all);
}

export function deleteTrip(id: string) {
  const all = loadAll().filter((t) => t.id !== id);
  saveAll(all);
}

// För publika sidan: bara PUBLISHED (om inte preview)
export function getPublicTripBySlug(slug: string, preview: boolean): TripRecord | null {
  const t = getAdminTripBySlug(slug);
  if (!t) return null;
  if (preview) return t;
  return (t as any).status === "PUBLISHED" ? t : null;
}
