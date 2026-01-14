import type { TripDraft } from "./draftTypes";
import { makeId } from "./store";

function nowISO() {
  return new Date().toISOString();
}

export function makeSampleDayTrip(): TripDraft {
  const id = makeId();
  const now = nowISO();

  return {
    id,
    status: "DRAFT",
    type: "DAY",
    slug: "gekas-ullared-dagsresa",
    eyebrow: "Dagsresa, Shopping",
    title: "Gekås Ullared – Dagsresa, 1 dag",
    intro: "Smidig shoppingresa med bekväm buss, tydliga tider och flera upphämtningar i Skåne.",
    aboutTitle: "Om resan",
    aboutBody:
      "Följ med på en härlig dagsresa där du slipper tänka på körning, parkering och tider. Du kliver på vid en av våra upphämtningsplatser i Skåne och lutar dig tillbaka i en bekväm buss med trygg reseledning. När vi rullar hemåt har du shoppingen klar, kroppen utvilad och dagen fylld av känslan att resan var en del av upplevelsen. Perfekt för dig som vill resa enkelt, tryggt och smidigt – oavsett om du åker själv eller tillsammans med vänner.",
    highlights: { chips: ["Komfortbuss", "Flera orter i Skåne", "Planerade stopp", "Ingår"] },
    rating: { average: 4.6, count: 62 },
    facts: { durationLabel: "1 dag" },
    itinerary: [],
    media: {
      videoUrl: "",
      images: ["/resor/demo-ullared.jpg", "/resor/demo-tyskland.jpg", "/resor/demo-kryssning.jpg", "/resor/demo-liseberg.jpg", "/resor/demo-legoland.jpg"],
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function makeSampleMultiTrip(): TripDraft {
  const id = makeId();
  const now = nowISO();

  return {
    id,
    status: "DRAFT",
    type: "MULTI",
    slug: "stora-sverigeresan-8-dagar",
    eyebrow: "Flerdagsresa, Sverige",
    title: "Stora Sverigeresan, 8 dagar",
    intro: "En klassiker genom Sverige där kultur, natur och gemenskap möts – vi tar hand om resten.",
    aboutTitle: "Om resan",
    aboutBody:
      "Det här är en flerdagsresa för dig som vill uppleva mer – men utan att behöva hålla koll på alla detaljer själv. Du väljer upphämtning i sökaren och får en tydlig helhetskänsla redan från start. Resan är planerad för att kännas trygg, bekväm och lagom i tempo, med genomtänkta stopp längs vägen och ett upplägg som gör att du får ut det mesta av dagarna. Boende och måltider följer resans upplägg (enligt program), och du får en tydlig bild av vad som ingår innan du bokar. Ombord reser du i en komfortbuss där fokus ligger på reseupplevelsen: gemenskap, bekvämlighet och känslan av att vägen är en del av målet.",
    highlights: { chips: ["Komfortbuss", "Hotell", "Guldade stopp", "Middag ingår"] },
    rating: { average: 4.8, count: 41 },
    facts: { durationLabel: "8 dagar", accommodation: "Hotell", meals: "Utvalda måltider ingår" },
    itinerary: [
      { id: makeId(), title: "Dag 1 Hemorten – Falun", body: "Vi reser norrut med stopp för bensträckare och fika. Därefter fortsätter vi till Dalarna och Falun för övernattning." },
      { id: makeId(), title: "Dag 2 Falun – Carl Larsson gården – Hälsingegård – Bollnäs", body: "Guidad rundtur och naturstopp längs vägen innan vi når nästa hotell. Gemensam middag på kvällen." },
    ],
    media: {
      videoUrl: "",
      images: ["/resor/demo-kryssning.jpg", "/resor/demo-legoland.jpg", "/resor/demo-liseberg.jpg", "/resor/demo-ullared.jpg", "/resor/demo-tyskland.jpg"],
    },
    createdAt: now,
    updatedAt: now,
  };
}
