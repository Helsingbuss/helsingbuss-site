// src/lib/sundra/trips/draftTypes.ts

export type TripDraftType = "DAY" | "MULTI" | "FUN" | "WINTER" | "CRUISE";
export type TripDraftStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type TripDraftItineraryDay = {
  id: string;
  title: string;
  body: string;
};

export type TripDraft = {
  id: string;
  status: TripDraftStatus;
  type: TripDraftType;

  slug: string;
  eyebrow?: string | null;

  title: string;
  intro: string;

  aboutTitle?: string | null;
  aboutBody: string;

  highlights: { chips: string[] };
  rating: { average: number; count: number };

  facts: {
    durationLabel?: string | null;
    accommodation?: string | null;
    meals?: string | null;
  };

  itinerary: TripDraftItineraryDay[];

  media: {
    videoUrl?: string | null;
    images: string[];
  };

  createdAt?: string;
  updatedAt?: string;
};
