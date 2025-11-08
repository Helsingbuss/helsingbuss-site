// src/components/offers/OfferInkommen.tsx
import Image from "next/image";
import StatusBadge from "@/components/StatusBadge";

// Nya komponenter
import TopBarOffer from "@/components/offers/TopBarOffer";
import OfferMetaCards from "@/components/offers/OfferMetaCards";
import TripLegGrid from "@/components/offers/TripLegGrid";
import TripLegCard from "@/components/offers/TripLegCard";
import OfferFooterTerms from "@/components/offers/OfferFooterTerms";

type OfferInkommenProps = { offer: any };

// Globala rattar för radavstånd
const LINE_HEIGHT = 1.5; // resten av sidan
const CARD_LH = 1.25; // tajtare i korten överst

function v(x: any, fallback = "—") {
  if (x === null || x === undefined || x === "") return fallback;
  return String(x);
}

export default function OfferInkommen({ offer }: OfferInkommenProps) {
  const roundTrip = Boolean(offer?.round_trip);
  // trip_type kan vara "sverige" eller "utrikes" – defaulta till sverige
  const withinSweden = (offer?.trip_type || "sverige") !== "utrikes";

  // Metaöverdel: offertnr, kundnr (om du lägger till det i tabellen), status
  const offerNo = v(offer?.offer_number, "HB25XXX");
  const customerNo = v(offer?.customer_number, "—"); // finns om du lägger kolumnen
  const status = v(offer?.status, "inkommen");

  // Bygg ut-resa (leg 1)
  const firstLeg = {
    title: withinSweden ? "Bussresa inom Sverige" : "Bussresa utomlands",
    date: v(offer?.departure_date),
    time: v(offer?.departure_time),
    from: v(offer?.departure_place),
    to: v(offer?.destination),
    pax: v(offer?.passengers),
    extra: v(offer?.notes, "Ingen information."),
  };

  // Bygg retur (leg 2) om round_trip
  const secondLeg = roundTrip
    ? {
        title: withinSweden ? "Bussresa inom Sverige" : "Bussresa utomlands",
        date: v(offer?.return_date),
        time: v(offer?.return_time),
        from: v(offer?.destination),
        to: v(offer?.departure_place),
        pax: v(offer?.passengers),
        extra: v(offer?.notes, "Ingen information."),
      }
    : null;

  const trips = secondLeg ? [firstLeg, secondLeg] : [firstLeg];

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      {/* Toppbar (mörk) */}
      <TopBarOffer
        offerNumber={offerNo}
        customerNumber={customerNo}
        status={status}
        // bussgubben hämtas av komponenten via /busie.png i public/
      />

      <div className="mx-auto w-full max-w-4xl bg-white rounded-lg shadow px-6 py-6">
        {/* Header med logga + statusbricka (behåller för kontinuitet) */}
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Image src="/mork_logo.png" alt="Helsingbuss" width={360} height={64} priority />
          </div>
          <div className="pt-1 text-right">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Titel */}
        <h1 className="mt-2 text-2xl font-semibold text-[#0f172a]">Offertförfrågan {offerNo}</h1>

        {/* Övre kort – tajt layout via OfferMetaCards */}
        <div className="mt-4">
          <OfferMetaCards
            // Vänster kort (Offertinformation)
            left={{
              rows: [
                { label: "Offertdatum", value: v(offer?.offer_date, "—") },
                { label: "Er referens", value: v(offer?.customer_reference, "—") },
                { label: "Vår referens", value: v(offer?.internal_reference, "—") },
              ],
              lineHeight: CARD_LH,
            }}
            // Höger kort (Kund)
            right={{
              rows: [
                { label: "Namn", value: v(offer?.contact_person, "—") },
                { label: "Adress", value: v(offer?.customer_address, "—") },
                { label: "Telefon", value: v(offer?.contact_phone, "—") },
                { label: "E-post", value: v(offer?.contact_email, "—"), wrap: true },
              ],
              lineHeight: CARD_LH,
            }}
          />
        </div>

        {/* Introtext */}
        <div className="mt-5 text-[14px] text-[#0f172a]/80" style={{ lineHeight: LINE_HEIGHT }}>
          <p>
            Hej!
            <br />
            Tack för att ni kontaktade Helsingbuss – vi ser fram emot att få ta hand om er resa.
            Vi har tagit fram ett genomtänkt upplägg som förenar bekvämlighet, säkerhet och smidig
            planering. I offerten nedan hittar ni tydliga specifikationer och pris. Säg bara till om
            ni vill lägga till något, byta tider eller uppgradera komfort – vi skräddarsyr gärna
            efter era önskemål.
          </p>
        </div>

        {/* Resekort (enkelresa eller tur & retur) */}
        <div className="mt-5">
          <TripLegGrid>
            {trips.map((trip, idx) => (
              <TripLegCard
                key={idx}
                title={trip.title}
                subtitle="Avstånd och tider baseras preliminärt"
                date={trip.date}
                time={trip.time}
                from={trip.from}
                to={trip.to}
                pax={trip.pax}
                extra={trip.extra}
                iconSrc="/maps_pin.png"
              />
            ))}
          </TripLegGrid>
        </div>

        {/* Footer / villkor och företagsuppgifter */}
        <OfferFooterTerms
          termsParagraphs={[
            "Vid eventuell ändring av uppdragstiden eller körsträckan utöver det som anges i offerten tillkommer tilläggsdebitering. Vi reserverar oss för frågor samt eventuella ändringar eller pålagor som ligger utanför vår kontroll.",
            "Har du frågor, funderingar eller vill bekräfta bokningen? Kontakta oss under kontorstid eller via journumret utanför kontorstid.",
            "Observera: Detta är en offert – välkommen med din bokning!",
          ]}
          companyName="Helsingbuss"
          address1="Höjderupsgränd 12"
          address2="254 45 Helsingborg"
          website="helsingbuss.se"
          phoneMain="+46 (0)10-405 38 38"
          phoneEmergency="+46 (0)10-777 21 58"
          email="info@helsingbuss.se"
          bankgiro="9810-01 3931"
          orgNumber="890101-1391"
          vatNumber="SE890101931301"
          bankName="Swedbank"
          iban="20000000000000000"
          bic="XXXXXX"
        />
      </div>
    </div>
  );
}
