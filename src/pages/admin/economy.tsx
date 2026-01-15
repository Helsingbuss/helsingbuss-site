// src/pages/admin/economy.tsx
import { useEffect, useMemo, useState } from "react";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type EconomyMonth = {
  month: string; // YYYY-MM

  done_count: number;
  done_gross: number;
  done_vat: number;
  done_net: number;

  forecast_count: number;
  forecast_gross: number;
  forecast_vat: number;
  forecast_net: number;

  commission_done: number;
  commission_forecast: number;
};

type EconomyPayload = {
  from: string;
  to: string;
  includeVat: boolean;
  vatRate: number;
  months: EconomyMonth[];
  totals: {
    done_count: number;
    done_gross: number;
    done_vat: number;
    done_net: number;

    forecast_count: number;
    forecast_gross: number;
    forecast_vat: number;
    forecast_net: number;

    commission_done: number;
    commission_forecast: number;
  };
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatSEK(n: any) {
  const v = Number(n ?? 0);
  const safe = Number.isFinite(v) ? v : 0;
  return safe.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isQuarterStart(month: string) {
  // month = YYYY-MM
  const mm = Number(month.slice(5, 7));
  return mm === 1 || mm === 4 || mm === 7 || mm === 10;
}

function quarterKey(month: string) {
  const y = month.slice(0, 4);
  const m = Number(month.slice(5, 7));
  const q = m <= 3 ? 1 : m <= 6 ? 2 : m <= 9 ? 3 : 4;
  return `${y}-Q${q}`;
}

function yearsFromMonths(months: string[]) {
  const ys = new Set<string>();
  for (const m of months) ys.add(m.slice(0, 4));
  return Array.from(ys).sort();
}

const BUDGET_STORAGE_KEY = "hb_economy_budget_quarters_v1";

type BudgetMap = Record<string, number>; // "2025-Q1" -> amount

function loadBudgetMap(): BudgetMap {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: BudgetMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      const n = Number(v);
      out[String(k)] = Number.isFinite(n) ? n : 0;
    }
    return out;
  } catch {
    return {};
  }
}

