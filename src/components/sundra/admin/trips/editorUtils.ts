// src/components/sundra/admin/trips/editorUtils.ts
import type { TripRecord, TripType } from "@/lib/sundra/trips/types";

/** ✅ Local type (nya editorn använder description) */
export type ItineraryDay = {
  title: string;
  description: string;
};

/** ------------ Basics ------------- */
export function parseLinesToArray(s: string) {
  return (s || "")
    .split(/\r?\n/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** ✅ används av TripEditorHeader */
export function tripTitleForHeader(trip: TripRecord | null, loading: boolean) {
  if (loading) return "Laddar…";
  if (!trip) return "Redigera resa";
  const t = String((trip as any).title ?? "").trim();
  return t || "Redigera resa";
}

/** ------------ Numbers ------------- */
export function safeNumber(input: any): number | null {
  const s = String(input ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** ------------ Facts ------------- */
/**
 * Stödjer:
 * - string[]
 * - { label/value/text }[]
 * - null/undefined
 *
 * Returnerar text som passar i textarea (en rad per fact).
 */
export function factsToText(facts: any): string {
  if (!facts) return "";
  if (typeof facts === "string") return facts;

  if (Array.isArray(facts)) {
    return facts
      .map((f) => {
        if (typeof f === "string") return f.trim();
        const label = String(f?.label ?? f?.title ?? "").trim();
        const value = String(f?.value ?? "").trim();
        const text = String(f?.text ?? "").trim();

        // prioritet: "label: value" → "text" → "label"
        if (label && value) return `${label}: ${value}`;
        if (text) return text;
        if (label) return label;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  // fallback
  return "";
}

/**
 * Tar textarea-text och gör array:
 * - tar bort bullets "•" "-" "*"
 * - behåller resten som string-rader
 */
export function parseFacts(text: string): string[] {
  return (text || "")
    .split(/\r?\n/g)
    .map((row) => row.trim())
    .map((row) => row.replace(/^[-•*]\s*/g, "").trim())
    .filter(Boolean);
}

/** -------------------------
 *  ITINERARY <-> TEXT
 *  Format:
 *  Dag 1
 *  <beskrivning...>
 *
 *  ---
 *
 *  Dag 2
 *  <beskrivning...>
 *  ------------------------- */

function getDayBody(d: any): string {
  // ✅ stöd för äldre struktur som kan ha text/body/content
  const v = d?.description ?? d?.text ?? d?.body ?? d?.content ?? "";
  return typeof v === "string" ? v : "";
}

export function itineraryToText(itinerary?: ItineraryDay[]) {
  const it = Array.isArray(itinerary) ? itinerary : [];
  return it
    .map((d: any) => {
      const title = typeof d?.title === "string" ? d.title : "";
      const body = getDayBody(d);
      return `${title}\n${body}`.trim();
    })
    .filter(Boolean)
    .join("\n\n---\n\n");
}

export function textToItinerary(type: TripType, itineraryText: string): ItineraryDay[] {
  if (type !== "MULTI") return [];

  const raw = String(itineraryText || "").trim();
  if (!raw) return [];

  // Dela på --- (med valfria radbrytningar)
  const blocks = raw
    .split(/\r?\n\s*---\s*\r?\n/g)
    .map((b) => b.trim())
    .filter(Boolean);

  const days: ItineraryDay[] = blocks.map((block, idx) => {
    const lines = block.split(/\r?\n/g);

    const first = (lines.shift() || "").trim();
    const title = first || `Dag ${idx + 1}`;
    const description = lines.join("\n").trim();

    return { title, description };
  });

  return days;
}

/** -------------------------
 *  NORMALISERING
 *  ------------------------- */

export function normalizeItinerary(anyTrip: any): ItineraryDay[] {
  const raw =
    anyTrip?.itinerary ??
    anyTrip?.days ??
    anyTrip?.dayPrograms ??
    anyTrip?.day_programs ??
    null;

  // Already array
  if (Array.isArray(raw)) {
    return raw.map((d: any, idx: number) => ({
      title: String(d?.title ?? d?.dayTitle ?? d?.name ?? `Dag ${idx + 1}`),
      description: String(d?.description ?? d?.text ?? d?.body ?? d?.content ?? ""),
    }));
  }

  // JSON string
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((d: any, idx: number) => ({
          title: String(d?.title ?? d?.dayTitle ?? d?.name ?? `Dag ${idx + 1}`),
          description: String(d?.description ?? d?.text ?? d?.body ?? d?.content ?? ""),
        }));
      }
    } catch {
      // ignore
    }
  }

  return [];
}

export function withNormalizedItinerary(trip: TripRecord): TripRecord {
  return {
    ...trip,
    itinerary: normalizeItinerary(trip),
  } as TripRecord;
}
