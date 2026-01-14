// src/pages/admin/sundra/avgangar/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

import type { TripRecord } from "@/lib/sundra/trips/types";
import { tripRepo } from "@/lib/sundra/trips/repo.client";

// För att slippa hydration-strul med klockan i Topbar (SSR vs client)
const Topbar = dynamic(() => import("@/components/sundra/Topbar").then((m) => m.Topbar), {
  ssr: false,
});
const Sidebar = dynamic(() => import("@/components/sundra/Sidebar").then((m) => m.Sidebar), {
  ssr: false,
});

type OperatorRecord = {
  id: string;
  name: string;
  short_name: string | null;
  is_active: boolean;
};

type DepartureRow = {
  id: string;
  trip_id: string;
  depart_date: string; // YYYY-MM-DD
  dep_time: string | null; // HH:MM
  seats_total: number | null;
  seats_reserved: number | null;
  status?: string;
  operator_id?: string | null;
  line_name?: string | null;
  operator?: { id: string; name: string; short_name: string | null } | null; // om API skickar med
};

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Om vi får HTML (t.ex. 404 sida) så visar vi bra fel
    throw new Error(text?.slice(0, 120) || `HTTP ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }

  return data as T;
}

function toOperatorLabel(op?: OperatorRecord | null) {
  if (!op) return "";
  return (op.short_name || op.name || "").trim();
}

export default function AdminDeparturesPage() {
  const router = useRouter();

  const [err, setErr] = useState<string | null>(null);

  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);

  const [operators, setOperators] = useState<OperatorRecord[]>([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);

  const [tripId, setTripId] = useState<string>("");

  const [departures, setDepartures] = useState<DepartureRow[]>([]);
  const [depsLoading, setDepsLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create-form state
  const [newDate, setNewDate] = useState<string>("");
  const [newTime, setNewTime] = useState<string>("");
  const [newSeats, setNewSeats] = useState<string>("63");
  const [newOperatorId, setNewOperatorId] = useState<string>("");

  const selectedTrip = useMemo(() => {
    if (!Array.isArray(trips)) return null;
    return trips.find((t: any) => t?.id === tripId) ?? null;
  }, [trips, tripId]);

  // 1) Hämta resor + operatörer
  useEffect(() => {
    (async () => {
      setErr(null);

      setTripsLoading(true);
      try {
        const t = await tripRepo.listTrips({ status: "all" as any, type: "all" as any });
        setTrips(Array.isArray(t) ? t : []);
      } catch (e: any) {
        setTrips([]);
        setErr(e?.message ?? "Kunde inte hämta resor.");
      } finally {
        setTripsLoading(false);
      }
    })();

    (async () => {
      setOperatorsLoading(true);
      try {
        const data = await jsonFetch<{ operators: OperatorRecord[] }>(
          "/api/sundra/admin/operators?active=true"
        );
        setOperators(Array.isArray(data?.operators) ? data.operators : []);
      } catch (e: any) {
        setOperators([]);
        // Visa inte hårt om operatörer failar – men logga fel i UI
        setErr((prev) => prev ?? (e?.message ?? "Kunde inte hämta operatörer."));
      } finally {
        setOperatorsLoading(false);
      }
    })();
  }, []);

  // 2) Om URL har tripId, välj den (valfritt)
  useEffect(() => {
    const qTrip = typeof router.query.tripId === "string" ? router.query.tripId : "";
    if (qTrip && !tripId) setTripId(qTrip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.tripId]);

  // 3) Hämta avgångar när resa väljs
  useEffect(() => {
    if (!tripId) {
      setDepartures([]);
      return;
    }

    (async () => {
      setErr(null);
      setDepsLoading(true);
      try {
        const deps = await tripRepo.listDepartures(tripId);
        setDepartures(Array.isArray(deps) ? (deps as any) : []);
      } catch (e: any) {
        setDepartures([]);
        setErr(e?.message ?? "Kunde inte hämta avgångar.");
      } finally {
        setDepsLoading(false);
      }
    })();
  }, [tripId]);

  const operatorMap = useMemo(() => {
    const m = new Map<string, OperatorRecord>();
    operators.forEach((o) => m.set(o.id, o));
    return m;
  }, [operators]);

  function displayOperator(dep: DepartureRow) {
    // Om API skickar med operator:
    if (dep.operator?.short_name || dep.operator?.name) return dep.operator.short_name || dep.operator.name;

    // Annars om dep har operator_id:
    const op = dep.operator_id ? operatorMap.get(dep.operator_id) : null;
    if (op) return op.short_name || op.name;

    // Fallback:
    return dep.line_name || "—";
  }

  async function createDeparture() {
    if (!tripId) return;
    if (!newDate.trim()) {
      setErr("Välj datum först.");
      return;
    }

    const op = newOperatorId ? operatorMap.get(newOperatorId) : null;
    const lineName = op ? toOperatorLabel(op) : null;

    setSaving(true);
    setErr(null);
    try {
      const created = await tripRepo.createDeparture(tripId, {
        depart_date: newDate.trim(),
        dep_time: newTime.trim() ? newTime.trim() : null,
        seats_total: newSeats.trim() ? Number(newSeats.trim()) : 0,
        operator_id: newOperatorId || null,
        // Vi sparar även line_name som fallback-display (bra om ni senare vill ha fri text också)
        line_name: lineName,
      } as any);

      // createDeparture kan returnera record eller {departure}; repo normaliserar oftast, men säkra:
      const dep = (created as any)?.departure ? (created as any).departure : created;

      setDepartures((prev) => {
        const next = [dep as any, ...(prev ?? [])];
        // Sortera stigande datum/tid för fin lista
        next.sort((a: any, b: any) => {
          const da = String(a.depart_date || "");
          const db = String(b.depart_date || "");
          if (da !== db) return da.localeCompare(db);
          return String(a.dep_time || "").localeCompare(String(b.dep_time || ""));
        });
        return next;
      });

      setShowCreate(false);
      setNewDate("");
      setNewTime("");
      setNewOperatorId("");
      setNewSeats("63");
    } catch (e: any) {
      setErr(e?.message ?? "Kunde inte skapa avgång.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDeparture(depId: string) {
    const ok = window.confirm("Ta bort avgången? Detta går inte att ångra.");
    if (!ok) return;

    setSaving(true);
    setErr(null);
    try {
      await tripRepo.deleteDeparture(depId);
      setDepartures((prev) => (prev ?? []).filter((d) => d.id !== depId));
    } catch (e: any) {
      setErr(e?.message ?? "Kunde inte ta bort avgång.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />

      <div className="flex">
        <Sidebar />

        {/* Sidebar är fixed (w-72), så vi offsettar main */}
        <main className="flex-1 p-6 md:ml-72">
          {/* Header */}
          <div className="mx-auto w-full max-w-[1100px]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold text-gray-900">Avgångar</div>
                <div className="mt-1 text-sm text-gray-600">
                  Lägg in datum, tid, operatör och antal platser. Inget visas på resans sida – detta används när
                  kunden trycker <span className="font-semibold">Boka</span> i sökmodulen.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                + Ny avgång
              </button>
            </div>

            {/* Error */}
            {err ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            ) : null}

            {/* Välj resa */}
            <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Välj resa</div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <select
                  className="w-full max-w-[520px] rounded-2xl border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2"
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  disabled={tripsLoading}
                >
                  <option value="">{tripsLoading ? "Hämtar resor…" : "Välj resa…"}</option>
                  {(trips ?? []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.title || t.slug || t.id}
                    </option>
                  ))}
                </select>

                <div className="text-sm text-gray-600">
                  Vald resa:{" "}
                  <span className="font-semibold text-gray-900">
                    {selectedTrip ? (selectedTrip as any).title : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabell */}
            <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="py-3 pr-3">Datum</th>
                      <th className="py-3 pr-3">Tid</th>
                      <th className="py-3 pr-3">Operatör (vem kör)</th>
                      <th className="py-3 pr-3">Platser</th>
                      <th className="py-3 pr-3">Bokade</th>
                      <th className="py-3 text-right">Åtgärd</th>
                    </tr>
                  </thead>

                  <tbody className="text-sm">
                    {/* Create row */}
                    {showCreate ? (
                      <tr className="border-t">
                        <td className="py-3 pr-3 align-top">
                          <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2"
                          />
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2"
                          />
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <select
                            className="w-full rounded-xl border bg-white px-3 py-2 font-semibold outline-none focus:ring-2"
                            value={newOperatorId}
                            onChange={(e) => setNewOperatorId(e.target.value)}
                            disabled={operatorsLoading}
                          >
                            <option value="">
                              {operatorsLoading ? "Hämtar operatörer…" : "Välj operatör…"}
                            </option>
                            {(operators ?? []).map((o) => (
                              <option key={o.id} value={o.id}>
                                {(o.short_name || o.name) ?? o.id}
                              </option>
                            ))}
                          </select>

                          <div className="mt-1 text-xs text-gray-500">
                            (Sparas som <span className="font-semibold">operator_id</span> + fallback{" "}
                            <span className="font-semibold">line_name</span>)
                          </div>
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <input
                            type="number"
                            value={newSeats}
                            onChange={(e) => setNewSeats(e.target.value)}
                            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2"
                            min={0}
                          />
                        </td>

                        <td className="py-3 pr-3 align-top">
                          <div className="rounded-xl border bg-gray-50 px-3 py-2 text-gray-600">0</div>
                        </td>

                        <td className="py-3 text-right align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowCreate(false)}
                              className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                              disabled={saving}
                            >
                              Stäng
                            </button>

                            <button
                              type="button"
                              onClick={createDeparture}
                              className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                              disabled={saving || !tripId}
                            >
                              {saving ? "Sparar…" : "Spara"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : null}

                    {/* Data rows */}
                    {depsLoading ? (
                      <tr className="border-t">
                        <td className="py-6 text-center text-sm text-gray-500" colSpan={6}>
                          Hämtar avgångar…
                        </td>
                      </tr>
                    ) : (departures ?? []).length === 0 ? (
                      <tr className="border-t">
                        <td className="py-10 text-center text-sm text-gray-500" colSpan={6}>
                          Inga avgångar ännu. Klicka <span className="font-semibold">Ny avgång</span>.
                        </td>
                      </tr>
                    ) : (
                      (departures ?? []).map((d) => (
                        <tr key={d.id} className="border-t">
                          <td className="py-3 pr-3">{d.depart_date || "—"}</td>
                          <td className="py-3 pr-3">{d.dep_time || "—"}</td>
                          <td className="py-3 pr-3">{displayOperator(d)}</td>
                          <td className="py-3 pr-3">{typeof d.seats_total === "number" ? d.seats_total : "—"}</td>
                          <td className="py-3 pr-3">{typeof d.seats_reserved === "number" ? d.seats_reserved : 0}</td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => deleteDeparture(d.id)}
                              className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                              disabled={saving}
                              title="Ta bort"
                            >
                              Ta bort
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Tips: du kan lägga in hur många avgångar du vill. (Senare kopplar vi även hållplatser + priser + biljettyper här.)
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
