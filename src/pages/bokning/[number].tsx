// src/pages/bokning/[number].tsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type BookingLeg = {
  date: string | null;
  start: string | null;
  end?: string | null;
  on_site_minutes?: number | null;
  from: string | null;
  to: string | null;
  via?: string | null;
};

type Booking = {
  id: string;
  booking_number: string; // t.ex. "BK259153"
  passengers: number | null;

  // kund
  contact_person: string | null;
  customer_email: string | null;
  customer_phone: string | null;

  // utresa
  departure_place: string | null;
  destination: string | null;
  departure_date: string | null; // YYYY-MM-DD
  departure_time: string | null; // HH:MM
  end_time?: string | null;
  on_site_minutes?: number | null;
  stopover_places?: string | null;

  // retur (om finns i API)
  return_departure?: string | null;
  return_destination?: string | null;
  return_date?: string | null;
  return_time?: string | null;
  return_end_time?: string | null;
  return_on_site_minutes?: number | null;

  // extra körningar (nytt, JSON från API)
  legs?: BookingLeg[];

  // övrigt
  notes: string | null;
};

function v(x: any, fallback = "—") {
  if (x === null || x === undefined || x === "") return fallback;
  return String(x);
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  if (isNaN(dt.getTime())) return v(d);
  return new Intl.DateTimeFormat("sv-SE", { dateStyle: "long" }).format(dt);
}

function fmtTime(t?: string | null) {
  if (!t) return "—";
  const base = t.length >= 5 ? t.slice(0, 5) : t;
  const dt = new Date(`1970-01-01T${base}:00`);
  if (isNaN(dt.getTime())) return v(t);
  return new Intl.DateTimeFormat("sv-SE", { timeStyle: "short" }).format(dt);
}

