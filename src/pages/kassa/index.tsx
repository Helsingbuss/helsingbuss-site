// src/pages/kassa/index.tsx
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";

type ApiDeparture = {
  id: string;
  trip_id: string;
  trip_title: string;
  slug?: string | null;
  hero_image?: string | null;
  date: string;
  weekday: string;
  time: string | null;
  line_name?: string | null;
  stops: string[];
  price_from: number | null;
  seats_left: number;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  departure?: ApiDeparture;
};

const STEPS = ["Antal", "Uppgifter", "Bekräfta", "Klart"];

export default function CheckoutStep1Page() {
  const router = useRouter();
  const [departure, setDeparture] = useState<ApiDeparture | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<number>(1);

  // Hämta avgång
  useEffect(() => {
    if (!router.isReady) return;
    const depId = router.query.departure_id;
    if (!depId || Array.isArray(depId)) {
      setErr("Ingen avgång vald. Gå tillbaka och välj resa igen.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const r = await fetch(
          `/api/public/checkout/departure?departure_id=${encodeURIComponent(
            String(depId)
          )}`
        );
        const j: ApiResponse = await r.json();
        if (!r.ok || !j.ok || !j.departure) {
          throw new Error(j.error || "Kunde inte hämta avgången.");
        }

        setDeparture(j.departure);
        // säkerställ att antal resenärer inte överstiger platser kvar
        const max = j.departure.seats_left || 1;
        setPassengers(Math.min(1, Math.max(1, max)));
      } catch (e: any) {
        setErr(e?.message || "Tekniskt fel vid hämtning av avgång.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router.isReady, router.query.departure_id]);

  const maxPassengers = useMemo(() => {
    if (!departure) return 1;
    return Math.max(
      1,
      Math.min(50, departure.seats_left || 1)
    );
  }, [departure]);

  const totalPrice = useMemo(() => {
    if (!departure || departure.price_from == null) return 0;
    return passengers * departure.price_from;
  }, [departure, passengers]);

  const stepTitle = departure
    ? `${departure.date} ${departure.trip_title}${
        departure.time ? " " + departure.time : ""
      }`
    : "Boka resa";

  const headerPriceText =
    departure?.price_from != null
      ? `${departure.price_from.toLocaleString("sv-SE")}:-`
      : "—";

  const handleNext = () => {
    // Här kommer vi senare gå vidare till steg 2 (uppgifter)
    // För nu kan vi bara lämna en liten alert så du ser att knappen funkar.
    alert(
      "Steg 2 (uppgifter) bygger vi i nästa steg. Nu har du steg 1 färdigt. 😊"
    );
  };

  return (
    <>
      <Head>
        <title>{stepTitle} – Helsingbuss</title>
      </Head>
      <div className="min-h-screen bg-[#f5f4f0] py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Steg-indikator */}
          <div className="mb-4">
            <div className="flex flex-wrap rounded-2xl overflow-hidden bg-white shadow border border-slate-200">
              {STEPS.map((label, idx) => {
                const active = idx === 0;
                const done = idx < 0; // framtid: när vi har fler steg
                return (
                  <div
                    key={label}
                    className={[
                      "flex-1 min-w-[70px] px-3 py-2 text-center text-xs sm:text-sm font-semibold uppercase tracking-wide",
                      active
                        ? "bg-[#0056A3] text-white"
                        : "bg-slate-50 text-slate-500",
                    ].join(" ")}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kortet för kassan */}
          <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
            {/* Header med resa + bild */}
            <div className="border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">
                  Steg 1 · Antal resenärer
                </div>
                <h1 className="mt-1 text-base sm:text-lg font-semibold text-slate-900">
                  {stepTitle}
                </h1>
                {departure && (
                  <p className="mt-1 text-xs sm:text-sm text-slate-600">
                    Avresa:{" "}
                    <span className="font-medium">
                      {departure.date} {departure.weekday}
                      {departure.time ? ` kl ${departure.time}` : ""}
                    </span>
                    {departure.line_name && (
                      <>
                        {" "}
                        · Linje {departure.line_name}
                      </>
                    )}
                  </p>
                )}
              </div>
              {departure?.hero_image && (
                <div className="w-full sm:w-56 h-24 sm:h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img
                    src={departure.hero_image}
                    alt={departure.trip_title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Innehåll */}
            <div className="px-4 sm:px-6 py-5">
              {loading && (
                <div className="text-sm text-slate-600">
                  Laddar avgång…
                </div>
              )}

              {!loading && err && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {err}
                </div>
              )}

              {!loading && !err && departure && (
                <>
                  {/* Info-rad */}
                  <div className="mb-4 text-xs sm:text-sm text-slate-600">
                    {departure.stops.length > 0 && (
                      <div>
                        <span className="font-semibold">
                          Påstigningsplatser:
                        </span>{" "}
                        {departure.stops.join(" · ")}
                      </div>
                    )}
                    <div className="mt-1">
                      {departure.seats_left > 0 ? (
                        <>
                          <span className="font-semibold">
                            Platser kvar:
                          </span>{" "}
                          {departure.seats_left}
                        </>
                      ) : (
                        <span className="text-red-600 font-semibold">
                          Avgången är fullbokad.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Antal-resenärer kort */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-5 sm:py-5">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-800 mb-1">
                          Antal resenärer
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                          Välj hur många personer som ska boka plats på
                          denna avgång.
                        </p>
                        <select
                          className="mt-1 block w-32 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A3]/40 focus:border-[#0056A3]"
                          value={passengers}
                          onChange={(e) =>
                            setPassengers(
                              Math.min(
                                maxPassengers,
                                Math.max(1, Number(e.target.value) || 1)
                              )
                            )
                          }
                          disabled={departure.seats_left <= 0}
                        >
                          {Array.from(
                            { length: maxPassengers },
                            (_, i) => i + 1
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n} {n === 1 ? "person" : "personer"}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Prisbox */}
                      <div className="sm:text-right">
                        <div className="text-xs uppercase tracking-wide text-slate-500">
                          Pris per person
                        </div>
                        <div className="text-lg font-semibold text-slate-900">
                          {headerPriceText}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          Totalt ({passengers}{" "}
                          {passengers === 1 ? "resenär" : "resenärer"}):
                        </div>
                        <div className="text-xl font-bold text-[#0056A3]">
                          {totalPrice.toLocaleString("sv-SE")}:-{" "}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nederkant med knappar */}
                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      ← Tillbaka till resan
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={departure.seats_left <= 0}
                      className="inline-flex items-center justify-center rounded-full bg-[#0056A3] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#00427c] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Nästa
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
