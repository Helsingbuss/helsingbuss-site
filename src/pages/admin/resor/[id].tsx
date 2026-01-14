// src/pages/admin/sundra/resor/[id].tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { TripRecord } from "@/lib/sundra/trips/types";

import { TripEditor } from "@/components/sundra/admin/trips/TripEditor";
import { tripRepo } from "@/lib/sundra/trips/repo.client";

export default function EditTripPage() {
  const router = useRouter();
  const idRaw = router.query.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<TripRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !id) return;

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const t = await tripRepo.getTripById(id);
        if (!alive) return;

        setTrip(t ?? null);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "Kunde inte läsa resan.");
        setTrip(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router.isReady, id]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">Redigera resa</div>
            <div className="text-sm text-gray-600">{id ? `ID: ${id}` : ""}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => id && router.push(`/admin/sundra/resor/_preview/${id}`)}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Förhandsgranska
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!id) return;
                try {
                  setErr(null);
                  await tripRepo.publishTrip(id); // ✅ finns igen (wrapper i repo.client)
                  const t = await tripRepo.getTripById(id);
                  setTrip(t ?? null);
                } catch (e: any) {
                  setErr(e?.message ?? "Kunde inte publicera resan.");
                }
              }}
              className="rounded-xl bg-[var(--hb-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Publicera
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!id) return;
                try {
                  setErr(null);
                  await tripRepo.archiveTrip(id); // ✅ finns igen (wrapper i repo.client)
                  router.push("/admin/sundra/resor");
                } catch (e: any) {
                  setErr(e?.message ?? "Kunde inte arkivera resan.");
                }
              }}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Arkivera
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">Laddar…</div>
        ) : err ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-red-600">Fel</div>
            <div className="mt-2 text-sm text-gray-700">{err}</div>
          </div>
        ) : !trip ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">Resan hittades inte.</div>
        ) : (
          <TripEditor
            trip={trip}
            onSave={async (nextTrip: TripRecord) => {
              const saved = await tripRepo.upsertTrip(nextTrip);
              setTrip(saved);
              router.replace(`/admin/sundra/resor/${saved.id}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
