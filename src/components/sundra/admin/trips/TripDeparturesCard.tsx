import React, { useEffect, useMemo, useState } from "react";
import { tripRepo } from "@/lib/sundra/trips/repo.client";

type DepStatus = "OPEN" | "SOLD_OUT" | "CANCELLED";

type Departure = {
  id: string;
  tripId: string;
  date: string;
  time: string | null;
  pickupId: string;
  pickupLabel: string;
  operatorName: string | null;
  seatsTotal: number;
  seatsReserved: number;
  status: DepStatus;
};

type PickupOption = { id: string; label: string };

const PICKUPS: PickupOption[] = [
  { id: "hb", label: "Helsingborg C" },
  { id: "ag", label: "Ängelholm Station" },
  { id: "la", label: "Landskrona Station" },
  { id: "ma", label: "Malmö C" },
];

function seatsLeft(d: Departure) {
  return Math.max((d.seatsTotal ?? 0) - (d.seatsReserved ?? 0), 0);
}

function normalizeTime(t?: string | null) {
  if (!t) return null;
  // Postgres kan ge "08:00:00" – vi vill ha "08:00"
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function apiStatusToUi(status?: string | null): DepStatus {
  const s = String(status || "").toLowerCase();
  if (s === "sold_out") return "SOLD_OUT";
  if (s === "cancelled") return "CANCELLED";
  // "open" eller "few" -> OPEN i UI
  return "OPEN";
}

function uiStatusToApi(status: DepStatus): string {
  if (status === "SOLD_OUT") return "sold_out";
  if (status === "CANCELLED") return "cancelled";
  return "open";
}

function extractPickup(stops: any): { pickupId: string; pickupLabel: string } {
  // Vi sparar i stops som [{ id, label }] (eller objekt om det råkar vara så)
  if (Array.isArray(stops) && stops.length > 0) {
    const first = stops[0];
    const id = String(first?.id ?? first?.pickupId ?? "").trim();
    const label = String(first?.label ?? first?.pickupLabel ?? "").trim();
    if (id) return { pickupId: id, pickupLabel: label || id };
  }
  if (stops && typeof stops === "object") {
    const id = String(stops?.id ?? stops?.pickupId ?? "").trim();
    const label = String(stops?.label ?? stops?.pickupLabel ?? "").trim();
    if (id) return { pickupId: id, pickupLabel: label || id };
  }
  // fallback
  return { pickupId: PICKUPS[0]?.id ?? "hb", pickupLabel: PICKUPS[0]?.label ?? "Helsingborg C" };
}

function recordToDeparture(r: any): Departure {
  const { pickupId, pickupLabel } = extractPickup(r?.stops);

  return {
    id: String(r?.id),
    tripId: String(r?.trip_id ?? r?.tripId ?? ""),
    date: String(r?.depart_date ?? r?.date ?? ""),
    time: normalizeTime(r?.dep_time ?? r?.time ?? null),
    pickupId,
    pickupLabel,
    operatorName: (r?.operator_name ?? r?.line_name ?? r?.operatorName ?? null) as any,
    seatsTotal: Number(r?.seats_total ?? r?.seatsTotal ?? 0),
    seatsReserved: Number(r?.seats_reserved ?? r?.seatsReserved ?? 0),
    status: apiStatusToUi(r?.status),
  };
}

export function TripDeparturesCard({ tripId }: { tripId: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Departure[]>([]);

  // Add-form
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pickupId, setPickupId] = useState(PICKUPS[0]?.id ?? "hb");
  const pickupLabel = useMemo(
    () => PICKUPS.find((p) => p.id === pickupId)?.label ?? pickupId,
    [pickupId]
  );
  const [operatorName, setOperatorName] = useState("");
  const [seatsTotal, setSeatsTotal] = useState<number>(63);
  const [status, setStatus] = useState<DepStatus>("OPEN");

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Departure> | null>(null);
  const isEditing = (id: string) => editingId === id;

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      // ✅ repo returnerar array: DepartureRecord[]
      const r = await tripRepo.listDepartures(tripId);
      const list = Array.isArray(r) ? r : [];
      setItems(list.map(recordToDeparture));
    } catch (e: any) {
      setErr(e?.message ?? "Kunde inte hämta avgångar.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!tripId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function onAdd() {
    try {
      setErr(null);

      if (!date.trim()) throw new Error("Datum saknas.");
      if (!time.trim()) throw new Error("Tid saknas.");
      if (!pickupId.trim()) throw new Error("Upphämtning saknas.");
      if (!Number.isFinite(seatsTotal) || seatsTotal < 0) throw new Error("Ogiltigt antal platser.");

      // ✅ Skicka fält enligt DB (och behåll dina UI-fält via stops/status)
      const payload: any = {
        depart_date: date,
        dep_time: time.trim() || null,
        line_name: operatorName.trim() || null, // "vem som kör" i din UI
        operator_name: operatorName.trim() || null, // om ni använder detta i DB
        seats_total: seatsTotal,
        status: uiStatusToApi(status),
        stops: [{ id: pickupId, label: pickupLabel }],
      };

      const created = await tripRepo.createDeparture(tripId, payload as any);
      const dep = recordToDeparture(created as any);

      setItems((prev) =>
        [...prev, dep].sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")))
      );

      // reset lite “snällt”
      setOperatorName("");
      setStatus("OPEN");
    } catch (e: any) {
      setErr(e?.message ?? "Kunde inte lägga till avgång.");
    }
  }

  function startEdit(d: Departure) {
    setEditingId(d.id);
    setEditDraft({ ...d });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  async function saveEdit() {
    if (!editingId || !editDraft) return;

    try {
      setErr(null);

      const nextPickupId = String(editDraft.pickupId ?? "").trim();
      const nextPickupLabel =
        PICKUPS.find((p) => p.id === nextPickupId)?.label ?? String(editDraft.pickupLabel ?? "").trim();

      const patch: any = {
        depart_date: String(editDraft.date ?? "").trim(),
        dep_time: String(editDraft.time ?? "").trim() || null,
        line_name: String(editDraft.operatorName ?? "").trim() || null,
        operator_name: String(editDraft.operatorName ?? "").trim() || null,
        seats_total: Number(editDraft.seatsTotal ?? 0),
        status: uiStatusToApi((editDraft.status ?? "OPEN") as DepStatus),
        stops: [{ id: nextPickupId, label: nextPickupLabel }],
      };

      const savedRec = await tripRepo.updateDeparture(editingId, patch as any);
      const saved = recordToDeparture(savedRec as any);

      setItems((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
      cancelEdit();
    } catch (e: any) {
      setErr(e?.message ?? "Kunde inte spara ändring.");
    }
  }

  async function remove(id: string) {
    const ok = window.confirm("Ta bort avgången? Detta går inte att ångra.");
    if (!ok) return;

    try {
      setErr(null);
      await tripRepo.deleteDeparture(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) cancelEdit();
    } catch (e: any) {
      setErr(e?.message ?? "Kunde inte ta bort avgång.");
    }
  }

  return (
    <div className="mt-6 rounded-2xl border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Avgångar</div>
          <div className="mt-1 text-sm text-gray-600">
            Lägg till datum, tid, upphämtning, operatör och antal platser. Ingen gräns på antal avgångar.
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          Uppdatera
        </button>
      </div>

      {err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
      ) : null}

      {/* Add-form */}
      <div className="mt-4 grid gap-3 md:grid-cols-6">
        <div className="md:col-span-1">
          <label className="block text-xs font-semibold text-gray-600">Datum</label>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-xs font-semibold text-gray-600">Tid</label>
          <input
            type="time"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-xs font-semibold text-gray-600">Upphämtning</label>
          <select
            className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            value={pickupId}
            onChange={(e) => setPickupId(e.target.value)}
          >
            {PICKUPS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-600">Operatör</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            placeholder="T.ex. Bergkvara, Norra Skåne Buss…"
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-xs font-semibold text-gray-600">Platser</label>
          <input
            type="number"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            value={seatsTotal}
            onChange={(e) => setSeatsTotal(Number(e.target.value))}
          />
        </div>

        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-gray-600">Status</label>
          <select
            className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as DepStatus)}
          >
            <option value="OPEN">Öppen</option>
            <option value="SOLD_OUT">Fullbokad</option>
            <option value="CANCELLED">Inställd</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-end">
          <button
            type="button"
            onClick={onAdd}
            className="w-full rounded-xl bg-[var(--hb-primary,#0B2A44)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            + Lägg till avgång
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-5 overflow-hidden rounded-2xl border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">Datum</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">Tid</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">Upphämtning</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">Operatör</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">Platser</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">Kvar</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">Åtgärd</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={8}>
                    Laddar avgångar…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={8}>
                    Inga avgångar ännu.
                  </td>
                </tr>
              ) : (
                items.map((d) => {
                  const editing = isEditing(d.id);
                  const draft = editing ? (editDraft as Departure) : d;

                  return (
                    <tr key={d.id} className="border-t">
                      <td className="px-3 py-2 align-top">
                        {editing ? (
                          <input
                            type="date"
                            className="w-[150px] rounded-lg border px-2 py-1 text-sm"
                            value={draft.date}
                            onChange={(e) => setEditDraft((x) => ({ ...(x as any), date: e.target.value }))}
                          />
                        ) : (
                          d.date
                        )}
                      </td>

                      <td className="px-3 py-2 align-top">
                        {editing ? (
                          <input
                            type="time"
                            className="w-[110px] rounded-lg border px-2 py-1 text-sm"
                            value={draft.time ?? ""}
                            onChange={(e) => setEditDraft((x) => ({ ...(x as any), time: e.target.value }))}
                          />
                        ) : (
                          d.time ?? "—"
                        )}
                      </td>

                      <td className="px-3 py-2 align-top">
                        {editing ? (
                          <select
                            className="rounded-lg border bg-white px-2 py-1 text-sm"
                            value={draft.pickupId}
                            onChange={(e) =>
                              setEditDraft((x) => ({
                                ...(x as any),
                                pickupId: e.target.value,
                                pickupLabel: PICKUPS.find((p) => p.id === e.target.value)?.label ?? e.target.value,
                              }))
                            }
                          >
                            {PICKUPS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          d.pickupLabel
                        )}
                      </td>

                      <td className="px-3 py-2 align-top">
                        {editing ? (
                          <input
                            className="w-[220px] rounded-lg border px-2 py-1 text-sm"
                            value={draft.operatorName ?? ""}
                            onChange={(e) => setEditDraft((x) => ({ ...(x as any), operatorName: e.target.value }))}
                          />
                        ) : (
                          d.operatorName ?? "—"
                        )}
                      </td>

                      <td className="px-3 py-2 align-top text-right">
                        {editing ? (
                          <input
                            type="number"
                            className="w-[90px] rounded-lg border px-2 py-1 text-sm text-right"
                            value={draft.seatsTotal}
                            onChange={(e) => setEditDraft((x) => ({ ...(x as any), seatsTotal: Number(e.target.value) }))}
                          />
                        ) : (
                          d.seatsTotal
                        )}
                      </td>

                      <td className="px-3 py-2 align-top text-right">{seatsLeft(d)}</td>

                      <td className="px-3 py-2 align-top">
                        {editing ? (
                          <select
                            className="rounded-lg border bg-white px-2 py-1 text-sm"
                            value={draft.status}
                            onChange={(e) => setEditDraft((x) => ({ ...(x as any), status: e.target.value }))}
                          >
                            <option value="OPEN">Öppen</option>
                            <option value="SOLD_OUT">Fullbokad</option>
                            <option value="CANCELLED">Inställd</option>
                          </select>
                        ) : (
                          <span className="rounded-full border bg-white px-2 py-0.5 text-xs font-semibold text-gray-700">
                            {d.status}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-2 align-top text-right">
                        {editing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="rounded-lg bg-[var(--hb-primary,#0B2A44)] px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Spara
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-gray-900"
                            >
                              Avbryt
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(d)}
                              className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                            >
                              Redigera
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(d.id)}
                              className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Ta bort
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
