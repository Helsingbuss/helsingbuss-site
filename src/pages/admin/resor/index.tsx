import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PublicLayout } from "@/components/sundra/public/PublicLayout";
import { TripRecord, TripStatus } from "@/lib/sundra/trips/types";

function StatusPill({ status }: { status: TripStatus }) {
  const cls =
    status === "PUBLISHED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "ARCHIVED"
      ? "bg-gray-100 text-gray-700 border-gray-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  const label = status === "PUBLISHED" ? "Publicerad" : status === "ARCHIVED" ? "Arkiverad" : "Utkast";
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

export default function AdminTripsIndex() {
  const [status, setStatus] = useState<TripStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/trips?status=${status}`);
    const data = await res.json();
    setTrips(data.trips || []);
    setLoading(false);
  }

  async function onDeleteTrip(id: string, title: string) {
    const ok = window.confirm(`Ta bort "${title}"?\n\nDetta går inte att ångra.`);
    if (!ok) return;

    const res = await fetch(`/api/trips/delete?id=${encodeURIComponent(id)}`, {
      method: "POST",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.ok === false) {
      alert(data?.error ?? "Kunde inte ta bort resan.");
      return;
    }

    await load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return trips;
    return trips.filter((t) => (t.title || "").toLowerCase().includes(s) || (t.slug || "").toLowerCase().includes(s));
  }, [trips, q]);

  return (
    <PublicLayout>
      <Head><title>Admin – Resor</title></Head>

      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin – Resor</h1>
            <div className="mt-1 text-sm text-gray-600">Skapa, förhandsgranska, publicera och arkivera.</div>
          </div>

          <Link
            href="/admin/resor/ny"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            style={{ background: "var(--hb-primary)" }}
          >
            + Ny resa
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-xl border bg-white px-3 py-2 text-sm"
          >
            <option value="ALL">Alla</option>
            <option value="DRAFT">Utkast</option>
            <option value="PUBLISHED">Publicerade</option>
            <option value="ARCHIVED">Arkiverade</option>
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

        <div className="overflow-hidden rounded-2xl border bg-white">
          {loading ? (
            <div className="p-6 text-sm text-gray-700">Laddar…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-gray-700">Inga resor hittades.</div>
          ) : (
            <div className="divide-y">
              {filtered.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-[260px]">
                    <div className="flex items-center gap-3">
                      <StatusPill status={t.status} />
                      <div className="text-sm font-semibold text-gray-900">{t.title}</div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">/{t.slug}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/resor/${t.id}`}
                      className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Redigera
                    </Link>

                    {t.status === "PUBLISHED" ? (
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
                        href={`/resor/preview?id=${t.id}`}
                        target="_blank"
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                        style={{ background: "var(--hb-accent)" }}
                      >
                        Förhandsgranska
                      </Link>
                    )}

                    {/* ✅ NY: TA BORT */}
                    <button
                      type="button"
                      onClick={() => onDeleteTrip(t.id, t.title)}
                      className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                      title="Tar bort resan permanent"
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
