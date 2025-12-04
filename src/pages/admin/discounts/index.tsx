// src/pages/admin/discounts/index.tsx
import { useEffect, useState, useMemo } from "react";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";

type DiscountCampaign = {
  id?: string;
  name: string;
  description?: string;
  code?: string;
  trip_id?: string | null;
  discount_type: "fixed" | "percent" | "two_for_one";
  discount_value: number | null;
  min_quantity: number | null;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;   // YYYY-MM-DD
  active: boolean;
};

type ListResponse = {
  ok: boolean;
  error?: string;
  campaigns?: DiscountCampaign[];
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[13px] font-medium text-[#194C66]/80 mb-1">
      {children}
    </div>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] text-[#194C66]/60 mt-1">{children}</div>
  );
}

function Card(props: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const { title, children, aside } = props;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200/70">
        <h3 className="text-sm font-semibold tracking-wide text-[#194C66]">
          {title}
        </h3>
        {aside}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export default function DiscountsAdminPage() {
  const [campaigns, setCampaigns] = useState<DiscountCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form för ny / redigera
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DiscountCampaign>({
    name: "",
    description: "",
    code: "",
    trip_id: null,
    discount_type: "fixed",
    discount_value: null,
    min_quantity: null,
    start_date: null,
    end_date: null,
    active: true,
  });

  function upd<K extends keyof DiscountCampaign>(key: K, val: DiscountCampaign[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  // Ladda kampanjer
  async function loadCampaigns() {
    try {
      setLoading(true);
      setErr(null);
      const r = await fetch("/api/admin/discounts/list");
      const j: ListResponse = await r.json();
      if (!r.ok || !j.ok) {
        throw new Error(j.error || "Kunde inte läsa kampanjer.");
      }
      setCampaigns(j.campaigns || []);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Tekniskt fel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      code: "",
      trip_id: null,
      discount_type: "fixed",
      discount_value: null,
      min_quantity: null,
      start_date: null,
      end_date: null,
      active: true,
    });
  }

  function onEdit(c: DiscountCampaign) {
    setEditingId(c.id || null);
    setForm({
      name: c.name || "",
      description: c.description || "",
      code: c.code || "",
      trip_id: c.trip_id || null,
      discount_type:
        (c.discount_type as DiscountCampaign["discount_type"]) || "fixed",
      discount_value:
        c.discount_value !== null && c.discount_value !== undefined
          ? c.discount_value
          : null,
      min_quantity:
        c.min_quantity !== null && c.min_quantity !== undefined
          ? c.min_quantity
          : null,
      start_date: c.start_date || null,
      end_date: c.end_date || null,
      active: c.active ?? true,
      id: c.id,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setErr(null);
      setMsg(null);

      if (!form.name.trim()) {
        throw new Error("Ange ett namn på kampanjen.");
      }

      const payload = {
        id: editingId || undefined,
        ...form,
      };

      const r = await fetch("/api/admin/discounts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json();
      if (!r.ok || !j.ok) {
        throw new Error(j.error || "Kunde inte spara kampanjen.");
      }

      setMsg(editingId ? "Kampanjen uppdaterades." : "Ny kampanj skapad.");
      resetForm();
      loadCampaigns();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || "Tekniskt fel.");
    } finally {
      setSaving(false);
    }
  }

  const hasActive = useMemo(
    () => campaigns.some((c) => c.active),
    [campaigns]
  );

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="px-6 pb-16 pt-14 lg:pt-20">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Sidhuvud */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#194C66]/70">
                  Helsingbuss – Kampanjer
                </div>
                <h1 className="text-xl font-semibold text-[#0f172a]">
                  Kampanjer & rabatter
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Hantera erbjudanden som{" "}
                  <span className="font-semibold">"Res 2 för 549 kr"</span> och
                  liknande. Vi använder dem senare i kassan när logiken är på
                  plats.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="self-start rounded-full border border-[#194C66]/20 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#194C66] shadow-sm hover:bg-slate-50"
              >
                + Ny kampanj
              </button>
            </div>

            {/* Fel / info */}
            {err && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                {err}
              </div>
            )}
            {msg && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
                {msg}
              </div>
            )}

            {/* Form-kort */}
            <Card
              title={
                editingId ? "Redigera kampanj" : "Skapa ny kampanj / erbjudande"
              }
              aside={
                <span className="text-[12px] text-slate-500">
                  {editingId ? "ID: " + editingId : "Sparas direkt i databasen"}
                </span>
              }
            >
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Namn på kampanj</FieldLabel>
                    <input
                      className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                      placeholder='Ex. "Res 2 för 549 kr"'
                      value={form.name}
                      onChange={(e) => upd("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Kampanjkod (valfritt)</FieldLabel>
                    <input
                      className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                      placeholder="Ex. ULLARED2"
                      value={form.code || ""}
                      onChange={(e) => upd("code", e.target.value)}
                    />
                    <Help>
                      Kan användas om vi senare vill låta kunden skriva in en kod
                      i kassan.
                    </Help>
                  </div>
                </div>

                <div>
                  <FieldLabel>Beskrivning</FieldLabel>
                  <textarea
                    className="border rounded-xl px-3 py-2.5 w-full text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                    placeholder="Kort beskrivning av vad som ingår i kampanjen."
                    value={form.description || ""}
                    onChange={(e) => upd("description", e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel>Typ av rabatt</FieldLabel>
                    <select
                      className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                      value={form.discount_type}
                      onChange={(e) =>
                        upd(
                          "discount_type",
                          e.target.value as DiscountCampaign["discount_type"]
                        )
                      }
                    >
                      <option value="fixed">Fast belopp (kr)</option>
                      <option value="percent">Procent (%)</option>
                      <option value="two_for_one">
                        2-för-1 / Res 2 betala för 1
                      </option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Rabattvärde</FieldLabel>
                    <input
                      className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                      inputMode="decimal"
                      placeholder={
                        form.discount_type === "percent"
                          ? "Ex. 20 för 20%"
                          : "Ex. 100 för 100 kr"
                      }
                      value={
                        form.discount_value !== null &&
                        form.discount_value !== undefined
                          ? String(form.discount_value)
                          : ""
                      }
                      onChange={(e) =>
                        upd(
                          "discount_value",
                          e.target.value
                            ? Number(e.target.value.replace(",", "."))
                            : null
                        )
                      }
                    />
                    <Help>
                      För <b>2-för-1</b> kan vi senare använda detta värde som
                      referens, men det är valfritt.
                    </Help>
                  </div>
                  <div>
                    <FieldLabel>Minsta antal resenärer</FieldLabel>
                    <input
                      className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                      inputMode="numeric"
                      placeholder="Ex. 2"
                      value={
                        form.min_quantity !== null &&
                        form.min_quantity !== undefined
                          ? String(form.min_quantity)
                          : ""
                      }
                      onChange={(e) =>
                        upd(
                          "min_quantity",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel>Startdatum</FieldLabel>
                    <input
                      type="date"
                      className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                      value={form.start_date || ""}
                      onChange={(e) => upd("start_date", e.target.value || null)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Slutdatum</FieldLabel>
                    <input
                      type="date"
                      className="border rounded-xl px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#194C66]/30"
                      value={form.end_date || ""}
                      onChange={(e) => upd("end_date", e.target.value || null)}
                    />
                  </div>
                  <div className="flex items-center mt-6 md:mt-8">
                    <label className="inline-flex items-center gap-2 text-sm text-[#194C66]/80">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => upd("active", e.target.checked)}
                      />
                      <span>Aktiv kampanj</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 rounded-full border border-slate-300 bg-white text-xs sm:text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Avbryt redigering
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-full bg-[#194C66] text-white text-xs sm:text-sm font-semibold shadow-sm disabled:opacity-60"
                  >
                    {saving
                      ? "Sparar…"
                      : editingId
                      ? "Spara ändringar"
                      : "Skapa kampanj"}
                  </button>
                </div>
              </form>
            </Card>

            {/* Lista med kampanjer */}
            <Card
              title="Befintliga kampanjer"
              aside={
                <span className="text-[12px] text-slate-500">
                  {loading
                    ? "Laddar…"
                    : campaigns.length === 0
                    ? "Inga kampanjer ännu"
                    : `${campaigns.length} kampanj${
                        campaigns.length > 1 ? "er" : ""
                      }${hasActive ? " • minst en aktiv" : ""}`}
                </span>
              }
            >
              {loading ? (
                <div className="text-sm text-slate-500">
                  Hämtar kampanjer…
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-sm text-slate-500">
                  Du har inte lagt in några kampanjer ännu. Skapa din första
                  ovanför.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                        <th className="py-2 pr-3">Namn</th>
                        <th className="py-2 px-3">Typ</th>
                        <th className="py-2 px-3">Giltig</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 pl-3 text-right">Åtgärd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c) => {
                        const range =
                          (c.start_date || c.end_date) &&
                          `${c.start_date || "–"} → ${c.end_date || "–"}`;
                        const typeLabel =
                          c.discount_type === "percent"
                            ? "Procent"
                            : c.discount_type === "two_for_one"
                            ? "2-för-1"
                            : "Fast belopp";

                        return (
                          <tr
                            key={c.id}
                            className="border-b last:border-0 border-slate-100"
                          >
                            <td className="py-2 pr-3 align-top">
                              <div className="font-medium text-[#0f172a]">
                                {c.name}
                              </div>
                              {c.description && (
                                <div className="text-xs text-slate-600 line-clamp-2">
                                  {c.description}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 align-top">
                              <div className="text-xs inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                                {typeLabel}
                              </div>
                            </td>
                            <td className="py-2 px-3 align-top text-xs text-slate-600">
                              {range || "–"}
                            </td>
                            <td className="py-2 px-3 align-top">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  c.active
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : "bg-slate-50 text-slate-500 border border-slate-100"
                                }`}
                              >
                                {c.active ? "Aktiv" : "Inaktiv"}
                              </span>
                            </td>
                            <td className="py-2 pl-3 align-top text-right">
                              <button
                                type="button"
                                onClick={() => onEdit(c)}
                                className="text-xs rounded-full border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50"
                              >
                                Redigera
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
