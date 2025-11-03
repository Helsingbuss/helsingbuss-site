// src/components/bookings/BookingBekraftelse.tsx
import Image from "next/image";
import StatusBadge from "@/components/StatusBadge";

// Globala rattar för radavstånd (samma som OfferGodkand)
const LINE_HEIGHT = 1.5;   // resten av sidan
const CARD_LH     = 1.25;  // tajtare i korten överst

function v(x: any, fallback = "—") {
  if (x === null || x === undefined || x === "") return fallback;
  return String(x);
}

type BookingBekraftelseProps = {
  booking: any;
};

export default function BookingBekraftelse({ booking }: BookingBekraftelseProps) {
  const roundTrip = Boolean(
    booking?.return_departure ||
    booking?.return_destination ||
    booking?.return_date ||
    booking?.return_time
  );

  // BK-nummer
  const bookingNo =
    v(booking?.booking_number ?? booking?.order_number ?? booking?.bookingId, "BK25XXX");

  // Om resan är inom/utrikes (behåll samma copy som offert)
  const withinSweden = (booking?.trip_type || "sverige") !== "utrikes";

  // Första benet
  const firstLeg = {
    title: withinSweden ? "Bussresa inom Sverige" : "Bussresa utomlands",
    date: v(booking?.departure_date),
    time: v(booking?.departure_time),
    from: v(booking?.departure_place ?? booking?.from),
    to: v(booking?.destination ?? booking?.to),
    pax: v(booking?.passengers),
    extra: v(booking?.notes, "Ingen information."),
    onSite: v(booking?.on_site_minutes ?? booking?.on_site_time, "—"),
    endTime: v(booking?.end_time, "—"),
    driver: v(booking?.driver_name, ""),
    driverPhone: v(booking?.driver_phone, ""),
    vehicleReg: v(booking?.vehicle_reg, ""),
    vehicleModel: v(booking?.vehicle_model, ""),
  };

  // Andra benet (retur) om finns
  const secondLeg = roundTrip
    ? {
        title: withinSweden ? "Bussresa inom Sverige" : "Bussresa utomlands",
        date: v(booking?.return_date),
        time: v(booking?.return_time),
        from: v(booking?.return_departure ?? booking?.destination),
        to: v(booking?.return_destination ?? booking?.departure_place),
        pax: v(booking?.passengers),
        extra: v(booking?.notes, "Ingen information."),
        onSite: v(booking?.return_on_site_minutes ?? booking?.return_on_site_time ?? booking?.on_site_minutes, "—"),
        endTime: v(booking?.return_end_time ?? booking?.end_time, "—"),
        driver: v(booking?.return_driver_name ?? booking?.driver_name, ""),
        driverPhone: v(booking?.return_driver_phone ?? booking?.driver_phone, ""),
        vehicleReg: v(booking?.return_vehicle_reg ?? booking?.vehicle_reg, ""),
        vehicleModel: v(booking?.return_vehicle_model ?? booking?.vehicle_model, ""),
      }
    : null;

  const trips = secondLeg ? [firstLeg, secondLeg] : [firstLeg];

  return (
    <div className="min-h-screen bg-[#f5f4f0] py-6">
      <div className="mx-auto w-full max-w-4xl bg-white rounded-lg shadow px-6 py-6">
        {/* Header-rad: logga + status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Image
              src="/mork_logo.png"
              alt="Helsingbuss"
              width={360}
              height={64}
              priority
            />
          </div>
          <div className="pt-1 text-right">
            {/* Använd valfri status som din StatusBadge stödjer, t.ex. 'bekraftad' */}
            <StatusBadge status="bekraftad" />
          </div>
        </div>

        {/* Titel */}
        <h1 className="mt-2 text-2xl font-semibold text-[#0f172a]">
          Bokningsbekräftelse {bookingNo ? `(${bookingNo})` : ""}
        </h1>

        {/* Övre kort – order & kund */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Order-information */}
          <div
            className="border rounded-lg p-4 space-y-[2px]"
            style={{ lineHeight: CARD_LH as number }}
          >
            <Row label="Ordernummer (Boknings ID)" value={bookingNo} lh={CARD_LH} />
            <Row label="Passagerare" value={v(booking?.passengers)} lh={CARD_LH} />
          </div>

          {/* Kund-information */}
          <div
            className="border rounded-lg p-4 space-y-[2px]"
            style={{ lineHeight: CARD_LH as number }}
          >
            <Row label="Kontakt" value={v(booking?.contact_person, "—")} lh={CARD_LH} />
            <Row label="E-post" value={v(booking?.customer_email, "—")} wrap lh={CARD_LH} />
            <Row label="Telefon" value={v(booking?.customer_phone, "—")} lh={CARD_LH} />
          </div>
        </div>

        {/* Meddelande från trafikledning – valfritt textfält */}
        {booking?.ops_message && (
          <div className="mt-5 border rounded-lg p-4 bg-[#f8fafc]" style={{ lineHeight: LINE_HEIGHT }}>
            <div className="text-[#0f172a] font-semibold mb-1">
              Meddelande från Trafikledningen
            </div>
            <div className="text-[#0f172a]/80">{v(booking?.ops_message)}</div>
          </div>
        )}

        {/* Reseavsnitt – två kolumner på md+ */}
        <div
          className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4"
          style={{ lineHeight: LINE_HEIGHT }}
        >
          {trips.map((trip, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-2 text-[#0f172a] mb-2" style={{ lineHeight: LINE_HEIGHT }}>
                <Image src="/maps_pin.png" alt="Pin" width={18} height={18} />
                <span className="font-semibold">{trip.title}</span>
                <span className="text-xs text-[#0f172a]/50 ml-2">
                  Avstånd och tider baseras preliminärt
                </span>
              </div>

              <div className="border rounded-lg p-3 text-[14px] text-[#0f172a]" style={{ lineHeight: 1.5 }}>
                <div>
                  <span className="font-semibold">Avgång:</span> {trip.date} kl {trip.time}
                </div>
                <div>
                  <span className="font-semibold">Från:</span> {trip.from}
                </div>
                <div>
                  <span className="font-semibold">Till:</span> {trip.to}
                </div>
                <div>
                  <span className="font-semibold">Antal passagerare:</span> {trip.pax}
                </div>

                {/* Extra fält */}
                <div className="mt-2">
                  <span className="font-semibold">På plats:</span> {trip.onSite}
                </div>
                <div>
                  <span className="font-semibold">Sluttid:</span> {trip.endTime}
                </div>

                {(trip.driver || trip.driverPhone) && (
                  <div className="mt-2">
                    <span className="font-semibold">Chaufför:</span>{" "}
                    {trip.driver || "—"}{trip.driverPhone ? `, ${trip.driverPhone}` : ""}
                  </div>
                )}
                {(trip.vehicleReg || trip.vehicleModel) && (
                  <div>
                    <span className="font-semibold">Fordon:</span>{" "}
                    {[trip.vehicleReg, trip.vehicleModel].filter(Boolean).join(" – ") || "—"}
                  </div>
                )}

                <div className="mt-2">
                  <span className="font-semibold">Övrig information:</span>{" "}
                  <span className="whitespace-pre-wrap">{trip.extra}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer / info – matchar offert-tonen */}
        <div className="mt-7 text-[14px] text-[#0f172a]/70" style={{ lineHeight: 1.5 }}>
          <p>
            Fakturan skickas efter utfört uppdrag. Kontrollera gärna att bokningen stämmer enligt era önskemål.
            Har du frågor eller vill justera något? Kontakta oss vardagar kl. <strong>08:00–17:00</strong>{" "}
            på <strong>010–405 38 38</strong>, eller besvara detta mail. Vid akuta trafikärenden
            efter kontorstid når du vår jour på <strong>010–777 21 58</strong>.
          </p>
        </div>

        {/* Signaturblock (samma stil som övriga sidor) */}
        <div
          className="mt-5 grid gap-2 text-xs text-[#0f172a]/60 sm:grid-cols-2 lg:grid-cols-4"
          style={{ lineHeight: LINE_HEIGHT }}
        >
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

function Row({
  label,
  value,
  wrap = false,
  lh = CARD_LH,
}: {
  label: string;
  value: string;
  wrap?: boolean;
  lh?: number;
}) {
  return (
    <div className="flex items-baseline gap-2 py-0" style={{ lineHeight: lh }}>
      <span className="text-sm text-[#0f172a]/70 font-semibold">{label}</span>
      <span className={`text-sm text-[#0f172a] ${wrap ? "break-all" : "whitespace-nowrap"}`}>
        {value}
      </span>
    </div>
  );
}
