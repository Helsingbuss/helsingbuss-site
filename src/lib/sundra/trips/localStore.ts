// src/lib/sundra/trips/localStore.ts

export type TripType = "DAY" | "MULTI" | "FUN";
export type TripStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type TripItineraryItem = {
  title: string; // t.ex. "Dag 1 Hemorten – Falun"
  text: string;
};

export type TripRating = {
  value: number; // t.ex. 4.8
  count: number; // t.ex. 41
};

export type TripFact = {
  label: string; // t.ex. "Reslängd"
  value: string; // t.ex. "8 dagar"
};

export type TripRecord = {
  id: string;
  slug: string;

  type: TripType;
  status: TripStatus;

  title: string;
  subtitle?: string; // t.ex. "Flerdagsresa, Sverige"
  intro: string;

  // Texten "Om resan"
  description: string;

  // Media (du kan byta dessa via admin sen)
  heroVideoUrl?: string;
  heroImageUrl?: string;
  gallery: string[]; // fler bilder

  badges: string[]; // små "chips" (Komfortbuss, Hotell, osv.)

  // Pris (från-priser)
  priceFromSEK?: number;
  childPriceFromSEK?: number;

  // Betyg
  rating?: TripRating;

  // Fakta-rutor
  facts: TripFact[];

  // Resplan (för flerdags)
  itinerary: TripItineraryItem[];

  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "sundra.trips.v1";

function nowISO() {
  return new Date().toISOString();
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const SEED_TRIPS: TripRecord[] = [
  {
    id: "seed_day_1",
    slug: "gekas-ullared-dagsresa",
    type: "DAY",
    status: "PUBLISHED",
    title: "Gekås Ullared – Dagsresa, 1 dag",
    subtitle: "Dagsresa, Shopping, 1 dag",
    intro: "Smidig shoppingresa med bekväm buss, tydliga tider och flera upphämtningar i Skåne.",
    description:
      "Följ med på en bekväm dagsresa till Gekås Ullared där du kan fokusera på shoppingen – vi tar hand om resan. Med tydliga tider, trygga upphämtningar och en skön bussresa får du en smidig upplevelse från start till mål. Resan passar perfekt för dig som vill åka enkelt, träffa andra resenärer och få en riktigt bra dag utan stress.",
    heroVideoUrl: "",
    heroImageUrl: "/resor/demo-ullared.jpg",
    gallery: ["/resor/demo-ullared.jpg", "/resor/demo-tyskland.jpg", "/resor/demo-kryssning.jpg"],
    badges: ["Komfortbuss", "Flera orter i Skåne", "Planerade stopp", "Ingår"],
    priceFromSEK: 399,
    childPriceFromSEK: undefined,
    rating: { value: 4.6, count: 62 },
    facts: [
      { label: "Reslängd", value: "1 dag" },
      { label: "Paus", value: "Planerade stopp" },
      { label: "Upphämtning", value: "Flera orter i Skåne" },
    ],
    itinerary: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "seed_multi_1",
    slug: "stora-sverigeresan-8-dagar",
    type: "MULTI",
    status: "PUBLISHED",
    title: "Stora Sverigeresan, 8 dagar",
    subtitle: "Flerdagsresa, Sverige",
    intro: "En rundresa genom Sverige där kultur, natur och gemenskap möts – du lutar dig tillbaka, vi tar hand om resten.",
    description:
      "Det här är en flerdagsresa för dig som vill uppleva mer – men utan att behöva hålla koll på alla detaljer själv. Du väljer upphämtning i sökaren ovan (vi har flera upphämtningsplatser i Skåne), därefter tar vi hand om helheten med ett tydligt upplägg från start till mål. Resan är planerad för att kännas trygg, bekväm och lagom i tempo, med genomtänkta stopp längs vägen och ett program som gör att du får ut det mesta av dagarna. Boende och måltider följer resans upplägg (enligt program), och du får en tydlig bild av vad som ingår redan innan du bokar. Ombord reser du i en komfortbuss där fokus ligger på reseupplevelsen: gemenskap, bekvämlighet och en resa som flyter fram. När vi blir fler som reser tillsammans skapas en extra fin känsla – man pratar, skrattar och delar upplevelser, samtidigt som du alltid kan ta en paus och bara njuta av vägen. Kort sagt: en resa där destinationerna spelar roll, men där vägen dit är minst lika viktig.",
    heroVideoUrl: "",
    heroImageUrl: "/resor/demo-kryssning.jpg",
    gallery: [
      "/resor/demo-kryssning.jpg",
      "/resor/demo-ullared.jpg",
      "/resor/demo-tyskland.jpg",
      "/resor/demo-legoland.jpg",
      "/resor/demo-liseberg.jpg",
    ],
    badges: ["Komfortbuss", "Hotell", "Guldade stopp", "Middag ingår"],
    priceFromSEK: 8995,
    childPriceFromSEK: undefined,
    rating: { value: 4.8, count: 41 },
    facts: [
      { label: "Reslängd", value: "8 dagar" },
      { label: "Boende", value: "Hotell" },
      { label: "Måltider", value: "Utvalda måltider ingår" },
    ],
    itinerary: [
      {
        title: "Dag 1 Hemorten – Falun",
        text: "Vi reser norrut med planerade stopp för bensträckare och fika. Därefter fortsätter vi mot Dalarna och Falun för övernattning. Gemensam middag på hotellet.",
      },
      {
        title: "Dag 2 Falun – Carl Larsson gården – Hälsingegård – Bollnäs",
        text: "Vi besöker Sundborn och Carl Larsson gården med guide. Resan fortsätter via vackra vägar och stopp längs vägen innan vi når Bollnäs för övernattning och middag.",
      },
    ],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
];

// ---- READ/WRITE ----

function loadTrips(): TripRecord[] {
  // Server/SSR: returnera seed (säkert)
  if (typeof window === "undefined") return SEED_TRIPS;

  const parsed = safeParse<TripRecord[]>(window.localStorage.getItem(STORAGE_KEY));
  if (parsed && Array.isArray(parsed) && parsed.length > 0) return parsed;

  // Om inget finns: initiera med seed
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TRIPS));
  return SEED_TRIPS;
}

function saveTrips(trips: TripRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

// ✅ VIKTIGT: listTrips är en FUNKTION (så listTrips() funkar)
export function listTrips(): TripRecord[] {
  return loadTrips();
}

export function getTripBySlug(slug: string): TripRecord | null {
  return listTrips().find((t) => t.slug === slug) ?? null;
}

export function getPublishedTripBySlug(slug: string): TripRecord | null {
  return listTrips().find((t) => t.slug === slug && t.status === "PUBLISHED") ?? null;
}

export function getTripById(id: string): TripRecord | null {
  return listTrips().find((t) => t.id === id) ?? null;
}

export function upsertTrip(input: TripRecord): TripRecord {
  const trips = listTrips();
  const idx = trips.findIndex((t) => t.id === input.id);

  const record: TripRecord = {
    ...input,
    updatedAt: nowISO(),
    createdAt: input.createdAt || nowISO(),
  };

  const next =
    idx >= 0 ? [...trips.slice(0, idx), record, ...trips.slice(idx + 1)] : [record, ...trips];

  saveTrips(next);
  return record;
}

export function setTripStatus(id: string, status: TripStatus) {
  const trips = listTrips();
  const idx = trips.findIndex((t) => t.id === id);
  if (idx < 0) return;

  const next = [...trips];
  next[idx] = { ...next[idx], status, updatedAt: nowISO() };
  saveTrips(next);
}

export function archiveTrip(id: string) {
  setTripStatus(id, "ARCHIVED");
}
