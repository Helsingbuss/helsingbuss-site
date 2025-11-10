// src/pages/admin/orders/index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";

type Row = {
  id: string;
  order_number: string | null;
  status: string | null;
  driver_name: string | null;
  driver_email: string | null;
  vehicle_reg: string | null;
  out_from: string | null;
  out_to: string | null;
  out_date: string | null;
  out_time: string | null;
  passengers: number | null;
  created_at: string | null;
};

function tidyTime(hhmm?: string | null) {
  if (!hhmm) return "";
  const s = String(hhmm).slice(0, 5);
  // Hantera "8:0" -> "08:00"
  const [h = "00", m = "00"] = s.split(":");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(`${d}T00:00:00`);
  return isNaN(dt.getTime())
    ? d!
    : new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(dt);
}
function fmtTime(t?: string | null) {
  const hhmm = tidyTime(t);
  if (!hhmm) return "";
  const dt = new Date(`1970-01-01T${hhmm}:00`);
  return isNaN(dt.getTime())
    ? hhmm
    : new Intl.DateTimeFormat("sv-SE", { timeStyle: "short" }).format(dt);
}

function clsStatusPill(s?: string | null) {
  const v = (s || "").toLowerCase();
  if (v === "draft") return "bg-slate-100 text-slate-800";
  if (v === "sent") return "bg-blue-100 text-blue-800";
  if (v === "ack" || v === "confirmed" || v === "bekraftad" || v === "bekräftad")
    return "bg-emerald-100 text-emerald-800";
  if (v === "done" || v === "klar") return "bg-green-100 text-green-800";
  if (v === "cancelled" || v === "canceled" || v === "avbokad" || v === "inställd" || v === "installt")
    return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-700";
}

