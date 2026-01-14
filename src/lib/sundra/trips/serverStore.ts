// src/lib/sundra/trips/serverStore.ts
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { TripRecord, TripStatus, TripType } from "./types";

type DbShape = { trips: TripRecord[] };

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "sundra-trips.json");

function nowISO() {
  return new Date().toISOString();
}

/**
 * ✅ Normaliserar status så att både uppercase och lowercase funkar.
 * - "DRAFT" -> "draft"
 * - "PUBLISHED" -> "published"
 * - "ARCHIVED" -> "archived"
 */
function normalizeStatus(v: unknown): TripStatus {
  const s = String(v ?? "").trim();

  // vanligaste varianter
  if (s === "DRAFT" || s === "draft") return "draft" as TripStatus;
  if (s === "PUBLISHED" || s === "published") return "published" as TripStatus;
  if (s === "ARCHIVED" || s === "archived") return "archived" as TripStatus;

  // fallback (om någon skulle skicka annat)
  return "draft" as TripStatus;
}

function ensureDefaults(t: TripRecord): TripRecord {
  const media = (t as any)?.media ?? null;

  return {
    ...t,
    status: normalizeStatus((t as any)?.status),
    badges: Array.isArray((t as any)?.badges) ? (t as any).badges : [],
    media: {
      heroVideoUrl: media?.heroVideoUrl ?? "",
      heroImageUrl: media?.heroImageUrl ?? "",
      gallery: Array.isArray(media?.gallery) ? media.gallery : [],
    },
    facts: (t as any)?.facts ?? {},
    itinerary: Array.isArray((t as any)?.itinerary) ? (t as any).itinerary : [],
    rating: (t as any)?.rating ?? {},
  } as TripRecord;
}

async function readDb(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as DbShape;

    return {
      trips: Array.isArray(parsed?.trips) ? parsed.trips.map(ensureDefaults) : [],
    };
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const fresh: DbShape = { trips: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(fresh, null, 2), "utf8");
    return fresh;
  }
}

async function writeDb(db: DbShape) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function uniqueSlug(base: string, excludeId?: string) {
  const db = await readDb();
  const b = slugify(base) || "resa";

  let s = b;
  let n = 2;

  const exists = (x: string) =>
    db.trips.some((t) => t.slug === x && (!excludeId || t.id !== excludeId));

  while (exists(s)) {
    s = `${b}-${n++}`;
  }
  return s;
}

// ===== Public helpers =====
export async function getPublishedTripBySlug(slug: string) {
  const db = await readDb();
  return (
    db.trips.find((t) => t.slug === slug && normalizeStatus((t as any).status) === ("published" as TripStatus)) ??
    null
  );
}

export async function getTripById(id: string) {
  const db = await readDb();
  return db.trips.find((t) => t.id === id) ?? null;
}

export async function listTrips(filter?: { status?: TripStatus | "ALL" }) {
  const db = await readDb();
  const status = filter?.status ?? "ALL";

  const all = db.trips
    .map(ensureDefaults)
    .sort((a, b) => String((b as any).updatedAt || "").localeCompare(String((a as any).updatedAt || "")));

  if (status === "ALL") return all;

  const wanted = normalizeStatus(status);
  return all.filter((t) => normalizeStatus((t as any).status) === wanted);
}

// ===== Admin mutations =====
export async function createTrip(input: { title: string; type: TripType; slug?: string }) {
  const db = await readDb();
  const id = crypto.randomUUID();
  const createdAt = nowISO();
  const slug = await uniqueSlug(input.slug || input.title);

  const trip: TripRecord = ensureDefaults({
    id,
    slug,
    status: "draft" as TripStatus,
    type: input.type,
    title: input.title,

    // vanliga fält i din editor
    subtitle: "",
    durationLabel: "",
    intro: "",
    description: "",

    badges: [],
    fromPriceSEK: undefined,

    media: { heroVideoUrl: "", heroImageUrl: "", gallery: [] },
    facts: {},
    itinerary: [],
    rating: {},

    createdAt,
    updatedAt: createdAt,
  } as any);

  db.trips.push(trip);
  await writeDb(db);
  return trip;
}

export async function updateTrip(id: string, patch: Partial<TripRecord>) {
  const db = await readDb();
  const idx = db.trips.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const current = ensureDefaults(db.trips[idx]);

  // ✅ TS-safe: garantera media lokalt (fixar "possibly null/undefined")
  const currentMedia =
    (current as any).media ?? ({ heroVideoUrl: "", heroImageUrl: "", gallery: [] as string[] } as any);

  // slug: om någon försöker ändra slug, gör den unik
  let nextSlug = (current as any).slug;
  if (typeof (patch as any).slug === "string" && (patch as any).slug.trim() && (patch as any).slug !== (current as any).slug) {
    nextSlug = await uniqueSlug((patch as any).slug, id);
  }

  const next: TripRecord = ensureDefaults({
    ...current,
    ...patch,
    slug: nextSlug,
    status: (patch as any).status !== undefined ? normalizeStatus((patch as any).status) : normalizeStatus((current as any).status),
    updatedAt: nowISO(),
    media: {
      heroVideoUrl: (patch as any).media?.heroVideoUrl ?? currentMedia.heroVideoUrl,
      heroImageUrl: (patch as any).media?.heroImageUrl ?? currentMedia.heroImageUrl,
      gallery: (patch as any).media?.gallery ?? currentMedia.gallery,
    },
  } as any);

  db.trips[idx] = next;
  await writeDb(db);
  return next;
}

export async function publishTrip(id: string) {
  const db = await readDb();
  const idx = db.trips.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const current = ensureDefaults(db.trips[idx]);
  const next: TripRecord = ensureDefaults({
    ...current,
    status: "published" as TripStatus,
    publishedAt: (current as any).publishedAt ?? nowISO(),
    updatedAt: nowISO(),
  } as any);

  db.trips[idx] = next;
  await writeDb(db);
  return next;
}

export async function archiveTrip(id: string) {
  const db = await readDb();
  const idx = db.trips.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const current = ensureDefaults(db.trips[idx]);
  const next: TripRecord = ensureDefaults({
    ...current,
    status: "archived" as TripStatus,
    archivedAt: (current as any).archivedAt ?? nowISO(),
    updatedAt: nowISO(),
  } as any);

  db.trips[idx] = next;
  await writeDb(db);
  return next;
}
