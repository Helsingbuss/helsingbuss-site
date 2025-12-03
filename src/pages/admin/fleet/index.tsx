// src/pages/admin/fleet/index.tsx
import { useEffect, useState } from "react";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";

type OperatorRow = {
  id: string;
  name: string;
  code?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  active: boolean;
};

type BusModelRow = {
  id: string;
  operator_id?: string | null;
  name: string;
  capacity: number | null;
  notes?: string | null;
  active: boolean;
};

type FleetLoadResp = {
  ok: boolean;
  operators: OperatorRow[];
  bus_models: BusModelRow[];
  error?: string;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[13px] font-medium text-[#194C66]/80 mb-1">
      {children}
    </div>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return <div className="text-[12px] text-[#194C66]/60 mt-1">{children}</div>;
}

function Card({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b">
        <h2 className="text-sm font-semibold tracking-wide text-[#194C66]">
          {title}
        </h2>
        {aside}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export default function FleetPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [operators, setOperators] = useState<OperatorRow[]>([]);
  const [busModels, setBusModels] = useState<BusModelRow[]>([]);

  // Operatör-form
  const [opEditingId, setOpEditingId] = useState<string | null>(null);
  const [opForm, setOpForm] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
    notes: "",
    active: true,
  });
  const [opBusy, setOpBusy] = useState<null | "save" | "delete">(null);
  const [opMsg, setOpMsg] = useState<string | null>(null);
  const [opErr, setOpErr] = useState<string | null>(null);

  // Buss-form
  const [busEditingId, setBusEditingId] = useState<string | null>(null);
  const [busForm, setBusForm] = useState({
    operator_id: "",
    name: "",
    capacity: "",
    notes: "",
    active: true,
  });
  const [busBusy, setBusBusy] = useState<null | "save" | "delete">(null);
  const [busMsg, setBusMsg] = useState<string | null>(null);
  const [busErr, setBusErr] = useState<string | null>(null);

  function resetOperatorForm() {
    setOpEditingId(null);
    setOpForm({
      name: "",
      code: "",
      phone: "",
      email: "",
      notes: "",
      active: true,
    });
    setOpErr(null);
    setOpMsg(null);
  }

  function resetBusForm() {
    setBusEditingId(null);
    setBusForm({
      operator_id: "",
      name: "",
      capacity: "",
      notes: "",
      active: true,
    });
    setBusErr(null);
    setBusMsg(null);
  }

  async function loadFleet() {
    try {
      setLoading(true);
      setErr(null);
      const r = await fetch("/api/admin/fleet/load");
      const j: FleetLoadResp = await r.json();
      if (!r.ok || !j.ok) {
        throw new Error(j.error || "Kunde inte ladda fordonsdata.");
      }
      setOperators(j.operators || []);
      setBusModels(j.bus_models || []);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Tekniskt fel vid laddning.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFleet();
  }, []);

  // ------- Operatörer -------
  function onOpChange<K extends keyof typeof opForm>(k: K, v: (typeof opForm)[K]) {
    setOpForm((s) => ({ ...s, [k]: v }));
  }

  function startEditOperator(row: OperatorRow) {
    setOpEditingId(row.id);
    setOpForm({
      name: row.name || "",
      code: row.code || "",
      phone: row.phone || "",
      email: row.email || "",
      notes: row.notes || "",
      active: row.active,
    });
    setOpErr(null);
    setOpMsg(null);
  }

  async function saveOperator() {
    try {
      setOpBusy("save");
      setOpErr(null);
      setOpMsg(null);

      const body = {
        id: opEditingId,
        name: opForm.name,
        code: opForm.code,
        phone: opForm.phone,
        email: opForm.email,
        notes: opForm.notes,
        active: opForm.active,
      };

      const r = await fetch("/api/admin/fleet/save-operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) {
        throw new Error(j.error || "Kunde inte spara operatör.");
      }

      setOpMsg("Operatören sparades.");
      // uppdatera listan lokalt
      const saved = j.row as OperatorRow;
      setOperators((prev) => {
        const idx = prev.findIndex((x) => x.id === saved.id);
        if (idx === -1) return [...prev, saved].sort((a, b) => a.name.localeCompare(b.name));
        const copy = [...prev];
        copy[idx] = saved;
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      });

      setTimeout(() => {
        setOpMsg(null);
      }, 1500);
    } catch (e: any) {
      console.error(e);
      setOpErr(e?.message || "Tekniskt fel vid sparande.");
    } finally {
      setOpBusy(null);
    }
  }

  async function deleteOperator(row: OperatorRow) {
    const ok = window.confirm(
      `Vill du ta bort operatören "${row.name}"? Detta går inte att ångra.`
    );
    if (!ok) return;

    try {
      setOpBusy("delete");
      setOpErr(null);
      setOpMsg(null);

      const r = await fetch("/api/admin/fleet/delete-operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) {
        throw new Error(j.error || "Kunde inte ta bort operatör.");
      }

      setOperators((prev) => prev.filter((x) => x.id !== row.id));
      if (opEditingId === row.id) resetOperatorForm();
    } catch (e: any) {
      console.error(e);
      setOpErr(e?.message || "Tekniskt fel vid borttagning.");
    } finally {
      setOpBusy(null);
    }
  }

  // ------- Bussar -------
  function onBusChange<K extends keyof typeof busForm>(k: K, v: (typeof busForm)[K]) {
    setBusForm((s) => ({ ...s, [k]: v }));
  }

  function startEditBus(row: BusModelRow) {
    setBusEditingId(row.id);
    setBusForm({
      operator_id: row.operator_id || "",
      name: row.name || "",
      capacity: row.capacity != null ? String(row.capacity) : "",
      notes: row.notes || "",
      active: row.active,
    });
    setBusErr(null);
    setBusMsg(null);
  }

  async function saveBus() {
    try {
      setBusBusy("save");
      setBusErr(null);
      setBusMsg(null);

      const body = {
        id: busEditingId,
        operator_id: busForm.operator_id || null,
        name: busForm.name,
        capacity: busForm.capacity,
        notes: busForm.notes,
        active: busForm.active,
      };

      const r = await fetch("/api/admin/fleet/save-bus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) {
        throw new Error(j.error || "Kunde inte spara fordon.");
      }

      setBusMsg("Fordonet sparades.");
      const saved = j.row as BusModelRow;

      setBusModels((prev) => {
        const idx = prev.findIndex((x) => x.id === saved.id);
        if (idx === -1) return [...prev, saved].sort((a, b) => a.name.localeCompare(b.name));
        const copy = [...prev];
        copy[idx] = saved;
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      });

      setTimeout(() => {
        setBusMsg(null);
      }, 1500);
    } catch (e: any) {
      console.error(e);
      setBusErr(e?.message || "Tekniskt fel vid sparande.");
    } finally {
      setBusBusy(null);
    }
  }

  async function deleteBus(row: BusModelRow) {
    const ok = window.confirm(
      `Vill du ta bort fordonet "${row.name}"? Detta går inte att ångra.`
    );
    if (!ok) return;

    try {
      setBusBusy("delete");
      setBusErr(null);
      setBusMsg(null);

      const r = await fetch("/api/admin/fleet/delete-bus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id }),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) {
        throw new Error(j.error || "Kunde inte ta bort fordon.");
      }

      setBusModels((prev) => prev.filter((x) => x.id !== row.id));
      if (busEditingId === row.id) resetBusForm();
    } catch (e: any) {
      console.error(e);
      setBusErr(e?.message || "Tekniskt fel vid borttagning.");
    } finally {
      setBusBusy(null);
    }
  }

  const operatorNameById = (id?: string | null) => {
    if (!id) return "";
    const op = operators.find((o) => o.id === id);
    return op ? op.name : "";
  };

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="px-6 pb-16 pt-14 lg:pt-20">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-[#194C66]">
              Fordonsflotta
            </h1>
            <p className="text-sm text-slate-600">
              Hantera operatörer och fordon som kan kopplas till dina resor.
            </p>
          </div>

          {err && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              Laddar fordonsdata…
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Operatörer */}
              <Card
                title="Operatörer"
                aside={
                  <button
                    type="button"
                    onClick={resetOperatorForm}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                  >
                    Ny operatör
                  </button>
                }
              >
                <div className="grid gap-4 lg:grid-cols-1">
                  {/* Form */}
                  <div>
                    <div className="text-xs text-slate-500 mb-2">
                      {opEditingId
                        ? "Redigerar befintlig operatör"
                        : "Skapa ny operatör"}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <FieldLabel>Namn</FieldLabel>
                        <input
                          className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                          value={opForm.name}
                          onChange={(e) =>
                            onOpChange("name", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Kortkod</FieldLabel>
                          <input
                            className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                            placeholder="t.ex. Bergkvara"
                            value={opForm.code}
                            onChange={(e) =>
                              onOpChange("code", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <FieldLabel>Telefon</FieldLabel>
                          <input
                            className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                            value={opForm.phone}
                            onChange={(e) =>
                              onOpChange("phone", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>E-post</FieldLabel>
                        <input
                          className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                          value={opForm.email}
                          onChange={(e) =>
                            onOpChange("email", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <FieldLabel>Anteckningar</FieldLabel>
                        <textarea
                          className="border rounded-xl px-3 py-2.5 w-full text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                          value={opForm.notes}
                          onChange={(e) =>
                            onOpChange("notes", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={opForm.active}
                            onChange={(e) =>
                              onOpChange("active", e.target.checked)
                            }
                          />
                          <span>Aktiv (kan väljas i resor)</span>
                        </label>
                        <div className="flex gap-2">
                          {opEditingId && (
                            <button
                              type="button"
                              onClick={resetOperatorForm}
                              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs hover:bg-slate-50"
                            >
                              Avbryt
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={saveOperator}
                            disabled={opBusy === "save"}
                            className="px-4 py-1.5 rounded-full bg-[#194C66] text-white text-xs font-semibold hover:bg-[#163b4d] disabled:opacity-60"
                          >
                            {opBusy === "save" ? "Sparar…" : "Spara operatör"}
                          </button>
                        </div>
                      </div>
                      {opErr && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                          {opErr}
                        </div>
                      )}
                      {opMsg && (
                        <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                          {opMsg}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista */}
                  <div className="mt-6">
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      Befintliga operatörer
                    </div>
                    {operators.length === 0 ? (
                      <div className="text-xs text-slate-500 border rounded-xl px-3 py-3">
                        Inga operatörer tillagda ännu.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="min-w-full text-xs">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-3 py-2 text-left">Namn</th>
                              <th className="px-3 py-2 text-left">Kontakt</th>
                              <th className="px-3 py-2 text-center">Status</th>
                              <th className="px-3 py-2 text-right">Åtgärd</th>
                            </tr>
                          </thead>
                          <tbody>
                            {operators.map((op) => (
                              <tr
                                key={op.id}
                                className="border-t border-slate-100 hover:bg-slate-50/70"
                              >
                                <td className="px-3 py-2 align-top">
                                  <div className="font-medium text-slate-900">
                                    {op.name}
                                  </div>
                                  {op.code && (
                                    <div className="text-[11px] text-slate-500">
                                      Kod: {op.code}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                                  {op.phone && <div>{op.phone}</div>}
                                  {op.email && <div>{op.email}</div>}
                                </td>
                                <td className="px-3 py-2 align-middle text-center">
                                  <span
                                    className={
                                      "inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium " +
                                      (op.active
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-slate-100 text-slate-600 border border-slate-200")
                                    }
                                  >
                                    {op.active ? "Aktiv" : "Inaktiv"}
                                  </span>
                                </td>
                                <td className="px-3 py-2 align-middle text-right">
                                  <div className="inline-flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => startEditOperator(op)}
                                      className="px-3 py-1 rounded-full border border-slate-200 text-[11px] text-slate-700 bg-white hover:bg-slate-50"
                                    >
                                      Redigera
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteOperator(op)}
                                      disabled={opBusy === "delete"}
                                      className="px-3 py-1 rounded-full border border-red-200 text-[11px] text-red-700 bg-white hover:bg-red-50 disabled:opacity-60"
                                    >
                                      Ta bort
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Fordon */}
              <Card
                title="Fordon / bussmodeller"
                aside={
                  <button
                    type="button"
                    onClick={resetBusForm}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
                  >
                    Ny bussmodell
                  </button>
                }
              >
                <div className="grid gap-4 lg:grid-cols-1">
                  {/* Form */}
                  <div>
                    <div className="text-xs text-slate-500 mb-2">
                      {busEditingId
                        ? "Redigerar befintligt fordon"
                        : "Skapa nytt fordon/bussmodell"}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <FieldLabel>Operatör</FieldLabel>
                        <select
                          className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                          value={busForm.operator_id}
                          onChange={(e) =>
                            onBusChange("operator_id", e.target.value)
                          }
                        >
                          <option value="">Välj operatör…</option>
                          {operators.map((op) => (
                            <option key={op.id} value={op.id}>
                              {op.name}
                            </option>
                          ))}
                        </select>
                        <Help>
                          Används för att veta vilket bolag som kör resan.
                        </Help>
                      </div>
                      <div>
                        <FieldLabel>Namn på bussmodell / fordon</FieldLabel>
                        <input
                          className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                          placeholder="t.ex. Mercedes-Benz Tourismo 50p"
                          value={busForm.name}
                          onChange={(e) =>
                            onBusChange("name", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FieldLabel>Kapacitet (platser)</FieldLabel>
                          <input
                            className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                            inputMode="numeric"
                            value={busForm.capacity}
                            onChange={(e) =>
                              onBusChange(
                                "capacity",
                                e.target.value.replace(/[^\d]/g, "")
                              )
                            }
                          />
                          <Help>Lämna tomt om du är osäker.</Help>
                        </div>
                        <div>
                          <FieldLabel>Status</FieldLabel>
                          <label className="inline-flex items-center gap-2 text-xs text-slate-700 mt-2">
                            <input
                              type="checkbox"
                              checked={busForm.active}
                              onChange={(e) =>
                                onBusChange("active", e.target.checked)
                              }
                            />
                            <span>Aktiv (tillgänglig i resor)</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Anteckningar</FieldLabel>
                        <textarea
                          className="border rounded-xl px-3 py-2.5 w-full text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                          value={busForm.notes}
                          onChange={(e) =>
                            onBusChange("notes", e.target.value)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex gap-2">
                          {busEditingId && (
                            <button
                              type="button"
                              onClick={resetBusForm}
                              className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs hover:bg-slate-50"
                            >
                              Avbryt
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={saveBus}
                          disabled={busBusy === "save"}
                          className="px-4 py-1.5 rounded-full bg-[#194C66] text-white text-xs font-semibold hover:bg-[#163b4d] disabled:opacity-60"
                        >
                          {busBusy === "save" ? "Sparar…" : "Spara fordon"}
                        </button>
                      </div>

                      {busErr && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                          {busErr}
                        </div>
                      )}
                      {busMsg && (
                        <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                          {busMsg}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lista */}
                  <div className="mt-6">
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      Befintliga fordon / bussmodeller
                    </div>
                    {busModels.length === 0 ? (
                      <div className="text-xs text-slate-500 border rounded-xl px-3 py-3">
                        Inga fordon tillagda ännu.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="min-w-full text-xs">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-3 py-2 text-left">Namn</th>
                              <th className="px-3 py-2 text-left">
                                Operatör
                              </th>
                              <th className="px-3 py-2 text-center">
                                Platser
                              </th>
                              <th className="px-3 py-2 text-center">Status</th>
                              <th className="px-3 py-2 text-right">Åtgärd</th>
                            </tr>
                          </thead>
                          <tbody>
                            {busModels.map((bm) => (
                              <tr
                                key={bm.id}
                                className="border-t border-slate-100 hover:bg-slate-50/70"
                              >
                                <td className="px-3 py-2 align-top">
                                  <div className="font-medium text-slate-900">
                                    {bm.name}
                                  </div>
                                  {bm.notes && (
                                    <div className="text-[11px] text-slate-500 line-clamp-2">
                                      {bm.notes}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2 align-middle text-[11px] text-slate-700">
                                  {operatorNameById(bm.operator_id) || "–"}
                                </td>
                                <td className="px-3 py-2 align-middle text-center text-[11px] text-slate-700">
                                  {bm.capacity != null ? bm.capacity : "–"}
                                </td>
                                <td className="px-3 py-2 align-middle text-center">
                                  <span
                                    className={
                                      "inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium " +
                                      (bm.active
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-slate-100 text-slate-600 border border-slate-200")
                                    }
                                  >
                                    {bm.active ? "Aktiv" : "Inaktiv"}
                                  </span>
                                </td>
                                <td className="px-3 py-2 align-middle text-right">
                                  <div className="inline-flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => startEditBus(bm)}
                                      className="px-3 py-1 rounded-full border border-slate-200 text-[11px] text-slate-700 bg-white hover:bg-slate-50"
                                    >
                                      Redigera
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteBus(bm)}
                                      disabled={busBusy === "delete"}
                                      className="px-3 py-1 rounded-full border border-red-200 text-[11px] text-red-700 bg-white hover:bg-red-50 disabled:opacity-60"
                                    >
                                      Ta bort
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