export default function OrdersList() {
  const router = useRouter();

  // scope från URL (all | upcoming)
  const scopeFromUrl = (router.query.scope as string) || "all";
  const [scope, setScope] = useState<"all" | "upcoming">(
    scopeFromUrl === "upcoming" ? "upcoming" : "all"
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<string>((router.query.status as string) || "");
  const [search, setSearch] = useState<string>((router.query.search as string) || "");
  const [page, setPage] = useState<number>(() => {
    const p = Number(router.query.page);
    return Number.isFinite(p) && p > 0 ? p : 1;
  });
  const [pageSize, setPageSize] = useState<number>(() => {
    const ps = router.query.pageSize === "all" ? 1000 : Number(router.query.pageSize);
    return Number.isFinite(ps) && ps > 0 ? ps : 10;
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // abort controllers
  const listAbortRef = useRef<AbortController | null>(null);
  const searchDebounceRef = useRef<number | null>(null);

  // spegla alla filter i URL (shallow)
  useEffect(() => {
    const q = new URLSearchParams();
    q.set("scope", scope);
    if (status) q.set("status", status);
    if (search) q.set("search", search);
    q.set("page", String(page));
    q.set("pageSize", pageSize >= 1000 ? "all" : String(pageSize));
    router.replace(
      { pathname: router.pathname, query: Object.fromEntries(q.entries()) },
      undefined,
      { shallow: true }
    );
  }, [scope, status, search, page, pageSize, router]);

  async function fetchWithFallback(urlPrimary: string, urlFallback: string, signal?: AbortSignal) {
    let r = await fetch(urlPrimary, { signal });
    if (!r.ok) {
      try { r = await fetch(urlFallback, { signal }); } catch { /* ignore */ }
    }
    return r;
  }

  async function load() {
    setLoading(true);
    setError(null);

    if (listAbortRef.current) listAbortRef.current.abort();
    const ctrl = new AbortController();
    listAbortRef.current = ctrl;

    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        scope,
      });
      if (status) qs.set("status", status);
      if (search) qs.set("search", search);

      // Primärt nya endpointen, fallback till gamla namnet om den saknas
      const urlA = `/api/orders/list?${qs.toString()}`;
      const urlB = `/api/driver-orders/list?${qs.toString()}`;

      const r = await fetchWithFallback(urlA, urlB, ctrl.signal);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json().catch(() => ({} as any));

      setRows(j?.rows ?? []);
      setTotal(j?.total ?? 0);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setRows([]);
      setTotal(0);
      setError(e?.message || "Kunde inte hämta körordrar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, status, page, pageSize]);

  // debounced search -> laddar om när användaren pausar skrivandet
  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = window.setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const [resendingId, setResendingId] = useState<string | null>(null);
  async function resend(id: string) {
    const ok = confirm("Skicka om körorder till chaufför?");
    if (!ok) return;
    setResendingId(id);
    try {
      const r = await fetch(`/api/driver-orders/${id}/resend`, { method: "POST" });
      if (!r.ok) alert("Kunde inte skicka om.");
      else alert("Utskicket gjordes.");
    } catch {
      alert("Nätverksfel vid utskick.");
    } finally {
      setResendingId(null);
    }
  }

  const prioColor = (out_date?: string | null, out_time?: string | null) => {
    if (!out_date) return "";
    const d = new Date(out_date + "T" + tidyTime(out_time));
    const diffH = (d.getTime() - Date.now()) / 36e5;
    if (diffH <= 48) return "text-red-600";      // Besvara direkt
    if (diffH <= 120) return "text-orange-500";  // Börjar närma sig
    return "text-green-600";                     // Gott om tid
  };

  const skeletonRows = Array.from({ length: Math.min(pageSize || 10, 10) }).map((_, i) => (
    <tr key={`sk-${i}`} className="border-t animate-pulse">
      {Array.from({ length: 7 }).map((__, j) => (
        <td key={j} className="py-2 pr-3">
          <div className="h-3 bg-gray-200 rounded w-24" />
        </td>
      ))}
    </tr>
  ));

  useEffect(() => {
    // städa abortcontroller på unmount
    return () => {
      if (listAbortRef.current) listAbortRef.current.abort();
    };
  }, []);

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#194C66]">Alla körordrar</h1>
            <a
              href="/admin/orders/new"
              className="px-4 py-2 rounded-[25px] bg-[#194C66] text-white text-sm"
            >
              Skapa körorder
            </a>
          </div>

          {/* Snabbfilter: Alla / Kommande */}
          <div className="bg-white rounded-xl shadow p-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl bg-[#f8fafc] p-1" role="tablist" aria-label="Snabbfilter">
              {(["all","upcoming"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { setPage(1); setScope(s); }}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    scope === s ? "bg-[#194C66] text-white" : "text-[#194C66]"
                  }`}
                  role="tab"
                  aria-selected={scope === s}
                  aria-controls={`panel-${s}`}
                >
                  {s === "all" ? "Alla" : "Kommande"}
                </button>
              ))}
            </div>

            <input
              className="border rounded px-3 py-2"
              placeholder="Sök (nummer, chaufför, ort)…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); load(); } }}
              aria-label="Sök i körordrar"
            />
            <select
              className="border rounded px-3 py-2"
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              aria-label="Filtrera på status"
            >
              <option value="">Alla status</option>
              <option value="draft">Utkast</option>
              <option value="sent">Skickad</option>
              <option value="ack">Bekräftad</option>
              <option value="done">Klar</option>
            </select>
            <select
              className="border rounded px-3 py-2"
              value={pageSize}
              onChange={e => { setPageSize(parseInt(e.target.value, 10) || 10); setPage(1); }}
              aria-label="Antal poster per sida"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={1000}>Alla</option>
            </select>
          </div>

          {/* Prio-legend */}
          <div className="text-xs text-[#194C66]/70">
            <span className="inline-flex items-center gap-1 mr-3">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" /> Grön = &gt; 120 h
            </span>
            <span className="inline-flex items-center gap-1 mr-3">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> Orange = ≤ 120 h
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> Röd = ≤ 48 h
            </span>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-4">
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[#194C66]/70">
                    <th className="py-2 pr-3">Körorder</th>
                    <th className="py-2 pr-3">Utresa</th>
                    <th className="py-2 pr-3">Chaufför</th>
                    <th className="py-2 pr-3">Fordon</th>
                    <th className="py-2 pr-3">PAX</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody className="text-[#194C66]">
                  {loading && skeletonRows}
                  {!loading && rows.length === 0 && (
                    <tr><td colSpan={7} className="py-4">Inga körordrar</td></tr>
                  )}
                  {!loading && rows.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-3">
                        <div className="font-semibold">{r.order_number ?? "—"}</div>
                        <div className={`text-xs ${prioColor(r.out_date, r.out_time)}`}>
                          {fmtDate(r.out_date)} {fmtTime(r.out_time)}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div>{r.out_from ?? "—"} → {r.out_to ?? "—"}</div>
                      </td>
                      <td className="py-2 pr-3">
                        <div>{r.driver_name ?? "—"}</div>
                        <div className="text-xs text-[#194C66]/70">{r.driver_email ?? ""}</div>
                      </td>
                      <td className="py-2 pr-3">{r.vehicle_reg ?? "—"}</td>
                      <td className="py-2 pr-3">{r.passengers ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${clsStatusPill(r.status)}`}>
                          {r.status ?? "—"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 space-x-2">
                        <a
                          className="underline"
                          href={`/driver-order/${r.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Öppna
                        </a>
                        <button
                          className="underline disabled:opacity-50"
                          onClick={() => resend(r.id)}
                          disabled={resendingId === r.id}
                          aria-label={`Skicka om körorder ${r.order_number ?? ""} till chaufför`}
                        >
                          {resendingId === r.id ? "Skickar…" : "Skicka om"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {total > pageSize && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  aria-label="Föregående sida"
                >
                  Föregående
                </button>
                <div className="text-sm">Sida {page} / {totalPages}</div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  aria-label="Nästa sida"
                >
                  Nästa
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
