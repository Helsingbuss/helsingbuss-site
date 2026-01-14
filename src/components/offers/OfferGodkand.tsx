// src/components/offers/OfferGodkand.tsx
import Image from "next/image";
import StatusBadge from "@/components/StatusBadge";
import { useRouter } from "next/router";

type OfferGodkandProps = {
  offer: any;
};

// Globala rattar
const LINE_HEIGHT = 1.5;
const CARD_LH = 1.25;

function v(x: any, fallback = "—") {
  if (x === null || x === undefined || x === "") return fallback;
  return String(x);
}

function tidyTime(t?: string | null) {
  if (!t) return "—";
  const s = String(t);
  if (s.includes(":")) return s.slice(0, 5);
  if (s.length >= 4) return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
  return s;
}

function fmtOnSite(value: any) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isFinite(n)) return `${Math.max(0, n)} min före`;
  return String(value);
}

export default function OfferGodkand({ offer }: OfferGodkandProps) {
  const router = useRouter();
  const bookingId = typeof router.query?.bk === "string" ? router.query.bk : "";

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
  const offerNo = v(offer?.offer_number, "HB25XXX");

  // Standard-utformning (fallback om inga legs)
  const firstLeg = {
    title: withinSweden ? "Bussresa inom Sverige" : "Bussresa utomlands",
    date: v(offer?.departure_date),
    time: tidyTime(offer?.departure_time),
    from: v(offer?.departure_place),
    to: v(offer?.destination),
    pax: v(offer?.passengers),
    extra: v(offer?.notes, "Ingen information."),
    onSite: fmtOnSite(offer?.on_site_time ?? offer?.on_site_minutes),
    endTime: tidyTime(offer?.end_time),
    driver: v(offer?.driver_name, ""),
    driverPhone: v(offer?.driver_phone, ""),
    vehicleReg: v(offer?.vehicle_reg, ""),
    vehicleModel: v(offer?.vehicle_model, ""),
  };

  const secondLeg = roundTrip
    ? {
        title: withinSweden ? "Bussresa inom Sverige" : "Bussresa utomlands",
        date: v(offer?.return_date),
        time: tidyTime(offer?.return_time),
        from: v(offer?.destination),
        to: v(offer?.departure_place),
        pax: v(offer?.passengers),
        extra: v(offer?.notes, "Ingen information."),
        onSite: fmtOnSite(
          offer?.return_on_site_time ??
            offer?.return_on_site_minutes ??
            offer?.on_site_time
        ),
        endTime: tidyTime(offer?.return_end_time ?? offer?.end_time),
        driver: v(offer?.return_driver_name || offer?.driver_name, ""),
        driverPhone: v(offer?.return_driver_phone || offer?.driver_phone, ""),
        vehicleReg: v(offer?.return_vehicle_reg || offer?.vehicle_reg, ""),
        vehicleModel: v(offer?.return_vehicle_model || offer?.vehicle_model, ""),
      }
    : null;

  const rawLegs = (offer?.legs ?? offer?.trip_legs) as any;
  let trips: {
    title: string;
    date: string;
    time: string;
    from: string;
    to: string;
    pax: string;
    extra: string;
    onSite: string;
    endTime: string;
    driver: string;
    driverPhone: string;
    vehicleReg: string;
    vehicleModel: string;
  }[];

  if (Array.isArray(rawLegs) && rawLegs.length > 0) {
    trips = (rawLegs as any[]).map((leg, idx, arr) => {
      const isFirst = idx === 0;
      const baseDate = isFirst ? offer?.departure_date : offer?.return_date ?? offer?.departure_date;
      const baseFrom = isFirst ? offer?.departure_place : offer?.destination;
      const baseTo = isFirst ? offer?.destination : offer?.departure_place;

      return {
        title: withinSweden ? "Bussresa inom Sverige" : "Bussresa utomlands",
        date: v(leg.date ?? leg.departure_date ?? baseDate),
        time: tidyTime(
          leg.time ??
            leg.start ??
            (isFirst ? offer?.departure_time : offer?.return_time)
        ),
        from: v(leg.from ?? leg.departure_place ?? baseFrom),
        to: v(leg.to ?? leg.destination ?? baseTo),
        pax: v(leg.pax ?? offer?.passengers),
        extra: v(leg.extra ?? offer?.notes, "Ingen information."),
        onSite: fmtOnSite(
          leg.on_site ??
            leg.on_site_minutes ??
            (isFirst
              ? offer?.on_site_time ?? offer?.on_site_minutes
              : offer?.return_on_site_time ??
                offer?.return_on_site_minutes ??
                offer?.on_site_time)
        ),
        endTime: tidyTime(
          leg.end ??
            leg.end_time ??
            (isFirst ? offer?.end_time : offer?.return_end_time ?? offer?.end_time)
        ),
        driver: v(
          leg.driver_name ??
            (isFirst
              ? offer?.driver_name
              : offer?.return_driver_name ?? offer?.driver_name),
          ""
        ),
        driverPhone: v(
          leg.driver_phone ??
            (isFirst
              ? offer?.driver_phone
              : offer?.return_driver_phone ?? offer?.driver_phone),
          ""
        ),
        vehicleReg: v(
          leg.vehicle_reg ??
            (isFirst
              ? offer?.vehicle_reg
              : offer?.return_vehicle_reg ?? offer?.vehicle_reg),
          ""
        ),
        vehicleModel: v(
          leg.vehicle_model ??
            (isFirst
              ? offer?.vehicle_model
              : offer?.return_vehicle_model ?? offer?.vehicle_model),
          ""
        ),
      };
    });
  } else {
    trips = secondLeg ? [firstLeg, secondLeg] : [firstLeg];
  }

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
            <StatusBadge status="godkand" />
          </div>
        </div>

        {/* Info-banner om bokning skapades */}
        {bookingId && (
          <div className="mt-4 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#0f172a]">
            Bokningen är skapad. Öppna i admin:{" "}
            <a
              className="underline"
              href={`/admin/bookings/${encodeURIComponent(bookingId)}`}
            >
              {bookingId}
            </a>
          </div>
        )}

        {/* Titel */}
        <h1 className="mt-2 text-2xl font-semibold text-[#0f172a]">
          Bokningen är klar {offerNo ? `(${offerNo})` : ""}
        </h1>

        {/* Övre kort – bokningsinfo & kundinfo (oförändrat) */}
        {/* ... här kan du behålla exakt din befintliga kod för övre kort + footer ... */}

        {/* Reseavsnitt – två kolumner på md+ */}
        <div
          className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4"
          style={{ lineHeight: LINE_HEIGHT }}
        >
          {trips.map((trip, idx) => (
            <div key={idx}>
              <div
                className="flex items-center gap-2 text-[#0f172a] mb-2"
                style={{ lineHeight: LINE_HEIGHT }}
              >
                <Image src="/maps_pin.png" alt="Pin" width={18} height={18} />
                <span className="font-semibold">{trip.title}</span>
                <span className="text-xs text-[#0f172a]/50 ml-2">
                  Avstånd och tider baseras preliminärt
                </span>
              </div>

              <div
                className="border rounded-lg p-3 text-[14px] text-[#0f172a]"
                style={{ lineHeight: 1.5 }}
              >
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

                <div className="mt-2">
                  <span className="font-semibold">På plats:</span> {trip.onSite}
                </div>
                <div>
                  <span className="font-semibold">Sluttid:</span> {trip.endTime}
                </div>

                {(trip.driver || trip.driverPhone) && (
                  <div className="mt-2">
                    <span className="font-semibold">Chaufför:</span>{" "}
                    {trip.driver || "—"}
                    {trip.driverPhone ? `, ${trip.driverPhone}` : ""}
                  </div>
                )}
                {(trip.vehicleReg || trip.vehicleModel) && (
                  <div>
                    <span className="font-semibold">Fordon:</span>{" "}
                    {[trip.vehicleReg, trip.vehicleModel]
                      .filter(Boolean)
                      .join(" – ") || "—"}
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

        {/* Resten av text + footer kan vara exakt som du hade */}
      </div>
    </div>
  );
}
