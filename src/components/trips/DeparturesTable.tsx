// src/components/trips/DeparturesTable.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type DepartureStatus = "available" | "full" | "waitlist";

type DepartureRow = {
  id: string;
  trip_id: string;
  trip_title: string;
  date: string | null; // YYYY-MM-DD
  weekday: string; // "tor", "fre" ...
  dep_time: string | null; // "06:30"
  line_name: string | null;
  price_from: number | null;
  seats_left: number | null;
  status: DepartureStatus;

  // extra fält för hållplatser (om/när API:t skickar det)
  stops_text?: string | null;
  stops?: string[] | null;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  trip?: {
    id: string;
    title: string;
    price_from: number | null;
    slug: string | null;
  };
  departures?: DepartureRow[];
};

export function DeparturesTable({ slug }: { slug: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<DepartureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeLine, setActiveLine] = useState<string>("ALL"); // "Visa alla resor" / linjenamn

  useEffect(() => {
    if (!slug) return;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const r = await fetch(
          `/api/public/trips/departures?slug=${encodeURIComponent(slug)}`
        );
        const j: ApiResponse = await r.json();
        if (!r.ok || !j.ok) {
          throw new Error(j.error || "Kunde inte hämta avgångar.");
        }
        setRows(j.departures || []);
      } catch (e: any) {
        setErr(e?.message || "Tekniskt fel.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Datum (2026-02-07 Lör)
  function formatDepartureDate(row: DepartureRow) {
    if (!row.date) return "–";
    const day = row.date;
    const wd = row.weekday
      ? row.weekday.charAt(0).toUpperCase() + row.weekday.slice(1)
      : "";
    return [day, wd].filter(Boolean).join(" ");
  }

  // Tid (06:30)
  function formatDepartureTime(row: DepartureRow) {
    if (!row.dep_time) return "";
    return row.dep_time.slice(0, 5);
  }

  function formatPrice(price: number | null) {
    if (price == null) return "–";
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(price); // "295 kr"
  }

  function seatsLabel(row: DepartureRow) {
    if (row.status === "full") return "Fullsatt";

    const n = row.seats_left;
    if (n == null) return ">8";

    if (n <= 0) return "Fullsatt";
    if (n <= 3) return "Få platser";
    if (n > 8) return ">8";

    return String(n);
  }

  function stopsText(row: DepartureRow) {
    if (Array.isArray(row.stops) && row.stops.length > 0) {
      return row.stops.join(", ");
    }
    if (row.stops_text) return row.stops_text;
    return "";
  }

  function handleBook(row: DepartureRow) {
    if (row.status === "full") return;
    router.push(`/kassa?departure_id=${encodeURIComponent(row.id)}`);
  }

  // Linje-filter (Linje 1, Linje 2, …)
  const lineNames = Array.from(
    new Set(rows.map((r) => r.line_name).filter((x): x is string => !!x))
  ).sort();

  const filteredRows =
    activeLine === "ALL"
      ? rows
      : rows.filter((r) => r.line_name === activeLine);

  const buttonClass = (value: string) =>
    [
      "px-3 py-1.5 rounded-full text-xs font-medium border transition",
      value === activeLine
        ? "bg-[#194C66] text-white border-[#194C66]"
        : "bg-transparent text-[#194C66] border-slate-300 hover:bg-slate-100",
    ].join(" ");

  return (
    <div className="mt-6">
      {/* Rubrik */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[#0f172a]">
          Kommande avgångar
        </h2>
      </div>

      {err && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Laddar avgångar…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-slate-500">
          Inga kommande avgångar är upplagda för denna resa.
        </div>
      ) : (
        <>
          {/* Filterknappar: Visa alla + Linje 1, Linje 2, ... */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={buttonClass("ALL")}
              onClick={() => setActiveLine("ALL")}
            >
              Visa alla resor
            </button>
            {lineNames.map((name) => (
              <button
                key={name}
                type="button"
                className={buttonClass(name)}
                onClick={() => setActiveLine(name)}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Själva tabellen – ingen stor kort-bakgrund runt */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-2 py-2 text-left">Avresa</th>
                  <th className="px-2 py-2 text-left">Linje</th>
                  <th className="px-2 py-2 text-left">Resmål</th>
                  <th className="px-2 py-2 text-right">Pris från</th>
                  <th className="px-2 py-2 text-right">Platser kvar</th>
                  <th className="px-2 py-2 text-right">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const dateLabel = formatDepartureDate(row);
                  const timeLabel = formatDepartureTime(row);
                  const sLabel = seatsLabel(row);
                  const sText = stopsText(row);
                  const isFull = row.status === "full";
                  const isWaitlist = row.status === "waitlist";

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 bg-white hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Avresa + info-ikon */}
                      <td className="px-2 py-3 align-middle text-slate-900">
                        <div className="flex items-center gap-2">
                          {sText && (
                            <span
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-[11px] text-[#194C66]"
                              title={sText}
                            >
                              i
                            </span>
                          )}
                          <div>
                            <div className="font-medium">{dateLabel}</div>
                            {timeLabel && (
                              <div className="text-xs text-slate-500">
                                kl. {timeLabel}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Linje */}
                      <td className="px-2 py-3 align-middle text-slate-800">
                        {row.line_name || (
                          <span className="text-slate-400">–</span>
                        )}
                      </td>

                      {/* Resmål */}
                      <td className="px-2 py-3 align-middle text-slate-800">
                        <div className="font-medium">{row.trip_title}</div>
                        {timeLabel && (
                          <div className="text-xs text-slate-500">
                            Avresa kl. {timeLabel}
                          </div>
                        )}
                      </td>

                      {/* Pris från */}
                      <td className="px-2 py-3 align-middle text-right text-slate-900">
                        {row.price_from != null ? (
                          <span className="font-medium">
                            {formatPrice(row.price_from)}
                          </span>
                        ) : (
                          <span className="text-slate-400">–</span>
                        )}
                      </td>

                      {/* Platser kvar */}
                      <td className="px-2 py-3 align-middle text-right">
                        <span className="inline-flex min-w-[72px] justify-end text-xs font-medium text-slate-800">
                          {sLabel}
                        </span>
                      </td>

                      {/* Boka / Fullsatt / Väntelista */}
                      <td className="px-2 py-3 align-middle text-right">
                        {isFull ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center justify-center rounded-full bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 cursor-not-allowed"
                          >
                            Fullsatt
                          </button>
                        ) : isWaitlist ? (
                          <button
                            type="button"
                            onClick={() => handleBook(row)}
                            className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 hover:shadow-md transition"
                          >
                            Väntelista
                            <span className="ml-2 text-sm">→</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBook(row)}
                            className="inline-flex items-center justify-center rounded-full bg-[#194C66] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#163b4d] hover:shadow-md transition"
                          >
                            Boka
                            <span className="ml-2 text-sm">→</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default DeparturesTable;
