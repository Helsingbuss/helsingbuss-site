// src/pages/kassa.tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useMemo, useState } from "react";
import * as admin from "@/lib/supabaseAdmin";

const supabase: any =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

type RawDeparture = {
  dep_date?: string;
  depart_date?: string;
  date?: string;
  day?: string;
  when?: string;
  dep_time?: string;
  time?: string;
  line_name?: string;
  line?: string;
  stops?: string[] | string | null;
};

type TripDbRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  price_from?: number | null;
  departures?: RawDeparture[] | string | null;
};

type Departure = {
  date: string; // YYYY-MM-DD
  time: string;
  line: string;
  stops: string[];
  longDate: string; // "lördag 7 februari 2026"
  shortDate: string; // "2026-02-07"
};

type TicketOption = {
  id: number;
  name: string;
  price: number;
};

type Props = {
  ok: boolean;
  error?: string;
  trip?: {
    id: string;
    title: string;
    subtitle?: string | null;
    price_from?: number | null;
  };
  departure?: Departure;
  tickets?: TicketOption[];
};

function normalizeStops(stops: RawDeparture["stops"]): string[] {
  if (!stops) return [];
  if (Array.isArray(stops)) {
    return stops.map((s) => String(s).trim()).filter(Boolean);
  }
  return String(stops)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function findDepartureForDate(
  trip: TripDbRow,
  targetDate: string
): Departure | null {
  let raw: RawDeparture[] = [];
  if (Array.isArray(trip.departures)) {
    raw = trip.departures;
  } else if (typeof trip.departures === "string") {
    try {
      const parsed = JSON.parse(trip.departures);
      if (Array.isArray(parsed)) raw = parsed;
    } catch {
      // ignore
    }
  }
  if (!raw.length) return null;

  const normalized = raw
    .map((r) => {
      const rawDate =
        (r.dep_date ||
          r.depart_date ||
          r.date ||
          r.day ||
          r.when ||
          "") as string;
      const date = String(rawDate).slice(0, 10);
      if (!date) return null;

      const time = String(r.dep_time || r.time || "").slice(0, 5);
      const line = String(r.line_name || r.line || "").trim();
      const stops = normalizeStops(r.stops);

      return { date, time, line, stops };
    })
    .filter(Boolean) as { date: string; time: string; line: string; stops: string[] }[];

  const found = normalized.find((d) => d.date === targetDate);
  if (!found) return null;

  return {
    ...found,
    longDate: formatLongDate(found.date),
    shortDate: formatShortDate(found.date),
  };
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slugQ = ctx.query.slug;
  const dateQ = ctx.query.date;

  const slug = typeof slugQ === "string" ? slugQ.trim() : "";
  const dateParam =
    typeof dateQ === "string" && dateQ.length >= 10
      ? dateQ.slice(0, 10)
      : "";

  if (!slug || !dateParam) {
    return {
      props: {
        ok: false,
        error: "Ogiltig länk. Saknar uppgifter om resa.",
      },
    };
  }

  // Hämta resan
  const { data: trip, error } = await supabase
    .from("trips")
    .select("id, title, subtitle, price_from, departures")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !trip) {
    console.error("kassa: trip not found", error);
    return {
      props: {
        ok: false,
        error: "Hittade inte resan.",
      },
    };
  }

  const t = trip as TripDbRow;
  const departure = findDepartureForDate(t, dateParam);

  if (!departure) {
    return {
      props: {
        ok: false,
        error: "Hittade ingen avgång för det datumet.",
      },
    };
  }

  // Försök hämta pris per biljettyp
  let tickets: TicketOption[] = [];
  try {
    const { data: pricingRows, error: pricingErr } = await supabase
      .from("trip_ticket_pricing")
      .select("ticket_type_id, price, currency, departure_date")
      .eq("trip_id", t.id);

    if (pricingErr) throw pricingErr;

    const rows =
      (pricingRows as {
        ticket_type_id: number;
        price: number;
        currency: string;
        departure_date: string | null;
      }[]) || [];

    // Först: rader som matchar just detta datum
    let relevant = rows.filter(
      (r) =>
        r.departure_date &&
        String(r.departure_date).slice(0, 10) === dateParam
    );

    // Om inga specifika för datumet – ta standard (departure_date IS NULL)
    if (!relevant.length) {
      relevant = rows.filter((r) => r.departure_date == null);
    }

    if (relevant.length) {
      const typeIds = Array.from(
        new Set(relevant.map((r) => r.ticket_type_id))
      );
      const { data: typeRows, error: typesErr } = await supabase
        .from("ticket_types")
        .select("id, name")
        .in("id", typeIds);

      if (typesErr) throw typesErr;

      const typeMap = new Map<number, string>();
      (typeRows || []).forEach((tr: any) => {
        typeMap.set(tr.id, tr.name);
      });

      tickets = relevant.map((r) => ({
        id: r.ticket_type_id,
        name: typeMap.get(r.ticket_type_id) || "Biljett",
        price: r.price,
      }));
    }
  } catch (e) {
    console.error("kassa: pricing lookup failed", e);
  }

  // Fallback om inga biljetter hittades
  if (!tickets.length) {
    tickets = [
      {
        id: 1,
        name: "Standardbiljett",
        price: t.price_from ? Number(t.price_from) : 0,
      },
    ];
  }

  return {
    props: {
      ok: true,
      trip: {
        id: t.id,
        title: t.title,
        subtitle: t.subtitle ?? null,
        price_from: t.price_from ?? null,
      },
      departure,
      tickets,
    },
  };
};

