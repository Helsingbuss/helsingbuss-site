// src/lib/sundra/trips/store.ts
import type { TripDraft, TripStatus } from "./types";

const KEY = "sundra.trips.v1";

function safeNowISO() {
  return new Date().toISOString();
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function hasWindow() {
  return typeof window !== "undefined";
}

function uuid() {
  // fungerar i moderna browsers
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

export function makeId() {
  return uuid();
}

function normalizeStatus(input: TripStatus): TripStatus {
  const s = String(input ?? "").trim();

  // acceptera både uppercase/lowercase och skriv alltid uppercase
  const up = s.toUpperCase();
  if (up === "PUBLISHED") return "PUBLISHED" as TripStatus;
  if (up === "ARCHIVED") return "ARCHIVED" as TripStatus;
  return "DRAFT" as TripStatus;
}

function normalizeTrip(t: any): TripDraft {
  const now = safeNowISO();
  return {
    ...t,
    id: String(t?.id ?? makeId()),
    slug: String(t?.slug ?? ""),
    status: normalizeStatus(t?.status as TripStatus),
    title: String(t?.title ?? ""),
    intro: String(t?.intro ?? ""),
    aboutBody: String(t?.aboutBody ?? ""),
    highlights: t?.highlights ?? { chips: [] },
    rating: t?.rating ?? { average: 0, count: 0 },
    facts: t?.facts ?? {},
    itinerary: Array.isArray(t?.itinerary) ? t.itinerary : [],
    media: t?.media ?? { images: [] },
    createdAt: String(t?.createdAt ?? now),
    updatedAt: String(t?.updatedAt ?? now),
    publishedAt: t?.publishedAt ?? null,
    type: t?.type ?? "DAY",
  } as TripDraft;
}

export function loadAllTrips(): TripDraft[] {
  if (!hasWindow()) return [];
  const arr = safeParse<any[]>(localStorage.getItem(KEY), []);
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeTrip);
}

export function saveAllTrips(trips: TripDraft[]) {
  if (!hasWindow()) return;
  localStorage.setItem(KEY, JSON.stringify(trips));
}

export function getTrip(id: string): TripDraft | null {
  const trips = loadAllTrips();
  return trips.find((t) => t.id === id) ?? null;
}

export function upsertTrip(draft: TripDraft): TripDraft {
  const trips = loadAllTrips();
  const now = safeNowISO();

  const next: TripDraft = normalizeTrip({
    ...draft,
    status: normalizeStatus(draft.status),
    updatedAt: now,
  });

  const idx = trips.findIndex((t) => t.id === next.id);
  if (idx >= 0) trips[idx] = next;
  else trips.unshift(next);

  saveAllTrips(trips);
  return next;
}

export function setTripStatus(id: string, status: TripStatus): TripDraft | null {
  const trip = getTrip(id);
  if (!trip) return null;

  const now = safeNowISO();
  const nextStatus = normalizeStatus(status);

  const next: TripDraft = normalizeTrip({
    ...trip,
    status: nextStatus,
    updatedAt: now,
    publishedAt:
      String(nextStatus).toUpperCase() === "PUBLISHED"
        ? (trip.publishedAt ?? now)
        : trip.publishedAt ?? null,
  });

  upsertTrip(next);
  return next;
}

export function archiveTrip(id: string) {
  return setTripStatus(id, "ARCHIVED" as TripStatus);
}

export function publishTrip(id: string) {
  return setTripStatus(id, "PUBLISHED" as TripStatus);
}

export function unpublishTripToDraft(id: string) {
  return setTripStatus(id, "DRAFT" as TripStatus);
}

export function deleteTrip(id: string) {
  const trips = loadAllTrips().filter((t) => t.id !== id);
  saveAllTrips(trips);
}

export function slugExists(slug: string, excludeId?: string) {
  const s = (slug || "").trim().toLowerCase();
  if (!s) return false;
  return loadAllTrips().some((t) => String(t.slug || "").toLowerCase() === s && t.id !== excludeId);
}
