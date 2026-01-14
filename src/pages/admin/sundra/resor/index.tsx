// src/pages/admin/sundra/resor/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PublicLayout } from "@/components/sundra/public/PublicLayout";
import type { TripRecord } from "@/lib/sundra/trips/types";

// Status i DB (och i dina andra filer) är gemener:
type StatusFilter = "all" | "draft" | "published" | "archived";
type TripStatusDb = "draft" | "published" | "archived";

function StatusPill({ status }: { status: TripStatusDb }) {
  const cls =
    status === "published"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "archived"
      ? "bg-gray-100 text-gray-700 border-gray-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  const label =
    status === "published" ? "Publicerad" : status === "archived" ? "Arkiverad" : "Utkast";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export default function AdminTripsIndex() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);

    try {
      const qs = status === "all" ? "" : `?status=${encodeURIComponent(status)}`;
      const res = await fetch(`/api/trips${qs}`);

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setTrips(data.trips || []);
    } catch (e: any) {
      setTrips([]);
      setLoadError(e?.message ?? "Kunde inte hämta resor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return trips;
    return trips.filter(
      (t: any) =>
        String(t.title || "").toLowerCase().includes(s) ||
        String(t.slug || "").toLowerCase().includes(s)
    );
  }, [trips, q]);

  return (
    <PublicLayout>
      <Head>
        <title>Admin – Resor</title>
      </Head>

      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin – Resor</h1>
            <div className="mt-1 text-sm text-gray-600">Skapa, förhandsgranska, publicera och arkivera.</div>
          </div>

          {/* ✅ rätt admin-route */}
          <Link
            href="/admin/sundra/resor/ny"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            style={{ background: "var(--hb-primary)" }}
          >
            + Ny resa
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
          >
            <option value="all">Alla</option>
            <option value="draft">Utkast</option>
            <option value="published">Publicerade</option>
            <option value="archived">Arkiverade</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sök titel eller slug…"
            className="w-full max-w-md rounded-xl border bg-white px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={load}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Uppdatera
          </button>
        </div>

        {loadError ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {loadError}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border bg-white">
          {loading ? (
            <div className="p-6 text-sm text-gray-700">Laddar…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-gray-700">Inga resor hittades.</div>
          ) : (
            <div className="divide-y">
              {filtered.map((t: any) => {
                const dbStatus = String(t.status ?? "draft").toLowerCase() as TripStatusDb;

                // ✅ Preview via din nya public-sida: /resor/[slug]?preview=1&previewId=...
                const canPreview = Boolean(t.slug);

                return (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-[260px]">
                      <div className="flex items-center gap-3">
                        <StatusPill status={dbStatus} />
                        <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">/{t.slug}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/sundra/resor/${t.id}`}
                        className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        Redigera
                      </Link>

                      {dbStatus === "published" ? (
                        <Link
                          href={`/resor/${t.slug}`}
                          target="_blank"
                          className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                          style={{ background: "var(--hb-accent)" }}
                        >
                          Öppna live
                        </Link>
                      ) : (
                        <Link
                          href={
                            canPreview
                              ? `/resor/${t.slug}?preview=1&previewId=${encodeURIComponent(t.id)}`
                              : "#"
                          }
                          onClick={(e) => {
                            if (!canPreview) e.preventDefault();
                          }}
                          target="_blank"
                          className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                          style={{ background: "var(--hb-accent)" }}
                        >
                          Förhandsgranska
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
