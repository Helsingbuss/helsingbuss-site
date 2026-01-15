// src/pages/admin/bookings/calender.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";

type BookingCalendarItem = {
  id: string;
  booking_number: string | null;
  status: string | null;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  title: string;
  email: string | null;
  total_price: number | null;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthFromDate(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${pad2(m)}`;
}

function addMonths(ym: string, delta: number) {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const dt = new Date(y, m - 1 + delta, 1);
  return monthFromDate(dt);
}

function tidyTime(t?: string | null) {
  if (!t) return null;
  const s = String(t);
  if (s.includes(":")) return s.slice(0, 5);
  if (s.length >= 4) return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
  return null;
}

function formatSEK(v?: number | null) {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isCancelled(status?: string | null) {
  const s = String(status || "").toLowerCase();
  return (
    s.includes("instäl") ||
    s.includes("instal") ||
    s.includes("makuler") ||
    s.includes("cancel") ||
    s.includes("avbok")
  );
}

function ymd(d: Date) {
  const yy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  return `${yy}-${mm}-${dd}`;
}

function buildCalendarGrid(month: string) {
  // 42 rutor (6 veckor), vecka börjar på MÅN
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);

  const first = new Date(Date.UTC(y, m - 1, 1));
  const weekdayMon0 = (first.getUTCDay() + 6) % 7; // mån=0..sön=6
  const start = new Date(first);
  start.setUTCDate(1 - weekdayMon0);

  const cells: { date: Date; ymd: string; inMonth: boolean; day: number }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    cells.push({
      date: d,
      ymd: ymd(d),
      inMonth: d.getUTCMonth() === (m - 1),
      day: d.getUTCDate(),
    });
  }
  return cells;
}

function monthLabelSv(month: string) {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  return new Intl.DateTimeFormat("sv-SE", { month: "long", year: "numeric" }).format(dt);
}

export default function BookingsCalenderPage() {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  const [month, setMonth] = useState<string>(() => monthFromDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BookingCalendarItem[]>([]);

  // Läs query ?month=YYYY-MM
  useEffect(() => {
    if (!router.isReady) return;
    const qMonth = typeof router.query.month === "string" ? router.query.month : "";
    if (/^\d{4}-\d{2}$/.test(qMonth)) setMonth(qMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Synka state -> URL (shallow)
  useEffect(() => {
    if (!router.isReady) return;
    router.replace(
      { pathname: router.pathname, query: { month } },
      undefined,
      { shallow: true }
    );
  }, [month, router]);

  async function load(m: string) {
    setLoading(true);
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`/api/bookings/calender?month=${encodeURIComponent(m)}`, {
        signal: ctrl.signal,
      });
      const j = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      const arr = Array.isArray(j?.items) ? (j.items as BookingCalendarItem[]) : [];
      const norm = arr.map((x) => ({ ...x, time: tidyTime(x.time) }));
      setItems(norm);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message || "Kunde inte hämta bokningar.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(month);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const itemsByDate = useMemo(() => {
    const obj: Record<string, BookingCalendarItem[]> = {};

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const k = it.date;
      if (!obj[k]) obj[k] = [];
      obj[k].push(it);
    }

    // Sort per dag: ej inställd först, inställd sist + tid
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      obj[k].sort((a, b) => {
        const ac = isCancelled(a.status) ? 1 : 0;
        const bc = isCancelled(b.status) ? 1 : 0;
        if (ac !== bc) return ac - bc;

        const at = a.time || "99:99";
        const bt = b.time || "99:99";
        if (at !== bt) return at.localeCompare(bt);

        return (a.title || "").localeCompare(b.title || "");
      });
    }

    return obj;
  }, [items]);

  const grid = useMemo(() => buildCalendarGrid(month), [month]);
  const weekdays = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />

        {/* Luft så knappar inte hamnar under topbar */}
        <main className="p-6 pt-16 space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-[#194C66]">Bokningskalender</h1>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setMonth((m) => addMonths(m, -1))}
                className="px-4 py-2 rounded-[25px] border text-sm text-[#194C66] bg-white"
              >
                ← Föregående
              </button>

              <div className="bg-white border rounded-[25px] px-4 py-2 text-sm text-[#194C66]">
                {monthLabelSv(month)}
              </div>

              <button
                onClick={() => setMonth((m) => addMonths(m, 1))}
                className="px-4 py-2 rounded-[25px] border text-sm text-[#194C66] bg-white"
              >
                Nästa →
              </button>

              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border rounded-[25px] px-4 py-2 text-sm bg-white text-[#194C66]"
                aria-label="Välj månad"
              />

              <Link
                href="/admin/bookings"
                className="px-4 py-2 rounded-[25px] border text-sm text-[#194C66] bg-white"
              >
                Alla bokningar
              </Link>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
              Fel: {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="grid grid-cols-7 border-b bg-[#e5eef3] text-[#194C66] text-xs font-semibold">
              {weekdays.map((w) => (
                <div key={w} className="px-3 py-2">
                  {w}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="p-6 text-sm text-[#194C66]/70">Laddar kalender…</div>
            ) : (
              <div className="grid grid-cols-7">
                {grid.map((cell) => {
                  const dayItems = itemsByDate[cell.ymd] || [];
                  const more = dayItems.length > 4 ? dayItems.length - 4 : 0;
                  const show = dayItems.slice(0, 4);

                  return (
                    <div
                      key={cell.ymd}
                      className={`min-h-[140px] border-b border-r p-2 ${
                        cell.inMonth ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`text-xs font-semibold ${
                            cell.inMonth ? "text-[#194C66]" : "text-[#194C66]/40"
                          }`}
                        >
                          {cell.day}
                        </div>
                        <div className="text-[10px] text-[#194C66]/50">{cell.ymd}</div>
                      </div>

                      <div className="space-y-1">
                        {show.map((it) => {
                          const cancelled = isCancelled(it.status);
                          const line = cancelled ? "line-through" : "";

                          return (
                            <Link
                              key={it.id}
                              href={`/admin/bookings/${encodeURIComponent(it.id)}`}
                              className={`block rounded-lg border px-2 py-1 text-xs hover:bg-gray-50 ${
                                cancelled ? "opacity-60" : ""
                              }`}
                              title={`${it.booking_number || "Bokning"} • ${it.email || ""}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[10px] text-[#194C66] bg-white">
                                    {it.time || "—"}
                                  </span>
                                  <span className={`truncate text-[#194C66] ${line}`}>
                                    {it.title || it.booking_number || "Bokning"}
                                  </span>
                                </div>

                                <span className={`text-[10px] text-[#194C66]/70 whitespace-nowrap ${line}`}>
                                  {it.total_price != null ? `${formatSEK(it.total_price)} kr` : ""}
                                </span>
                              </div>

                              <div className="mt-0.5 text-[10px] text-[#194C66]/60 flex items-center justify-between">
                                <span className={line}>{it.booking_number || ""}</span>
                                <span className={line}>{it.status || ""}</span>
                              </div>
                            </Link>
                          );
                        })}

                        {more > 0 && (
                          <div className="text-[11px] text-[#194C66]/70 px-1">+{more} fler…</div>
                        )}

                        {dayItems.length === 0 && (
                          <div className="text-[11px] text-[#194C66]/35 px-1">Inga bokningar</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-xs text-[#194C66]/70">
            Inställda/makulerade bokningar visas <span className="line-through">överstrukna</span> och hamnar sist per dag.
          </div>
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
