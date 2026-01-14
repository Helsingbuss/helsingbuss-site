// src/components/offers/OfferBokningsbekraftelse.tsx
import Image from "next/image";

// Återanvänd layout/komponenter (identiskt som Besvarad)
import OfferTopBar from "@/components/offers/OfferTopBar";
import OfferLeftSidebar from "@/components/offers/OfferLeftSidebar";
import TripLegGrid from "@/components/offers/TripLegGrid";
import TripLegCard from "@/components/offers/TripLegCard";

const TOPBAR_PX = 64;
const LINE_HEIGHT = 1.5;

type Breakdown = {
  grandExVat: number;
  grandVat: number;
  grandTotal: number;
  serviceFeeExVat?: number;
  legs?: { subtotExVat: number; vat: number; total: number }[];
};

function money(n?: number | null) {
  if (n == null) return "—";
  return n.toLocaleString("sv-SE", { style: "currency", currency: "SEK" });
}
function v(x: any, fallback = "—") {
  if (x === null || x === undefined || x === "") return fallback;
  return String(x);
}

// ——— små hjälpare (utan designpåverkan)
function tidyTime(t?: string | null) {
  if (!t) return undefined;
  if (t.includes(":")) return t.slice(0, 5);
  if (t.length >= 4) return `${t.slice(0, 2)}:${t.slice(2, 4)}`;
  return undefined;
}
function telSanitize(t?: string | null) {
  if (!t) return "";
  return t.replace(/[^\d+]/g, "");
}

