// src/pages/kassa/index.tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

type BookingTrip = {
  id: string;
  title: string;
  subtitle?: string | null;
  summary?: string | null;
  city?: string | null;
  country?: string | null;
  hero_image?: string | null;
  slug?: string | null;
};

type BookingDeparture = {
  trip_id: string;
  date: string;
  time: string | null;
  line_name: string | null;
  seats_total: number;
  seats_reserved: number;
  seats_left: number;
};

type BookingTicket = {
  id: number;
  ticket_type_id: number;
  name: string;
  code: string | null;
  price: number;
  currency: string;
  departure_date: string | null;
};

type BookingInitResponse = {
  ok: boolean;
  error?: string;
  trip?: BookingTrip;
  departure?: BookingDeparture;
  tickets?: BookingTicket[];
};

function money(n?: number | null, currency: string = "SEK") {
  if (n == null) return "—";
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function KassaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [trip, setTrip] = useState<BookingTrip | null>(null);
  const [departure, setDeparture] = useState<BookingDeparture | null>(null);
  const [tickets, setTickets] = useState<BookingTicket[]>([]);

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Enkel kontaktinfo (vi bygger ut detta senare)
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (!router.isReady) return;

    const { trip_id, date } = router.query;
    if (!trip_id || !date) {
      setErr("Saknar information om resa. Försök boka om från resesidan.");
      setLoading(false);
      return;
    }

    const tripId = String(trip_id);
    const departDate = String(date).slice(0, 10);

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const r = await fetch(
          `/api/public/booking/init?trip_id=${encodeURIComponent(
            tripId
          )}&date=${encodeURIComponent(departDate)}`
        );
        const j: BookingInitResponse = await r.json();
        if (!r.ok || !j.ok) {
          throw new Error(j.error || "Kunde inte läsa reseinformation.");
        }

        setTrip(j.trip || null);
        setDeparture(j.departure || null);
        setTickets(j.tickets || []);

        if (j.tickets && j.tickets.length > 0) {
          setSelectedTicketId(j.tickets[0].id);
        }
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || "Tekniskt fel.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router.isReady, router.query]);

  const selectedTicket = useMemo(() => {
    if (!tickets.length) return null;
    if (selectedTicketId == null) return tickets[0];
    return tickets.find((t) => t.id === selectedTicketId) || tickets[0];
  }, [tickets, selectedTicketId]);

  const totalPrice = useMemo(() => {
    if (!selectedTicket) return 0;
    return selectedTicket.price * Math.max(quantity, 0);
  }, [selectedTicket, quantity]);

  function formatDeparture(departure: BookingDeparture | null) {
    if (!departure) return "";
    const date = departure.date;
    const time = departure.time ? departure.time.slice(0, 5) : "";
    const d = new Date(date + "T00:00:00");
    const pretty =
      !Number.isNaN(d.getTime())
        ? d.toLocaleDateString("sv-SE", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : date;

    return [pretty, time].filter(Boolean).join(" ");
  }

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault();
    // Här kan vi senare:
    // - spara ett preliminärt booking-objekt i DB
    // - gå vidare till betalningssteg
    alert("Nästa steg (betalning) bygger vi i nästa omgång 🙂");
  }

  return (
    <>
      <Head>
        <title>Kassa – Helsingbuss</title>
      </Head>

      <div className="min-h-screen bg-[#f5f4f0] py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Topplogo / rubrik */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#194C66]/70">
                Helsingbuss
              </div>
              <h1 className="text-xl font-semibold text-[#0f172a]">
                Kassa – boka din resa
              </h1>
              <p className="text-sm text-slate-600">
                Steg 1 av 3 · Välj biljetter och fyll i kontaktuppgifter.
              </p>
            </div>
          </div>

          {/* Fel / laddning */}
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600 shadow-sm">
              Laddar reseinformation…
            </div>
          )}

          {!loading && err && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700 shadow-sm">
              {err}
            </div>
          )}

          {!loading && !err && trip && departure && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Vänster: formulär / steg */}
              <div className="lg:col-span-2 space-y-6">
                {/* Kort: Biljetter & antal */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#194C66]/70">
                        Steg 1
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        Biljetter & antal resenärer
                      </div>
                    </div>
                  </div>
                  <form
                    onSubmit={handleNextStep}
                    className="px-4 sm:px-5 py-4 space-y-5"
                  >
                    {/* Ticket-typ */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[13px] font-medium text-[#194C66]/80 mb-1">
                          Biljettyp
                        </div>
                        {tickets.length === 0 ? (
                          <div className="text-sm text-slate-500">
                            Inga priser är satta för denna avgång ännu.
                          </div>
                        ) : (
                          <select
                            className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                            value={
                              selectedTicket ? String(selectedTicket.id) : ""
                            }
                            onChange={(e) =>
                              setSelectedTicketId(
                                e.target.value
                                  ? Number(e.target.value)
                                  : null
                              )
                            }
                          >
                            {tickets.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} – {money(t.price, t.currency)}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Antal */}
                      <div>
                        <div className="text-[13px] font-medium text-[#194C66]/80 mb-1">
                          Antal resenärer
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={departure.seats_left || undefined}
                          className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                          value={quantity}
                          onChange={(e) =>
                            setQuantity(
                              Math.max(1, Number(e.target.value) || 1)
                            )
                          }
                        />
                        <div className="text-[11px] text-slate-500 mt-1">
                          {departure.seats_left > 0
                            ? `Platser kvar: ${departure.seats_left}`
                            : "Inga platser kvar"}
                        </div>
                      </div>
                    </div>

                    {/* Kontaktuppgifter */}
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <div className="text-[13px] font-semibold text-[#194C66] mb-2">
                        Kontaktuppgifter
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[13px] font-medium text-[#194C66]/80 mb-1">
                            Namn
                          </label>
                          <input
                            className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-[#194C66]/80 mb-1">
                            E-post
                          </label>
                          <input
                            type="email"
                            className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium text-[#194C66]/80 mb-1">
                            Telefon
                          </label>
                          <input
                            className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Knapprad */}
                    <div className="pt-3 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => window.close()}
                        className="text-xs sm:text-sm px-4 py-2 rounded-full border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                      >
                        Avbryt
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedTicket || quantity <= 0}
                        className="text-xs sm:text-sm px-5 py-2 rounded-full bg-[#194C66] text-white font-semibold shadow-sm hover:bg-[#163b4d] disabled:opacity-60"
                      >
                        Gå vidare till betalning
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Höger: sammanfattning */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {trip.hero_image && (
                    <div className="h-32 w-full overflow-hidden">
                      <img
                        src={trip.hero_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#194C66]/70">
                      Din resa
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {trip.title}
                    </div>
                    {trip.subtitle && (
                      <div className="text-xs text-slate-600">
                        {trip.subtitle}
                      </div>
                    )}
                    <div className="text-xs text-slate-600">
                      {departure.line_name && (
                        <div>Linje: {departure.line_name}</div>
                      )}
                      <div>Avresa: {formatDeparture(departure)}</div>
                      {trip.city || trip.country ? (
                        <div>
                          Destination:{" "}
                          {[trip.city, trip.country]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#194C66]/70">
                      Sammanfattning
                    </div>
                    <div className="text-xs text-slate-500">
                      Steg 1 av 3
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-slate-700">
                    <div className="flex justify-between">
                      <span>Biljettyp</span>
                      <span>
                        {selectedTicket
                          ? selectedTicket.name
                          : "Ej vald"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Antal</span>
                      <span>{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pris per biljett</span>
                      <span>
                        {selectedTicket
                          ? money(
                              selectedTicket.price,
                              selectedTicket.currency
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-slate-200 pt-2 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-900">
                      Att betala
                    </span>
                    <span className="text-lg font-semibold text-[#194C66]">
                      {money(
                        totalPrice,
                        selectedTicket?.currency || "SEK"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
