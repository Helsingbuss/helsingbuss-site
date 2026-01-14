// src/lib/sundra/trips/types.ts

/** --------------------------
 *  Grundtyper för resor
 *  -------------------------- */

export type TripType = "DAY" | "MULTI" | "FUN";

/**
 * OBS:
 * Du har kod som använder UPPERCASE (PUBLISHED) i local/server store
 * och kod som använder lowercase (published) i repo/shared/DB.
 * Därför tillåter vi båda så TS inte bråkar.
 */
export type TripStatusUpper = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TripStatusLower = "draft" | "published" | "archived";
export type TripStatus = TripStatusUpper | TripStatusLower;

/** Alias som vissa filer vill ha */
export type TripKind = TripType;

/** Itinerary i admin-editorn (title + description) */
export type ItineraryDay = {
  title: string;
  description: string;
};

/** Fakta-rutan */
export type TripFacts = {
  durationLabel?: string | null;
  accommodation?: string | null;
  meals?: string | null;
  [k: string]: any;
};

/** Media/metadata som kan ligga i trip.media */
export type TripMedia = {
  heroVideoUrl?: string | null;
  heroImageUrl?: string | null;

  /**
   * Admin UI använder string[] (join("\n") osv).
   * Om du senare vill köra {url,alt} kan du lägga det i ett annat fält.
   */
  gallery?: string[] | null;

  /** Legacy/public preview */
  videoUrl?: string | null;
  images?: string[] | null;

  /** Används av TripEditor (programSummary) */
  programSummary?: string | null;

  pdfUrl?: string | null;

  [k: string]: any;
};

/** ✅ Huvudrecord för admin/server/repo */
export type TripRecord = {
  id: string;
  status: TripStatus;
  type: TripType;

  title: string;
  slug: string;

  subtitle?: string | null;
  durationLabel?: string | null;

  intro?: string | null;
  description?: string | null;

  lead?: string | null;
  about?: string | null;

  fromPriceSEK?: number | null;

  badges?: string[];

  facts?: TripFacts;
  itinerary?: ItineraryDay[];

  ratingAverage?: number | null;
  ratingCount?: number | null;

  media?: TripMedia | null;

  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  archivedAt?: string | null;

  /** Om du råkar ha snake_case i vissa delar */
  created_at?: string | null;
  updated_at?: string | null;

  [k: string]: any;
};

/**
 * ✅ TripDraft (public preview / sample / store)
 * Din "marknads"-shape som TripPreviewTemplate använder.
 */
export type TripDraft = {
  id: string;
  status: TripStatusUpper; // här kör du uppercase i UI/store
  type: TripType;
  slug: string;

  eyebrow?: string | null;
  title: string;
  intro: string;

  aboutTitle?: string | null;
  aboutBody: string;

  highlights: { chips: string[] };

  rating: { average: number; count: number };

  facts: {
    durationLabel?: string;
    accommodation?: string;
    meals?: string;
    [k: string]: any;
  };

  itinerary: { id: string; title: string; body: string }[];

  media: {
    videoUrl?: string;
    images: string[];
    [k: string]: any;
  };

  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
};