function saveBudgetMap(map: BudgetMap) {
  try {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export default function EconomyPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<EconomyPayload | null>(null);

  // Default: från 2025 och framåt (så du slipper välja)
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState(() => ymd(new Date()));
  const [includeVat, setIncludeVat] = useState(true);
  const [vatRate, setVatRate] = useState(0.06);

  const [budgetMap, setBudgetMap] = useState<BudgetMap>({});
  const [showBudgetEditor, setShowBudgetEditor] = useState(true);

  useEffect(() => {
    // localStorage finns bara i browsern
    setBudgetMap(loadBudgetMap());
  }, []);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const qs = new URLSearchParams();
      qs.set("from", from);
      qs.set("to", to);
      qs.set("includeVat", includeVat ? "1" : "0");
      qs.set("vatRate", String(vatRate));

      const r = await fetch(`/api/economy/series?${qs.toString()}`);
      const j = await r.json().catch(() => ({} as any));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setData(j as EconomyPayload);
    } catch (e: any) {
      setData(null);
      setErr(e?.message || "Kunde inte hämta ekonomi.");
    } finally {
      setLoading(false);
    }
  }

  // Ladda direkt när sidan öppnas (utan att du behöver välja)
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartRows = useMemo(() => {
    const months = data?.months ?? [];
    return months.map((m) => {
      const qk = quarterKey(m.month);
      const budgetQ = Number(budgetMap[qk] ?? 0);
      // Visa budget som “stapel var tredje månad” (på kvartalets första månad), annars 0
      const budget = isQuarterStart(m.month) ? budgetQ : 0;

      return {
        month: m.month,
        done: m.done_gross,
        forecast: m.forecast_gross,
        budget,
      };
    });
  }, [data?.months, budgetMap]);

  const monthLabels = useMemo(() => (data?.months ?? []).map((m) => m.month), [data?.months]);
  const years = useMemo(() => yearsFromMonths(monthLabels), [monthLabels]);

  function updateBudget(qKey: string, value: string) {
    const n = Number(value);
    const v = Number.isFinite(n) ? n : 0;
    const next = { ...budgetMap, [qKey]: v };
    setBudgetMap(next);
    saveBudgetMap(next);
  }

  // Passagerar-cirkel (placeholder just nu – vi kopplar in när API:t räknar passengers)
  const passengersPie = useMemo(() => {
    // när vi lägger till passengers i API:t byter vi detta till riktiga siffror
    const totalPassengers = 0;
    return [
      { name: "Passagerare", value: totalPassengers },
      { name: "—", value: Math.max(1, totalPassengers === 0 ? 1 : 0) }, // så cirkeln inte blir tom
    ];
  }, []);

  const totals = data?.totals;

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />

        {/* FIX: Header/topbar är fixed -> ge main rejäl top-padding så knapparna inte hamnar under */}
        <main className="px-6 pb-6 pt-24 space-y-6">
          {/* Top controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-[#194C66]">Ekonomi</h1>
              <div className="text-xs text-[#194C66]/60">
                Period: {from} – {to}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs text-[#194C66]/70">
                Från
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="ml-2 border rounded px-2 py-1 text-sm"
                />
              </label>

              <label className="text-xs text-[#194C66]/70">
                Till
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="ml-2 border rounded px-2 py-1 text-sm"
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-[#194C66]/70 border rounded px-3 py-2 bg-white">
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                />
                Inkl moms
              </label>

              <label className="text-xs text-[#194C66]/70 border rounded px-3 py-2 bg-white">
                Moms %
                <input
                  inputMode="decimal"
                  value={String(Math.round(vatRate * 10000) / 100)}
                  onChange={(e) => {
                    const n = Number(String(e.target.value).replace(",", "."));
                    const r = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) / 100 : 0.06;
                    setVatRate(r);
                  }}
                  className="ml-2 w-[70px] outline-none"
                />
              </label>

              <button
                onClick={load}
                className="px-4 py-2 rounded-[25px] bg-[#194C66] text-white text-sm"
              >
                Uppdatera
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow p-4 space-y-6">
            {loading && <div className="text-[#194C66]/70">Laddar…</div>}

            {!loading && err && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
                Fel: {err}
              </div>
            )}

            {!loading && !err && data && totals && (
              <>
                {/* KPI cards */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-xs text-[#194C66]/70">Genomförda bokningar</div>
                    <div className="text-lg font-semibold text-[#194C66]">{formatSEK(totals.done_gross)} kr</div>
                    <div className="text-xs text-[#194C66]/60">{totals.done_count} st</div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-xs text-[#194C66]/70">Prognos (godkända offerter)</div>
                    <div className="text-lg font-semibold text-[#194C66]">{formatSEK(totals.forecast_gross)} kr</div>
                    <div className="text-xs text-[#194C66]/60">{totals.forecast_count} st</div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-xs text-[#194C66]/70">Moms (genomförda)</div>
                    <div className="text-lg font-semibold text-[#194C66]">{formatSEK(totals.done_vat)} kr</div>
                    <div className="text-xs text-[#194C66]/60">Netto: {formatSEK(totals.done_net)} kr</div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-xs text-[#194C66]/70">Synergybus provision (prognos)</div>
                    <div className="text-lg font-semibold text-[#194C66]">{formatSEK(totals.commission_forecast)} kr</div>
                    <div className="text-xs text-[#194C66]/60">På godkända offerter</div>
                  </div>
                </section>

                {/* Main bar chart */}
                <section className="bg-white rounded-xl border p-4">
                  <div className="mb-2">
                    <div className="font-semibold text-[#194C66]">Intäkter & prognos per månad</div>
                    <div className="text-xs text-[#194C66]/60">Period: {data.from} – {data.to}</div>
                  </div>

                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartRows}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: any) => [`${formatSEK(value)} kr`, ""]}
                        />
                        <Legend />
                        <Bar dataKey="done" name="Genomförda bokningar" />
                        <Bar dataKey="forecast" name="Prognos (godkända offerter)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Budget bars (var tredje månad) */}
                <section className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                    <div>
                      <div className="font-semibold text-[#194C66]">Budget (kvartal)</div>
                      <div className="text-xs text-[#194C66]/60">
                        Visas som stapel på kvartalets första månad (Jan/Apr/Jul/Okt).
                      </div>
                    </div>

                    <button
                      onClick={() => setShowBudgetEditor((v) => !v)}
                      className="px-4 py-2 rounded-[25px] border text-sm text-[#194C66]"
                    >
                      {showBudgetEditor ? "Dölj budgetfält" : "Visa budgetfält"}
                    </button>
                  </div>

                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartRows}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`${formatSEK(value)} kr`, "Budget"]} />
                        <Legend />
                        <Bar dataKey="budget" name="Budget (kvartal)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {showBudgetEditor && (
                    <div className="mt-4 space-y-4">
                      {years.map((y) => (
                        <div key={y} className="bg-[#f8fafc] rounded-lg p-4">
                          <div className="font-semibold text-[#194C66] mb-3">{y}</div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            {([1, 2, 3, 4] as const).map((q) => {
                              const key = `${y}-Q${q}`;
                              return (
                                <label key={key} className="block">
                                  <div className="text-xs text-[#194C66]/70 mb-1">{key}</div>
                                  <input
                                    className="w-full border rounded px-3 py-2"
                                    value={String(budgetMap[key] ?? "")}
                                    onChange={(e) => updateBudget(key, e.target.value)}
                                    placeholder="t.ex 150000"
                                  />
                                </label>
                              );
                            })}
                          </div>
                          <div className="text-xs text-[#194C66]/60 mt-2">
                            (Sparas automatiskt i din webbläsare.)
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Passagerare (cirkel) – rekommenderas, men kräver att vi räknar passengers i API:t */}
                <section className="bg-white rounded-xl border p-4">
                  <div className="font-semibold text-[#194C66] mb-1">Passagerare (genomförda)</div>
                  <div className="text-xs text-[#194C66]/60 mb-3">
                    Ja – en cirkel här är bra. Nästa steg: vi lägger till passengers-summering i economy-API:t.
                  </div>

                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={passengersPie}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                        >
                          {passengersPie.map((_, idx) => (
                            <Cell key={idx} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="text-sm text-[#194C66]/70">
                    Totalt: 0 (placeholder tills vi kopplar passengers)
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// undvik static export problem för dynamisk admin-sida
export async function getServerSideProps() {
  return { props: {} };
}