export default function CheckoutPage(props: Props) {
  const { ok, error, trip, departure } = props;
  const tickets = props.tickets || [];

  // State för antal biljetter per typ
  const [ticketCounts, setTicketCounts] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    tickets.forEach((t) => {
      init[t.id] = 0;
    });
    return init;
  });

  const totalTravelers = useMemo(
    () => Object.values(ticketCounts).reduce((a, b) => a + b, 0),
    [ticketCounts]
  );

  const totalPrice = useMemo(() => {
    return tickets.reduce((sum, t) => {
      const qty = ticketCounts[t.id] || 0;
      return sum + qty * t.price;
    }, 0);
  }, [tickets, ticketCounts]);

  function handleChangeCount(id: number, value: string) {
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) return;
    setTicketCounts((prev) => ({ ...prev, [id]: num }));
  }

  return (
    <>
      <Head>
        <title>Kassa – boka din resa | Helsingbuss</title>
      </Head>
      <div className="min-h-screen bg-white">
        <main className="max-w-5xl mx-auto px-4 py-10">
          {/* Liten logga/label */}
          <div className="text-[11px] font-semibold tracking-[0.18em] text-[#194C66] mb-2">
            HELSINGBUSS
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">
            Kassa – boka din resa
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Steg 1 av 3 – Välj biljetter och fyll i kontaktuppgifter.
          </p>

          {/* Steg-indikator */}
          <ol className="mt-4 flex flex-wrap gap-4 text-xs font-medium">
            {[
              { label: "Antal", sub: "Biljetter" },
              { label: "Uppgifter", sub: "Resenärer" },
              { label: "Bekräfta", sub: "Granska & betala" },
            ].map((s, index) => (
              <li key={s.label} className="flex items-center gap-2">
                <div
                  className={[
                    "w-6 h-6 rounded-full flex items-center justify-center border text-[11px]",
                    index === 0
                      ? "bg-[#194C66] border-[#194C66] text-white"
                      : "bg-white border-slate-300 text-slate-400",
                  ].join(" ")}
                >
                  {index + 1}
                </div>
                <div
                  className={
                    index === 0 ? "text-[#194C66]" : "text-slate-400"
                  }
                >
                  <div className="uppercase tracking-[0.14em]">
                    {s.label}
                  </div>
                  <div className="hidden sm:block text-[11px] text-slate-400 normal-case">
                    {s.sub}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Felmeddelande */}
          {(!ok || !trip || !departure) && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error || "Hittade ingen avgång för det datumet."}
            </div>
          )}

          {ok && trip && departure && (
            <div className="mt-6 space-y-6">
              {/* Resesammanfattning */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                      {departure.shortDate}
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-slate-900">
                      {trip.title}
                      {departure.time && ` ${departure.time}`}
                    </div>
                    {trip.subtitle && (
                      <p className="text-xs text-slate-500 mt-1">
                        {trip.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-right text-slate-600">
                    {trip.price_from != null && trip.price_from > 0 && (
                      <>
                        Pris från{" "}
                        <span className="font-semibold text-slate-900">
                          {Number(trip.price_from).toLocaleString("sv-SE")} kr
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="px-4 sm:px-5 py-3 text-xs text-slate-600 flex flex-wrap justify-between gap-2">
                  <div>
                    <span className="font-semibold">Avresa:</span>{" "}
                    {departure.longDate}
                    {departure.time && ` kl. ${departure.time}`}
                  </div>
                  {departure.line && (
                    <div>
                      <span className="font-semibold">Linje:</span>{" "}
                      {departure.line}
                    </div>
                  )}
                </div>
              </section>

              {/* Huvudinnehåll: biljetter + uppgifter + sammanfattning */}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
                {/* Vänsterkolumn */}
                <section className="space-y-5">
                  {/* Biljetter */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Biljetter
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Välj antal biljetter för varje biljettyp.
                      </p>
                    </div>
                    <div className="px-4 sm:px-5 py-4 space-y-3">
                      {tickets.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {t.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {t.price > 0
                                ? `${t.price.toLocaleString("sv-SE")} kr`
                                : "Pris sätts senare"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              Antal
                            </span>
                            <select
                              className="border rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                              value={ticketCounts[t.id] || 0}
                              onChange={(e) =>
                                handleChangeCount(t.id, e.target.value)
                              }
                            >
                              {Array.from({ length: 11 }).map((_, i) => (
                                <option key={i} value={i}>
                                  {i}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kontaktuppgifter – enkel version */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Kontaktuppgifter
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Vi använder dina uppgifter för att skicka biljett och
                        viktig reseinformation.
                      </p>
                    </div>
                    <div className="px-4 sm:px-5 py-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Förnamn
                        </label>
                        <input
                          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                          type="text"
                          placeholder="Förnamn"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Efternamn
                        </label>
                        <input
                          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                          type="text"
                          placeholder="Efternamn"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          E-post
                        </label>
                        <input
                          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                          type="email"
                          placeholder="namn@example.se"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Telefon
                        </label>
                        <input
                          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                          type="tel"
                          placeholder="07x-xxx xx xx"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Högerkolumn – sammanfattning */}
                <aside className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Sammanfattning
                      </h2>
                    </div>
                    <div className="px-4 py-4 space-y-2 text-sm text-slate-800">
                      <div className="flex justify-between">
                        <span>Antal resenärer</span>
                        <span className="font-medium">
                          {totalTravelers || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Biljettpris</span>
                        <span className="font-semibold">
                          {totalPrice.toLocaleString("sv-SE")} kr
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full bg-[#194C66] px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#163b4d] disabled:opacity-60"
                        // TODO: koppla till steg 2 när vi bygger vidare
                        disabled={totalTravelers === 0}
                      >
                        Nästa steg
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
