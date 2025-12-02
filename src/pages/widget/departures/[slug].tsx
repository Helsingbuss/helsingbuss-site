// src/pages/widget/departures/[slug].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";

type DepartureRow = {
  dep_date?: string;
  dep_time?: string;
  line_name?: string;
  stops?: string[] | string | null;
};

type Trip = {
  id: string;
  title: string;
  slug: string;
  price_from?: number | null;
  departures_coming_soon?: boolean;
  departures?: DepartureRow[];
};

function formatDateLabel(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
  } catch {
    return dateStr;
  }
}

function formatStops(raw: DepartureRow["stops"]) {
  if (!raw) return "";
  if (Array.isArray(raw)) return raw.join(", ");
  return String(raw);
}

export default function DeparturesWidgetPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || Array.isArray(slug)) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const r = await fetch(`/api/public/trips/${encodeURIComponent(slug)}`);
        const j = await r.json();

        if (!r.ok || j.ok === false || !j.trip) {
          throw new Error(j.error || "Resan hittades inte.");
        }

        setTrip(j.trip as Trip);
      } catch (e: any) {
        setError(e?.message || "Något gick fel.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const todayMs = new Date(new Date().toDateString()).getTime();
  const upcoming =
    trip?.departures
      ?.filter((d) => {
        const raw =
          d.dep_date ||
          (d as any).date ||
          (d as any).depart_date ||
          (d as any).departure_date;
        if (!raw) return false;
        const iso = String(raw).slice(0, 10);
        const ms = new Date(iso).getTime();
        return !isNaN(ms) && ms >= todayMs;
      })
      .sort((a, b) => {
        const aRaw =
          a.dep_date ||
          (a as any).date ||
          (a as any).depart_date ||
          (a as any).departure_date;
        const bRaw =
          b.dep_date ||
          (b as any).date ||
          (b as any).depart_date ||
          (b as any).departure_date;
        const aMs = new Date(String(aRaw).slice(0, 10)).getTime();
        const bMs = new Date(String(bRaw).slice(0, 10)).getTime();
        return aMs - bMs;
      }) || [];

  return (
    <>
      <Head>
        <title>Kommande avgångar – Helsingbuss</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-[0] bg-transparent text-[#194C66]">
        <div className="text-sm font-semibold mb-2">
          Kommande avgångar
        </div>

        {loading && (
          <div className="text-sm text-slate-500">Laddar…</div>
        )}

        {error && !loading && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && trip && trip.departures_coming_soon && (
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            Avgångsorter och datum kommer inom kort.
          </div>
        )}

        {!loading &&
          !error &&
          trip &&
          !trip.departures_coming_soon &&
          upcoming.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
              Inga kommande avgångar är upplagda för denna resa.
            </div>
          )}

        {!loading &&
          !error &&
          trip &&
          !trip.departures_coming_soon &&
          upcoming.length > 0 && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Datum</th>
                    <th className="px-3 py-2">Tid</th>
                    <th className="px-3 py-2">Linje</th>
                    <th className="px-3 py-2">Hållplatser</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((d, i) => (
                    <tr
                      key={i}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatDateLabel(d.dep_date as string)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {d.dep_time || ""}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {d.line_name || ""}
                      </td>
                      <td className="px-3 py-2">
                        {formatStops(d.stops)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </>
  );
}
