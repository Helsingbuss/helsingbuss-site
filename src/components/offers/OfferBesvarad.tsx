// src/components/offers/OfferBesvarad.tsx
import Image from "next/image";
import StatusBadge from "@/components/StatusBadge";

/** Globala rattar för radavstånd */
const LINE_HEIGHT = 1.5;   // generellt
const CARD_LH     = 1.25;  // tajtare i toppkorten
const LEG_LH      = 1.45;  // radavstånd i rese-korten

type Props = { offer: any };

function v(x: any, fallback = "—") {
  if (x === null || x === undefined || x === "") return fallback;
  return String(x);
}
function kr(n: any): string {
  if (n === null || n === undefined || n === "" || isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("sv-SE") + " kr";
}

export default function OfferBesvarad({ offer }: Props) {
  const roundTrip = Boolean(offer?.round_trip);
  const withinSweden = (offer?.trip_type || "sverige") !== "utrikes";

  // Ben 1
  const leg1 = {
    title: withinSweden ? "Bussresa inom Sverige" : "Bussresa utomlands",
    date: v(offer?.departure_date),
    time: v(offer?.departure_time),
    from: v(offer?.departure_place),
    to: v(offer?.destination),
    pax: v(offer?.passengers),
    extra: v(offer?.notes, "Ingen information."),
    exVat: offer?.leg1_price_ex_vat ?? offer?.leg1_ex_vat ?? null,
    vat: offer?.leg1_vat ?? null,
    total: offer?.leg1_total ?? null,
  };

  // Ben 2 (endast om tur & retur)
  const leg2 = roundTrip
    ? {
        title: withinSweden ? "Bussresa inom Sverige" : "Bussresa utomlands",
        date: v(offer?.return_date),
        time: v(offer?.return_time),
        from: v(offer?.destination),
        to: v(offer?.departure_place),
        pax: v(offer?.passengers),
        extra: v(offer?.notes, "Ingen information."),
        exVat: offer?.leg2_price_ex_vat ?? offer?.leg2_ex_vat ?? null,
        vat: offer?.leg2_vat ?? null,
        total: offer?.leg2_total ?? null,
      }
    : null;

  const trips = leg2 ? [leg1, leg2] : [leg1];

  // Topp-summering
  const sumEx = offer?.price_ex_vat ?? offer?.sum_ex_vat ?? null;
  const vat    = offer?.vat ?? null;
  const total  = offer?.price_total ?? offer?.total ?? null;

  const offerNo = v(offer?.offer_number, "HB25XXX");

  return (
    <div className="min-h-screen bg-[#f5f4f0] py-6">
      <div className="mx-auto w-full max-w-4xl bg-white rounded-lg shadow px-6 py-6">
        {/* Header-rad: logga + status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Image src="/mork_logo.png" alt="Helsingbuss" width={360} height={64} priority />
          </div>
          <div className="pt-1 text-right">
            <StatusBadge status="besvarad" />
          </div>
        </div>

        {/* Titel */}
        <h1 className="mt-2 text-2xl font-semibold text-[#0f172a]">
          Offert {offerNo}
        </h1>

        {/* Toppkort: Offertinfo + Kundinfo */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Offertinformation + pris */}
          <div
            className="border rounded-lg p-4 space-y-[4px]"
            style={{ lineHeight: CARD_LH as number }}
          >
            <Row label="Offertdatum" value={v(offer?.offer_date, "—")} boldLabel />
            <Row label="Er referens"  value={v(offer?.customer_reference, "—")} boldLabel />
            <Row label="Vår referens"  value={v(offer?.internal_reference, "—")} boldLabel />

            <div className="h-[6px]" />
            <Row label="Summa exkl. moms" value={kr(sumEx)} boldValue />
            <Row label="Moms"              value={kr(vat)}   boldValue />
            <Row label="Totalsumma"        value={kr(total)} boldValue />

            {offer?.payment_terms && (
              <Row label="Betalningsvillkor" value={v(offer?.payment_terms)} boldLabel />
            )}

            <div className="text-[12px] text-[#0f172a]/70 mt-2">
              Fakturan skickas efter uppdraget
            </div>
          </div>

          {/* Kundkort */}
          <div
            className="border rounded-lg p-4 space-y-[4px]"
            style={{ lineHeight: CARD_LH as number }}
          >
            <Row label="Namn"    value={v(offer?.contact_person, "—")} boldLabel />
            <Row label="Adress"  value={v(offer?.customer_address, "—")} boldLabel />
            <Row label="Telefon" value={v(offer?.contact_phone, "—")} boldLabel />
            <Row label="E-post"  value={v(offer?.contact_email, "—")} wrap boldLabel />
          </div>
        </div>

        {/* Introtext */}
        <div className="mt-6 text-[15px] text-[#0f172a]/80" style={{ lineHeight: LINE_HEIGHT }}>
          <p>
            <span className="italic">Hej!</span> <br />
            Ert offertförslag är klart – ta del av detaljerna. Vi har samlat allt ni behöver: rutt,
            tider, fordon och pris – tydligt och överskådligt. Godkänn offerten så säkrar vi
            kapacitet och planerar den perfekta resan för er.
          </p>
        </div>

        {/* Reseavsnitt – rutor under varandra, pris till höger i varje ruta */}
        <div className="mt-6 space-y-6" style={{ lineHeight: LEG_LH }}>
          {trips.map((t, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-2 text-[#0f172a] mb-2">
                <Image src="/maps_pin.png" alt="Pin" width={18} height={18} />
                <span className="font-semibold">{t.title}</span>
                <span className="text-xs text-[#0f172a]/50 ml-2">Avstånd och tider baseras preliminärt</span>
              </div>

              <div className="border rounded-lg p-3 text-[14px] text-[#0f172a]">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Vänster – info */}
                  <div className="flex-1 min-w-0">
                    <div><span className="font-semibold">Avgång:</span> {v(t.date)} kl {v(t.time)}</div>
                    <div><span className="font-semibold">Från:</span> {v(t.from)}</div>
                    <div><span className="font-semibold">Till:</span> {v(t.to)}</div>
                    <div><span className="font-semibold">Antal passagerare:</span> {v(t.pax)}</div>

                    <div className="mt-2">
                      <span className="font-semibold">Övrig information:</span>{" "}
                      <span className="whitespace-pre-wrap">{t.extra}</span>
                    </div>
                  </div>

                  {/* Höger – prisstack */}
                  <div className="shrink-0 w-full md:w-[260px]">
                    <div className="grid grid-cols-2 gap-y-1">
                      <span className="text-[#0f172a]/60">Pris exkl. moms</span>
                      <span className="text-right">{kr(t.exVat)}</span>

                      <span className="text-[#0f172a]/60">Moms</span>
                      <span className="text-right">{kr(t.vat)}</span>

                      <span className="text-[#0f172a]/60">Summa</span>
                      <span className="text-right font-semibold">{kr(t.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ======= Flyttat hit: Rubrik + knappar under rutorna ======= */}
        <div className="mt-8">
          <h2 className="text-center text-lg md:text-xl font-semibold text-[#0f172a] mb-3">
            Klicka nedan för att göra en bokningsförfrågan
          </h2>
          <div className="flex flex-col md:flex-row justify-center gap-3">
            <CTA href={`/booking?offer=${encodeURIComponent(offerNo)}`} label="Acceptera offert" />
            <CTA href={`/offer/change?offer=${encodeURIComponent(offerNo)}`} label="Ändra din offert" variant="secondary" />
            <CTA href={`/offer/decline?offer=${encodeURIComponent(offerNo)}`} label="Avböj" variant="ghost" />
          </div>
        </div>

        {/* Villkor + info (fet öppettid & jour) */}
        <div className="mt-7 text-[14px] text-[#0f172a]/70" style={{ lineHeight: 1.5 }}>
          <p>
            Genom att acceptera denna offert bekräftar ni samtidigt att ni tagit del av våra
            resevillkor. Observera att vi reserverar oss för att det aktuella datumet kan vara
            fullbokat. Slutlig kapacitet kontrolleras vid bokningstillfället och bekräftas först
            genom en skriftlig bokningsbekräftelse från oss. Vill du boka resan eller har du frågor
            och synpunkter? Då är du alltid välkommen att kontakta oss – vi hjälper dig gärna. Våra
            ordinarie öppettider är vardagar kl. <strong>08:00–17:00</strong>. För akuta bokningar
            med kortare varsel än två arbetsdagar ber vi dig ringa vårt journummer:{" "}
            <strong>010–777 21 58</strong>.
          </p>
        </div>

        {/* Signaturblock */}
        <div className="mt-5 grid gap-2 text-xs text-[#0f172a]/60 sm:grid-cols-2 lg:grid-cols-4" style={{ lineHeight: LINE_HEIGHT }}>
          <div>
            <div>Helsingbuss</div>
            <div>Höjderupsgränd 12</div>
            <div>254 45 Helsingborg</div>
            <div>helsingbuss.se</div>
          </div>
          <div>
            <div>Tel. +46 (0) 405 38 38</div>
            <div>Jour: +46 (0) 777 21 58</div>
            <div>info@helsingbuss.se</div>
          </div>
          <div>
            <div>Bankgiro: 9810-01 3931</div>
            <div>Org.nr: 890101-1391</div>
            <div>VAT nr: SE890101931301</div>
          </div>
          <div>
            <div>Swedbank</div>
            <div>IBAN: 20000000000000000</div>
            <div>Swiftadress/BIC: XXXXXX</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Enkel rad i toppkorten */
function Row({
  label,
  value,
  wrap = false,
  boldLabel = false,
  boldValue = false,
  lh = CARD_LH,
}: {
  label: string;
  value: string;
  wrap?: boolean;
  boldLabel?: boolean;
  boldValue?: boolean;
  lh?: number;
}) {
  return (
    <div className="flex items-baseline gap-2 py-0" style={{ lineHeight: lh }}>
      <span className={`text-sm ${boldLabel ? "font-semibold" : ""} text-[#0f172a]/70`}>{label}</span>
      <span className={`text-sm ${boldValue ? "font-semibold" : ""} text-[#0f172a] ${wrap ? "break-all" : "whitespace-nowrap"}`}>
        {value}
      </span>
    </div>
  );
}

/** Knapp-komponent (samma stil, bara flyttad längre ner i layouten) */
function CTA({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const base = "inline-flex items-center px-5 py-2 rounded-lg text-sm transition-colors";
  const styles =
    variant === "primary"
      ? "bg-[#194C66] text-white hover:bg-[#143a4e]"
      : variant === "secondary"
      ? "bg-[#44566c] text-white hover:bg-[#37485b]"
      : "bg-[#e5e7eb] text-[#111827] hover:bg-[#d8dade]";
  return (
    <a href={href} className={`${base} ${styles}`}>
      {label}
    </a>
  );
}
