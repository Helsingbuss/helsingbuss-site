// src/pages/admin/orders/index.tsx
import { useEffect, useMemo, useState } from "react";
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

export default function OrdersList() {
  const router = useRouter();

  // scope från URL (all | upcoming)
  const scopeFromUrl = (router.query.scope as string) || "all";
  const [scope, setScope] = useState<"all" | "upcoming">(
    scopeFromUrl === "upcoming" ? "upcoming" : "all"
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // spegla scope i URL så länken kan sparas
  useEffect(() => {
    const q = new URLSearchParams(router.query as any);
    q.set("scope", scope);
    router.replace({ pathname: router.pathname, query: Object.fromEntries(q) }, undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  async function fetchWithFallback(urlPrimary: string, urlFallback: string) {
    let r = await fetch(urlPrimary);
    if (!r.ok) {
      try { r = await fetch(urlFallback); } catch {}
    }
    return r;
  }

  async function load() {
    setLoading(true);
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

      const r = await fetchWithFallback(urlA, urlB);
      const j = await r.json().catch(() => ({} as any));

      setRows(j?.rows ?? []);
      setTotal(j?.total ?? 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [scope, status, page, pageSize]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  async function resend(id: string) {
    const ok = confirm("Skicka om körorder till chaufför?");
    if (!ok) return;
    const r = await fetch(`/api/driver-orders/${id}/resend`, { method: "POST" });
    if (!r.ok) alert("Kunde inte skicka om.");
    else alert("Utskicket gjordes.");
  }

  const prioColor = (out_date?: string | null, out_time?: string | null) => {
    if (!out_date) return "";
    const d = new Date(out_date + "T" + (out_time || "00:00"));
    const diffH = (d.getTime() - Date.now()) / (1000 * 60 * 60);
    if (diffH <= 48) return "text-red-600";      // Besvara direkt
    if (diffH <= 120) return "text-orange-500";  // Börjar närma sig
    return "text-green-600";                     // Gott om tid
  };

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#194C66]">Alla körordrar</h1>
            <a href="/admin/orders/new" className="px-4 py-2 rounded-[25px] bg-[#194C66] text-white text-sm">
              Skapa körorder
            </a>
          </div>

          {/* Snabbfilter: Alla / Kommande */}
          <div className="bg-white rounded-xl shadow p-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl bg-[#f8fafc] p-1">
              {(["all","upcoming"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { setPage(1); setScope(s); }}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    scope === s ? "bg-[#194C66] text-white" : "text-[#194C66]"
                  }`}
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
            />
            <select
              className="border rounded px-3 py-2"
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
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
              onChange={e => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={1000}>Alla</option>
            </select>
          </div>

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
                  {loading && (
                    <tr><td colSpan={7} className="py-4">Laddar…</td></tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr><td colSpan={7} className="py-4">Inga körordrar</td></tr>
                  )}
                  {!loading && rows.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-3">
                        <div className="font-semibold">{r.order_number ?? "—"}</div>
                        <div className={`text-xs ${prioColor(r.out_date, r.out_time)}`}>
                          {r.out_date ?? "—"} {r.out_time ?? ""}
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
                      <td className="py-2 pr-3">{r.status ?? "—"}</td>
                      <td className="py-2 pr-3 space-x-2">
                        <a className="underline" href={`/driver-order/${r.id}`} target="_blank" rel="noreferrer">Öppna</a>
                        <button className="underline" onClick={() => resend(r.id)}>Skicka om</button>
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
                >
                  Föregående
                </button>
                <div className="text-sm">Sida {page} / {totalPages}</div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 border rounded disabled:opacity-50"
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
