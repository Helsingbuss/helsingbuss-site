// src/lib/mailTemplates.tsx
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ✅ Importera dina befintliga mailkomponenter
import OfferAvbojd from "@/components/offers/OfferAvbojd";
import OfferBesvarad from "@/components/offers/OfferBesvarad";
import OfferBokningsbekraftelse from "@/components/offers/OfferBokningsbekraftelse";
import OfferGodkand from "@/components/offers/OfferGodkand";
import OfferInkommen from "@/components/offers/OfferInkommen";
import OfferMakulerad from "@/components/offers/OfferMakulerad";

// Statusnycklar vi använder
export type TemplateKey =
  | "inkommen"
  | "besvarad"
  | "godkand"
  | "avbojd"
  | "makulerad"
  | "bokningsbekraftelse";

// Gemensamma props vi skickar från backenden
export type OfferEmailProps = {
  offerNumber: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  from?: string;
  to?: string;
  date?: string;
  time?: string;
  passengers?: number;

  via?: string;   // ✅ enligt din tabell
  stop?: string;  // ✅ enligt din tabell

  return_from?: string;
  return_to?: string;
  return_date?: string;
  return_time?: string;

  price?: string;
  currency?: string;
  notes?: string;

  adminLink?: string;
  customerLink?: string;
};

// Gör om OfferEmailProps → det "offer"-objekt som dina komponenter vill ha.
function toOfferObject(p: OfferEmailProps) {
  return {
    // Kärninfo
    offer_number: p.offerNumber,
    contact_person: p.customerName,
    customer_email: p.customerEmail,
    customer_phone: p.customerPhone,

    // Resa
    departure_place: p.from,
    destination: p.to,
    departure_date: p.date,
    departure_time: p.time,
    passengers: p.passengers,

    // ✅ via/stop (inte stopover_places)
    via: p.via,
    stop: p.stop,

    return_departure: p.return_from,
    return_destination: p.return_to,
    return_date: p.return_date,
    return_time: p.return_time,

    notes: p.notes,

    // Länkar som många mallar visar
    adminLink: p.adminLink,
    customerLink: p.customerLink,

    // Pris (om mallen visar det)
    price: p.price,
    currency: p.currency,
  };
}

// Små wrappers som anropar dina komponenter med {offer: ...}
// Vi castar till any för att undvika TS-konflikter med dina komponenters egna prop-typer.
const InkommenWrapper: React.FC<OfferEmailProps> = (p) =>
  React.createElement(OfferInkommen as any, { offer: toOfferObject(p) });

const BesvaradWrapper: React.FC<OfferEmailProps> = (p) =>
  React.createElement(OfferBesvarad as any, { offer: toOfferObject(p) });

const GodkandWrapper: React.FC<OfferEmailProps> = (p) =>
  React.createElement(OfferGodkand as any, { offer: toOfferObject(p) });

const AvbojdWrapper: React.FC<OfferEmailProps> = (p) =>
  React.createElement(OfferAvbojd as any, { offer: toOfferObject(p) });

const MakuleradWrapper: React.FC<OfferEmailProps> = (p) =>
  React.createElement(OfferMakulerad as any, { offer: toOfferObject(p) });

const BokningsbekraftelseWrapper: React.FC<OfferEmailProps> = (p) =>
  React.createElement(OfferBokningsbekraftelse as any, { offer: toOfferObject(p) });

// Koppling status → wrapper (nu matchar prop-typerna OfferEmailProps)
const templates: Record<TemplateKey, React.ComponentType<OfferEmailProps>> = {
  inkommen: InkommenWrapper,
  besvarad: BesvaradWrapper,
  godkand: GodkandWrapper,
  avbojd: AvbojdWrapper,
  makulerad: MakuleradWrapper,
  bokningsbekraftelse: BokningsbekraftelseWrapper,
};

// Förnuftiga ämnesrader
export function subjectFor(template: TemplateKey, offerNumber: string) {
  switch (template) {
    case "inkommen":
      return `Vi har tagit emot din offertförfrågan (${offerNumber})`;
    case "besvarad":
      return `Offert ${offerNumber} – nytt prisförslag`;
    case "godkand":
      return `Bekräftelse – Offert ${offerNumber} godkänd`;
    case "avbojd":
      return `Offert ${offerNumber} – avböjd`;
    case "makulerad":
      return `Offert ${offerNumber} – makulerad`;
    case "bokningsbekraftelse":
      return `Bokningsbekräftelse – ${offerNumber}`;
  }
}

// Rendera vald mall till HTML
export function renderOfferEmail(template: TemplateKey, props: OfferEmailProps): string {
  const Cmp = templates[template];
  const html = renderToStaticMarkup(<Cmp {...props} />);
  return "<!doctype html>" + html;
}
