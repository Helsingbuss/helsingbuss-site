// src/pages/widget/departures/[slug].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type TripInfo = {
  id: string;
  title: string;
  subtitle?: string | null;
};

type DepartureRow = {
  id: string;
  dateLabel: string;      // "2025-12-06 Lör"
  lineLabel?: string;     // "Linje 1"
  title: string;          // "Dagstur Ullared Shopping 07.30" (kan vara bara trip-titel)
  priceLabel?: string;    // "295:-"
  seatsLabel: string;     // ">8", "Slut", "Väntelista"
  status: "available" | "full" | "waitlist";
  stopsText?: string;     // Hållplatser + tider
};

type ApiResponse = {
  ok: boolean;
  trip?: TripInfo;
  departures?: DepartureRow[];
  error?: string;
};

export default function DeparturesWidgetPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [rows, setRows] = useState<DepartureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openInfoId, setOpenInfoId] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (!slug || Array.isArray(slug)) return;

    const s = String(slug);
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/public/widget/departures/${encodeURIComponent(s)}`
        );
        const json: ApiResponse = await res.json();

        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "Kunde inte läsa avgångar.");
        }

        if (cancelled) return;
        setTrip(json.trip ?? null);
        setRows(json.departures ?? []);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) {
          setError(e?.message || "Tekniskt fel.");
          setTrip(null);
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, slug]);

  return (
    <div className="hb-widget font-sans text-[14px] text-slate-900">
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-slate-50">
          <div className="text-sm font-semibold text-slate-800">
            {trip ? `Kommande avgångar – ${trip.title}` : "Kommande avgångar"}
          </div>
        </div>

        {/* Innehåll */}
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Laddar avgångar…</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-700 bg-red-50 border-t border-red-200">
            {error}
          </div>
        ) : !rows.length ? (
          <div className="p-4 text-sm text-slate-500">
            Inga kommande avgångar är upplagda för den här resan.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {/* Tabell-header (desktop) */}
            <div className="hidden md:grid grid-cols-[auto,1.1fr,2fr,1fr,1.3fr] gap-4 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50">
              <div className="pl-6">Avresa</div>
              <div>Linje</div>
              <div>Resmål</div>
              <div className="text-right">Pris från</div>
              <div className="text-right">Platser kvar</div>
            </div>

            {/* Rader */}
            {rows.map((row) => {
              const isFull = row.status === "full";
              const isWait = row.status === "waitlist";

              const buttonLabel = isWait ? "Väntelista" : "Boka";
              const buttonClasses = isWait
                ? "bg-[#f97316] hover:bg-[#ea580c]"
                : "bg-[#0055b8] hover:bg-[#00479a]";

              const seatsText = row.seatsLabel || "";

              return (
                <div key={row.id} className="group">
                  {/* Huvudrad */}
                  <div className="grid grid-cols-1 md:grid-cols-[auto,1.1fr,2fr,1fr,1.3fr] gap-3 px-4 py-3 items-center">
                    {/* Avresa + info-ikon */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="Visa hållplatser"
                        onClick={() =>
                          setOpenInfoId((prev) =>
                            prev === row.id ? null : row.id
                          )
                        }
                        className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-300 text-[11px] text-slate-700 bg-white hover:bg-slate-50 shrink-0"
                      >
                        i
                      </button>
                      <div className="text-sm font-medium text-slate-900">
                        {row.dateLabel}
                      </div>
                    </div>

                    {/* Linje */}
                    <div className="text-sm text-slate-800 md:text-left">
                      {row.lineLabel || "Linje"}
                    </div>

                    {/* Resmål */}
                    <div className="text-sm text-slate-900">{row.title}</div>

                    {/* Pris */}
                    <div className="text-sm font-medium text-slate-900 md:text-right">
                      {row.priceLabel}
                    </div>

                    {/* Platser + knapp */}
                    <div className="flex items-center justify-between md:justify-end gap-3">
                      <div className="text-sm text-slate-800">{seatsText}</div>
                      <button
                        type="button"
                        disabled={isFull}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold text-white whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${buttonClasses}`}
                      >
                        {buttonLabel}
                      </button>
                    </div>
                  </div>

                  {/* Popup med hållplatser */}
                  {openInfoId === row.id && (
                    <div className="px-4 pb-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <div className="font-semibold mb-1">
                          Påstigningsplatser &amp; tider
                        </div>
                        {row.stopsText ? (
                          <div>{row.stopsText}</div>
                        ) : (
                          <div>
                            Information om hållplatser kommer senare.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lite global styling för att widgeten ska funka fint i WordPress mm */}
      <style jsx global>{`
        .hb-widget * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
