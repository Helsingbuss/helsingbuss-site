import { useEffect, useMemo, useState } from "react";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";
import Link from "next/link";

type OfferListRow = {
  id: string;
  offer_number: string | null;
  status: string | null;
  customer_reference: string | null;
  contact_email: string | null;
  created_at: string | null;
  out: { from: string | null; to: string | null; date: string | null; time: string | null } | null;
  ret: { from: string | null; to: string | null; date: string | null; time: string | null } | null;
  passengers?: number | null; // <-- NYTT
};

// Prio-trösklar
const RED_HOURS = 48;      // < 48h = Röd
const ORANGE_HOURS = 168;  // 48–168h (7 dygn) = Orange

function clsStatusPill(s?: string | null) {
  const v = (s || "").toLowerCase();
  if (v === "godkand") return "bg-green-100 text-green-800";
  if (v === "besvarad") return "bg-blue-100 text-blue-800";
  if (v === "makulerad" || v === "avböjt" || v === "avbojt") return "bg-red-100 text-red-800";
  if (v === "inkommen") return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-700";
}

function prioForRow(r: OfferListRow) {
  const d = r.out?.date || null; // utresa styr prion
  if (!d) return { label: "—", cls: "bg-gray-200 text-gray-700", title: "Saknar avresedatum" };
  const t = r.out?.time || "00:00";
  const target = new Date(`${d}T${t.length === 5 ? t : "00:00"}`);
  const diffH = (target.getTime() - Date.now()) / 36e5;
  if (diffH < RED_HOURS) return { label: "Röd", cls: "bg-red-100 text-red-800", title: "< 48h kvar" };
  if (diffH < ORANGE_HOURS) return { label: "Orange", cls: "bg-amber-100 text-amber-800", title: "48h–7 dygn kvar" };
  return { label: "Grön", cls: "bg-green-100 text-green-800", title: "> 7 dygn kvar" };
}

export default function AdminOffersIndex() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<OfferListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10); // default 10

  // filter
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize || 10));
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      const res = await fetch(`/api/offers/list?${params.toString()}`);
      const j = await res.json();
      setRows(j.rows ?? []);
      setTotal(j.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, pageSize]);

  const totalPages = useMemo(() => {
    if (!total) return 1;
    const ps = pageSize || 10;
    return Math.max(1, Math.ceil(total / ps));
  }, [total, pageSize]);

  function changePageSize(val: string) {
    if (val === "all") { setPageSize(9999); setPage(1); }
    else { setPageSize(parseInt(val, 10) || 10); setPage(1); }
  }

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#194C66]">Alla offerter</h1>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-3 md:grid md:grid-cols-4 md:items-end md:gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-[#194C66]/80 mb-1">Sök</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
                className="w-full border rounded px-3 py-2"
                placeholder="Offert-ID, kund, e-post, ort…"
              />
            </div>
            <div>
              <label className="block text-sm text-[#194C66]/80 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="">Alla</option>
                <option value="inkommen">Inkomna</option>
                <option value="besvarad">Besvarade (prissatta)</option>
                <option value="godkand">Godkända</option>
                <option value="makulerad">Makulerade/avböjda</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setPage(1); load(); }} className="px-4 py-2 rounded-[25px] bg-[#194C66] text-white text-sm">
                Sök
              </button>
            </div>
          </div>

          {/* Prio-legend */}
          <div className="text-xs text-[#194C66]/70">
            <span className="inline-flex items-center gap-1 mr-3">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" /> Grön = &gt; 7 dygn
            </span>
            <span className="inline-flex items-center gap-1 mr-3">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> Orange = 48h–7 dygn
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> Röd = &lt; 48h
            </span>
          </div>

          {/* Tabell */}
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#e5eef3] text-[#194C66]">
                <tr>
                  <th className="text-left px-3 py-2">Offert-ID</th>
                  <th className="text-left px-3 py-2">Kund</th>
                  <th className="text-left px-3 py-2">E-post</th>
                  <th className="text-left px-3 py-2">Passagerare</th>{/* NYTT */}
                  <th className="text-left px-3 py-2">Utresa</th>
                  <th className="text-left px-3 py-2">Avresa</th>
                  <th className="text-left px-3 py-2">Retur</th>
                  <th className="text-left px-3 py-2">Returdatum</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Prio</th>
                  <th className="text-right px-3 py-2">Åtgärd</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pr = prioForRow(r);
                  return (
                    <tr key={r.id} className="border-b">
                      <td className="px-3 py-2">{r.offer_number ?? "—"}</td>
                      <td className="px-3 py-2">{r.customer_reference ?? "—"}</td>
                      <td className="px-3 py-2">{r.contact_email ?? "—"}</td>
                      <td className="px-3 py-2">{r.passengers ?? "—"}</td> {/* NYTT */}
                      <td className="px-3 py-2">
                        {r.out ? `${r.out.from ?? "—"} → ${r.out.to ?? "—"}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {r.out ? `${r.out.date ?? "—"} ${r.out.time ?? ""}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {r.ret ? `${r.ret.from ?? "—"} → ${r.ret.to ?? "—"}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {r.ret ? `${r.ret.date ?? "—"} ${r.ret.time ?? ""}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${clsStatusPill(r.status)}`}>
                          {r.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span title={pr.title} className={`px-2 py-1 rounded-full text-xs ${pr.cls}`}>
                          {pr.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link className="text-[#194C66] underline" href={`/admin/offers/${r.id}`}>
                          Öppna
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-[#194C66]/60" colSpan={11}>
                      Inga offerter hittades.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: Visa-väljare + Pagination */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#194C66]/70">Visa:</span>
              <select
                className="border rounded px-2 py-1"
                value={pageSize >= 9999 ? "all" : String(pageSize)}
                onChange={(e) => changePageSize(e.target.value)}
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="all">Alla</option>
              </select>
              <span className="text-[#194C66]/60">poster</span>
            </div>

            <div className="flex items-center justify-between md:justify-end w-full md:w-auto">
              <div className="text-sm text-[#194C66]/70 mr-3">
                Sida {page} av {Math.max(1, totalPages)} (totalt {total})
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Föregående
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Nästa
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