function buildICS(b: Booking) {
  // Skapar en enkel .ics med 1–N VEVENT (en per körning)
  const esc = (s: string) =>
    s.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");

  const asDT = (d?: string | null, t?: string | null) => {
    if (!d) return "";
    const dd = d.replace(/-/g, "");
    const tt = (t || "00:00").slice(0, 5).replace(":", "") + "00";
    return `${dd}T${tt}`;
  };

  const uid = (suffix: string) =>
    `${b.booking_number || "HB"}-${suffix}@helsingbuss.se`;

  // Använd legs om de finns, annars bygg två "fallback"-legs (utresa/retur)
  const legsFromBooking: BookingLeg[] = Array.isArray(b.legs)
    ? b.legs
    : [];

  const fallbackLegs: BookingLeg[] = [];

  // Utresa
  fallbackLegs.push({
    date: b.departure_date,
    start: b.departure_time,
    end: b.end_time || null,
    on_site_minutes: b.on_site_minutes ?? null,
    from: b.departure_place,
    to: b.destination,
    via: b.stopover_places,
  });

  // Retur om finns
  if (
    b.return_date ||
    b.return_time ||
    b.return_departure ||
    b.return_destination
  ) {
    fallbackLegs.push({
      date: b.return_date || b.departure_date,
      start: b.return_time || b.departure_time,
      end: b.return_end_time || b.return_time || b.end_time || b.departure_time,
      on_site_minutes: b.return_on_site_minutes ?? null,
      from: b.return_departure || b.destination,
      to: b.return_destination || b.departure_place,
      via: null,
    });
  }

  const legs = legsFromBooking.length ? legsFromBooking : fallbackLegs;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Helsingbuss//Bokning//SV",
  ];

  legs.forEach((leg, idx) => {
    const dtStart = asDT(leg.date || b.departure_date, leg.start || b.departure_time);
    const dtEnd = asDT(
      leg.date || b.departure_date,
      leg.end || leg.start || b.departure_time
    );
    const from = leg.from ?? b.departure_place;
    const to = leg.to ?? b.destination;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid(`leg-${idx + 1}`)}`,
      `SUMMARY:${esc(`Helsingbuss – Körning ${idx + 1}`)}`,
      `DTSTART:${dtStart}`,
      dtEnd ? `DTEND:${dtEnd}` : `DTEND:${dtStart}`,
      `LOCATION:${esc(`${v(from, "-")} → ${v(to, "-")}`)}`,
      `DESCRIPTION:${esc(
        `Bokning: ${v(
          b.booking_number
        )}\\nPassagerare: ${v(
          b.passengers
        )}\\nKontakt: ${v(b.contact_person)} (${v(b.customer_phone)})`
      )}`,
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export default function BookingPublicPage() {
  const router = useRouter();
  const { number } = router.query as { number?: string };

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!number) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const u = new URL("/api/bookings/by-number", window.location.origin);
        u.searchParams.set("no", String(number));
        const res = await fetch(u.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        setBooking(j?.booking ?? null);
        if (!j?.booking) setErr("Kunde inte läsa bokningen.");
      } catch (e: any) {
        setErr(e?.message || "Kunde inte läsa bokningen.");
        setBooking(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [number]);

  // Memoiserad ICS-länk
  const icsHref = useMemo(() => {
    if (!booking) return null;
    const ics = buildICS(booking);
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  }, [booking]);

  const hasReturn = useMemo(() => {
    if (!booking) return false;
    if (booking.legs && booking.legs.length > 1) return true;
    return !!(
      booking.return_departure ||
      booking.return_destination ||
      booking.return_date ||
      booking.return_time
    );
  }, [booking]);

  // Derivera utresa/retur från legs om de finns, annars från gamla fälten
  const legs = booking?.legs && booking.legs.length ? booking.legs : null;
  const firstLeg = legs ? legs[0] : null;
  const secondLeg = legs && legs.length > 1 ? legs[1] : null;
  const extraLegs = legs && legs.length > 2 ? legs.slice(2) : [];

  const outDate = firstLeg?.date || booking?.departure_date || null;
  const outTime = firstLeg?.start || booking?.departure_time || null;
  const outOnSite =
    typeof firstLeg?.on_site_minutes === "number"
      ? firstLeg.on_site_minutes
      : booking?.on_site_minutes;
  const outFrom = firstLeg?.from || booking?.departure_place || null;
  const outVia = firstLeg?.via || booking?.stopover_places || null;
  const outTo = firstLeg?.to || booking?.destination || null;

  const retDate =
    secondLeg?.date ||
    booking?.return_date ||
    booking?.departure_date ||
    null;
  const retTime =
    secondLeg?.start ||
    booking?.return_time ||
    booking?.departure_time ||
    null;
  const retOnSite =
    typeof secondLeg?.on_site_minutes === "number"
      ? secondLeg.on_site_minutes
      : booking?.return_on_site_minutes ?? null;
  const retFrom =
    secondLeg?.from || booking?.return_departure || booking?.destination || null;
  const retTo =
    secondLeg?.to ||
    booking?.return_destination ||
    booking?.departure_place ||
    null;

  return (
    <div className="min-h-screen bg-[#f5f4f0] py-8">
      <div className="mx-auto w-full max-w-3xl bg-white rounded-lg shadow px-6 py-6">
        {/* Logga + actions */}
        <div className="flex items-center justify-between mb-3">
          <Image
            src="/mork_logo.png"
            alt="Helsingbuss"
            width={260}
            height={46}
            priority
          />
          <div className="flex gap-2">
            {icsHref && (
              <a
                href={icsHref}
                download={`Helsingbuss-${booking?.booking_number || "bokning"}.ics`}
                className="px-3 py-2 text-sm border rounded"
              >
                Lägg till i kalendern
              </a>
            )}
            <button
              onClick={() => window.print()}
              className="px-3 py-2 text-sm border rounded"
            >
              Skriv ut
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-[#0f172a] mb-3">
          Bokningsbekräftelse
        </h1>

        {loading && (
          <div
            className="rounded bg-[#f8fafc] border border-[#e5e7eb] p-3 text-[#194C66]/70"
            role="status"
            aria-live="polite"
          >
            Laddar…
          </div>
        )}

        {!loading && err && (
          <div
            className="rounded bg-red-50 border border-red-200 p-3 text-red-700"
            role="alert"
            aria-live="assertive"
          >
            {err}
          </div>
        )}

        {!loading && !err && booking && (
          <>
            {/* Övre kort – order + kund + utresa/retur + ev. extra körningar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Order */}
              <div className="border rounded-lg p-4">
                <div className="text-sm text-[#0f172a]/60 mb-1">Order</div>
                <div className="text-[#0f172a] space-y-1">
                  <div>
                    <span className="font-semibold">
                      Ordernummer (Boknings-ID):
                    </span>{" "}
                    {v(booking.booking_number)}
                  </div>
                  <div>
                    <span className="font-semibold">Passagerare:</span>{" "}
                    {v(booking.passengers)}
                  </div>
                </div>
              </div>

              {/* Kund */}
              <div className="border rounded-lg p-4">
                <div className="text-sm text-[#0f172a]/60 mb-1">Kund</div>
                <div className="text-[#0f172a] space-y-1">
                  <div>
                    <span className="font-semibold">Kontakt:</span>{" "}
                    {v(booking.contact_person)}
                  </div>
                  <div>
                    <span className="font-semibold">E-post:</span>{" "}
                    {v(booking.customer_email)}
                  </div>
                  <div>
                    <span className="font-semibold">Telefon:</span>{" "}
                    {booking.customer_phone ? (
                      <a
                        className="underline"
                        href={`tel:${booking.customer_phone}`}
                      >
                        {booking.customer_phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>

              {/* Utresa */}
              <div className="border rounded-lg p-4">
                <div className="text-sm text-[#0f172a]/60 mb-1">Utresa</div>
                <div className="text-[#0f172a] space-y-1">
                  <div>
                    <span className="font-semibold">Datum:</span>{" "}
                    {fmtDate(outDate)}
                  </div>
                  <div>
                    <span className="font-semibold">Tid:</span>{" "}
                    {fmtTime(outTime)}
                  </div>
                  {typeof outOnSite === "number" && (
                    <div>
                      <span className="font-semibold">På plats:</span>{" "}
                      {outOnSite} min före
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Från:</span>{" "}
                    {v(outFrom)}
                  </div>
                  {outVia && (
                    <div>
                      <span className="font-semibold">Via:</span>{" "}
                      {v(outVia)}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Till:</span>{" "}
                    {v(outTo)}
                  </div>
                </div>
              </div>

              {/* Retur (visas om uppgifter finns) */}
              {hasReturn && (
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-[#0f172a]/60 mb-1">Retur</div>
                  <div className="text-[#0f172a] space-y-1">
                    <div>
                      <span className="font-semibold">Datum:</span>{" "}
                      {fmtDate(retDate)}
                    </div>
                    <div>
                      <span className="font-semibold">Tid:</span>{" "}
                      {fmtTime(retTime)}
                    </div>
                    {typeof retOnSite === "number" && (
                      <div>
                        <span className="font-semibold">På plats:</span>{" "}
                        {retOnSite} min före
                      </div>
                    )}
                    <div>
                      <span className="font-semibold">Från:</span>{" "}
                      {v(retFrom)}
                    </div>
                    <div>
                      <span className="font-semibold">Till:</span>{" "}
                      {v(retTo)}
                    </div>
                  </div>
                </div>
              )}

              {/* Övriga körningar om fler än 2 legs */}
              {extraLegs.length > 0 && (
                <div className="border rounded-lg p-4 md:col-span-2">
                  <div className="text-sm text-[#0f172a]/60 mb-1">
                    Övriga körningar
                  </div>
                  <div className="text-[#0f172a] space-y-2">
                    {extraLegs.map((leg, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-100 rounded-md p-2"
                      >
                        <div className="font-semibold mb-1">
                          Körning {idx + 3}
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-semibold">Datum:</span>{" "}
                            {fmtDate(leg.date)}
                          </div>
                          <div>
                            <span className="font-semibold">Tid:</span>{" "}
                            {fmtTime(leg.start)}
                          </div>
                          {typeof leg.on_site_minutes === "number" && (
                            <div>
                              <span className="font-semibold">På plats:</span>{" "}
                              {leg.on_site_minutes} min före
                            </div>
                          )}
                          <div>
                            <span className="font-semibold">Från:</span>{" "}
                            {v(leg.from)}
                          </div>
                          {leg.via && (
                            <div>
                              <span className="font-semibold">Via:</span>{" "}
                              {v(leg.via)}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold">Till:</span>{" "}
                            {v(leg.to)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Övrigt */}
              {booking.notes && (
                <div className="border rounded-lg p-4 md:col-span-2">
                  <div className="text-sm text-[#0f172a]/60 mb-1">
                    Övrig information
                  </div>
                  <div className="text-[#0f172a] whitespace-pre-wrap">
                    {booking.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Footer-info / kontakt */}
            <div className="mt-6 text-[14px] text-[#0f172a]/80">
              <p>
                Bekräftelsen avser ovanstående uppgifter. Ändringar bekräftas
                skriftligt av oss. Frågor inför resan? Vardagar kl. 08:00–17:00
                på{" "}
                <a
                  className="underline"
                  href="mailto:kundteam@helsingbuss.se"
                >
                  kundteam@helsingbuss.se
                </a>{" "}
                eller jour <strong>010–777 21 58</strong>.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