export default function OfferBokningsbekraftelse({ offer }: any) {
  // härledning tur/retur (samma som Besvarad, men också via legs)
  const hasJsonLegs =
    (Array.isArray(offer?.legs) && offer.legs.length > 1) ||
    (Array.isArray(offer?.trip_legs) && offer.trip_legs.length > 1);

  const roundTrip =
    Boolean(offer?.round_trip) ||
    Boolean(
      offer?.return_date ??
        offer?.return_time ??
        offer?.return_departure ??
        offer?.return_destination
    ) ||
    hasJsonLegs;

  const withinSweden = (offer?.trip_type || "sverige") !== "utrikes";
  const email: string | undefined =
    offer?.contact_email || offer?.customer_email || undefined;

  const rawLegs = (offer?.legs ?? offer?.trip_legs) as any;
  const useLegs = Array.isArray(rawLegs) && rawLegs.length > 0;

  const trips = useLegs
    ? (rawLegs as any[]).map((leg, idx, arr) => {
        const baseTitle =
          arr.length === 1
            ? "Bussresa"
            : arr.length === 2
            ? idx === 0
              ? "Utresa"
              : "Återresa"
            : `Delresa ${idx + 1}`;

        const isFirst = idx === 0;

        return {
          title: baseTitle,
          date:
            leg.date ??
            leg.departure_date ??
            (isFirst ? offer?.departure_date : offer?.return_date),
          time: tidyTime(
            leg.time ??
              leg.start ??
              (isFirst ? offer?.departure_time : offer?.return_time)
          ),
          from:
            leg.from ??
            leg.departure_place ??
            (isFirst ? offer?.departure_place : offer?.destination),
          to:
            leg.to ??
            leg.destination ??
            (isFirst ? offer?.destination : offer?.departure_place),
          pax: leg.pax ?? offer?.passengers,
          extra: leg.extra ?? (offer?.notes || "Ingen information."),
        };
      })
    : [
        {
          title: roundTrip ? "Utresa" : "Bussresa",
          date: offer?.departure_date,
          time: tidyTime(offer?.departure_time),
          from: offer?.departure_place,
          to: offer?.destination,
          pax: offer?.passengers,
          extra: offer?.notes || "Ingen information.",
        },
        ...(roundTrip
          ? [
              {
                title: "Återresa",
                date: offer?.return_date,
                time: tidyTime(offer?.return_time),
                from: offer?.destination,
                to: offer?.departure_place,
                pax: offer?.passengers,
                extra: offer?.notes || "Ingen information.",
              },
            ]
          : []),
      ];

  const breakdown: Breakdown | null =
    typeof offer?.vat_breakdown === "object" && offer?.vat_breakdown
      ? (offer.vat_breakdown as Breakdown)
      : null;

  const totals = {
    ex: offer?.amount_ex_vat ?? breakdown?.grandExVat ?? null,
    vat: offer?.vat_amount ?? breakdown?.grandVat ?? null,
    sum: offer?.total_amount ?? breakdown?.grandTotal ?? null,
  };

  return (
    <div className="bg-[#f5f4f0] overflow-hidden">
      {/* TOPPRAD */}
      <div style={{ height: TOPBAR_PX }}>
        <OfferTopBar
          offerNumber={offer?.offer_number ?? "HB25XXXX"}
          customerNumber={offer?.customer_number ?? "K10023"}
          customerName={offer?.contact_person ?? "Kund"}
          status="bokningsbekräftelse"
        />
      </div>

      {/* TRE-KOLUMNERS LAYOUT */}
      <div style={{ height: `calc(100vh - ${TOPBAR_PX}px)` }}>
        <div className="grid h-full grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_550px] gap-0">
          {/* Vänster */}
          <div className="h-full">
            <OfferLeftSidebar />
          </div>

          {/* Mitten */}
          <main className="h-full pl-4 lg:pl-6 pr-2 lg:pr-3 py-4 lg:py-6">
            <div className="h-full bg-white rounded-xl shadow flex flex-col">
              <div className="px-6 pt-6">
                <Image
                  src="/mork_logo.png"
                  alt="Helsingbuss"
                  width={360}
                  height={64}
                  priority
                />
                <h1 className="mt-2 text-2xl font-semibold text-[#0f172a]">
                  Bokningsbekräftelse {offer?.offer_number || "—"}
                </h1>

                {/* Introtext */}
                <div
                  className="mt-5 text-[14px] text-[#0f172a]/80"
                  style={{ lineHeight: LINE_HEIGHT }}
                >
                  <p>
                    Hej!<br />
                    Er bokning är bekräftad. Nedan ser ni resans uppgifter. Behöver ni justera
                    tider, hållplatser, passagerare eller service ombord? Maila{" "}
                    <a className="underline" href="mailto:kundteam@helsingbuss.se">
                      kundteam@helsingbuss.se
                    </a>{" "}
                    så hjälper vi er. Vi ser fram emot att köra er!
                  </p>
                </div>

                {/* Resekort */}
                <div className="mt-5">
                  <TripLegGrid>
                    {trips.map((trip, idx) => {
                      const leg = breakdown?.legs?.[idx];
                      return (
                        <TripLegCard
                          key={idx}
                          title={
                            withinSweden
                              ? `Bussresa inom Sverige • ${trip.title}`
                              : `Bussresa utomlands • ${trip.title}`
                          }
                          subtitle="Avstånd och tider baseras preliminärt"
                          date={trip.date}
                          time={trip.time}
                          from={trip.from}
                          to={trip.to}
                          pax={trip.pax}
                          extra={trip.extra}
                          iconSrc="/busie.png"
                          footer={
                            breakdown?.legs ? (
                              <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 mt-3 text-[14px]">
                                <div className="text-[#0f172a]/70">Pris exkl. moms</div>
                                <div>{money(leg?.subtotExVat)}</div>
                                <div className="text-[#0f172a]/70">Moms</div>
                                <div>{money(leg?.vat)}</div>
                                <div className="text-[#0f172a]/70">Summa</div>
                                <div>{money(leg?.total)}</div>
                              </div>
                            ) : null
                          }
                        />
                      );
                    })}
                  </TripLegGrid>
                </div>

                {/* Informationsrader */}
                <div
                  className="mt-6 text-[14px] text-[#0f172a]/80"
                  style={{ lineHeight: LINE_HEIGHT }}
                >
                  <p>
                    Bekräftelsen avser ovan angivna uppgifter. Eventuella ändringar bekräftas
                    skriftligt av oss. Slutlig kapacitet är säkrad enligt denna bekräftelse.
                  </p>
                  <p className="mt-3">
                    Frågor inför resan? Vi hjälper gärna på vardagar kl. 08:00–17:00. För akuta
                    ärenden närmare än två arbetsdagar, ring <strong>jour: 010–777 21 58</strong>.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto px-6 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-[13px] text-[#0f172a]">
                  <div>
                    <div>Helsingbuss</div>
                    <div>Hofverbergsgatan 2B</div>
                    <div>254 43 Helsingborg</div>
                    <div>helsingbuss.se</div>
                  </div>
                  <div>
                    <div>Tel. +46 (0)10-405 38 38</div>
                    <div>Jour. +46 (0)10-777 21 58</div>
                    <div>info@helsingbuss.se</div>
                  </div>
                  <div>
                    <div>Bankgiro: 763-4157</div>
                    <div>Org.nr: 890101-3931</div>
                    <div>VAT nr: SE890101393101</div>
                  </div>
                  <div>
                    <div>Swedbank</div>
                    <div>IBAN: SE09 8000 0816 9581 4754 3998</div>
                    <div>Swift/BIC: SWEDSESS</div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Höger */}
          <aside className="h-full p-4 lg:p-6">
            <div className="h-full bg-white rounded-xl shadow flex flex-col">
              <div className="px-6 pt-6">
                <div className="inline-flex items-center rounded-full bg-[#eef5f9] px-3 py-1 text-sm text-[#194C66] font-medium">
                  Kunduppgifter
                </div>

                <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-6 gap-y-1 text-[14px] text-[#0f172a] leading-tight">
                  <dt className="font-semibold text-[#0f172a]/70 whitespace-nowrap">Offertdatum:</dt>
                  <dd className="text-[#0f172a] break-words">{v(offer?.offer_date, "—")}</dd>
                  <dt className="font-semibold text-[#0f172a]/70 whitespace-nowrap">Er referens:</dt>
                  <dd className="text-[#0f172a] break-words">{v(offer?.customer_reference, "—")}</dd>
                  <dt className="font-semibold text-[#0f172a]/70 whitespace-nowrap">Vår referens:</dt>
                  <dd className="text-[#0f172a] break-words">{v(offer?.internal_reference, "—")}</dd>
                  <dt className="font-semibold text-[#0f172a]/70 whitespace-nowrap">Namn:</dt>
                  <dd className="text-[#0f172a] break-words">{v(offer?.contact_person, "—")}</dd>
                  <dt className="font-semibold text-[#0f172a]/70 whitespace-nowrap">Adress:</dt>
                  <dd className="text-[#0f172a] break-words">{v(offer?.customer_address, "—")}</dd>
                  <dt className="font-semibold text-[#0f172a]/70 whitespace-nowrap">Telefon:</dt>
                  <dd className="text-[#0f172a] break-words">{v(offer?.contact_phone, "—")}</dd>
                  <dt className="font-semibold text-[#0f172a]/70 whitespace-nowrap">E-post:</dt>
                  <dd className="text-[#0f172a] break-words">{v(email, "—")}</dd>
                </dl>

                {/* Buss & chaufför */}
                <div className="mt-6">
                  <div className="font-semibold text-[#0f172a]">Buss & chaufför</div>
                  <dl className="mt-3 grid grid-cols-[auto,1fr] gap-x-6 gap-y-1 text-[14px] text-[#0f172a] leading-tight">
                    <dt className="font-semibold text-[#0f172a]/70 whitespace-nowrap">Buss:</dt>
                    <dd className="text-[#0f172a] break-words">
                      {v(offer?.bus_name, "—")}
                      {offer?.bus_reg ? ` • ${offer.bus_reg}` : ""}
                    </dd>
                    <dt className="font-semibold text-[#0f172a]/70 whitespace-nowrap">Chaufför:</dt>
                    <dd className="text-[#0f172a] break-words">{v(offer?.driver_name, "—")}</dd>
                    <dt className="font-semibold text-[#0f172a]/70 whitespace-nowrap">Telefon:</dt>
                    <dd className="text-[#0f172a] break-words">
                      {offer?.driver_phone ? (
                        <a className="underline" href={`tel:${telSanitize(offer.driver_phone)}`}>
                          {offer.driver_phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </dl>
                </div>

                {/* Pris – samma logik som Besvarad */}
                <div className="mt-6">
                  <div className="font-semibold text-[#0f172a]">
                    Offertinformation om kostnad
                  </div>

                  <div className="mt-3">
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: roundTrip ? "1fr 1fr 1fr" : "1fr 1fr" }}
                    >
                      <div className="text-[#0f172a]/70 text-sm"> </div>
                      <div className="text-[#0f172a]/70 text-sm font-semibold">Enkel</div>
                      {roundTrip && (
                        <div className="text-[#0f172a]/70 text-sm font-semibold">Tur&Retur</div>
                      )}
                    </div>

                    <Row
                      roundTrip={roundTrip}
                      label="Summa exkl. moms"
                      enkel={money(breakdown?.legs?.[0]?.subtotExVat ?? totals.ex)}
                      retur={roundTrip ? money(breakdown?.legs?.[1]?.subtotExVat) : undefined}
                    />
                    <Row
                      roundTrip={roundTrip}
                      label="Moms"
                      enkel={money(breakdown?.legs?.[0]?.vat ?? totals.vat)}
                      retur={roundTrip ? money(breakdown?.legs?.[1]?.vat) : undefined}
                    />
                    <Row
                      roundTrip={roundTrip}
                      label="Totalsumma"
                      enkel={money(breakdown?.legs?.[0]?.total ?? totals.sum)}
                      retur={roundTrip ? money(breakdown?.legs?.[1]?.total) : undefined}
                    />

                    <div className="mt-3 grid grid-cols-[1fr_auto] items-baseline">
                      <div className="text-[#0f172a]/70 text-sm">Offertkostnad för detta uppdrag</div>
                      <div className="font-medium">{money(totals.sum)}</div>
                    </div>
                  </div>
                </div>

                {/* Trafikledningens kommentar */}
                <div className="mt-6">
                  <div className="font-semibold text-[#0f172a]">
                    Trafikledningens kommentar
                  </div>
                  <div className="mt-2 rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-3 text-[14px] text-[#0f172a]">
                    {v(offer?.ops_comment || offer?.traffic_comment, "—")}
                  </div>
                </div>
              </div>

              <div className="mt-auto px-6 pb-6" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({
  roundTrip,
  label,
  enkel,
  retur,
}: {
  roundTrip: boolean;
  label: string;
  enkel: string;
  retur?: string;
}) {
  return (
    <div
      className="mt-1 grid items-baseline text-[14px]"
      style={{ gridTemplateColumns: roundTrip ? "1fr 1fr 1fr" : "1fr 1fr" }}
    >
      <div className="text-[#0f172a]/70">{label}</div>
      <div>{enkel}</div>
      {roundTrip && <div>{retur ?? "—"}</div>}
    </div>
  );
}
