import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type Order = {
  id: string;
  order_number: string | null;
  status: string | null;
  driver_name: string | null;
  vehicle_reg: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  passengers: number | null;
  notes: string | null;
  out_from: string | null;
  out_to: string | null;
  out_date: string | null;
  out_time: string | null;
  ret_from: string | null;
  ret_to: string | null;
  ret_date: string | null;
  ret_time: string | null;
};

export default function DriverOrderView() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [acking, setAcking] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/driver-orders/${id}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Kunde inte hämta körorder");
        setOrder(j.order);
      } catch (e: any) {
        setErr(e?.message || "Fel");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function ack() {
    if (!id) return;
    setAcking(true);
    try {
      const r = await fetch(`/api/driver-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ack: true, status: "ack" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Kunde inte bekräfta");
      setOrder(j.order);
    } catch (e: any) {
      alert(e?.message || "Kunde inte bekräfta");
    } finally {
      setAcking(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow p-5">
          {loading && <div>Laddar…</div>}
          {!loading && err && <div className="text-red-600">{err}</div>}
          {!loading && order && (
            <>
              <h1 className="text-xl font-semibold text-[#194C66] mb-1">
                Körorder {order.order_number ?? ""}
              </h1>
              <div className="text-sm text-[#194C66]/70 mb-4">Status: {order.status ?? "—"}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#f8fafc] rounded-lg p-4">
                  <div className="text-sm text-[#194C66]/70 mb-1">Utresa</div>
                  <div className="text-[#194C66]">
                    <div><b>Från:</b> {order.out_from ?? "—"}</div>
                    <div><b>Till:</b> {order.out_to ?? "—"}</div>
                    <div><b>Avgång:</b> {order.out_date ?? "—"} {order.out_time ?? ""}</div>
                    <div><b>Passagerare:</b> {order.passengers ?? "—"}</div>
                  </div>
                </div>
                <div className="bg-[#f8fafc] rounded-lg p-4">
                  <div className="text-sm text-[#194C66]/70 mb-1">Kontakt & fordon</div>
                  <div className="text-[#194C66]">
                    <div><b>Kontakt:</b> {order.contact_name ?? "—"} ({order.contact_phone ?? "—"})</div>
                    <div><b>Fordon:</b> {order.vehicle_reg ?? "—"}</div>
                  </div>
                </div>
              </div>

              {(order.ret_date || order.ret_from || order.ret_to) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Retur</div>
                    <div className="text-[#194C66]">
                      <div><b>Från:</b> {order.ret_from ?? "—"}</div>
                      <div><b>Till:</b> {order.ret_to ?? "—"}</div>
                      <div><b>Avgång:</b> {order.ret_date ?? "—"} {order.ret_time ?? ""}</div>
                    </div>
                  </div>
                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Noteringar</div>
                    <div className="text-[#194C66] whitespace-pre-wrap">
                      {order.notes ?? "—"}
                    </div>
                  </div>
                </div>
              )}

              {!order.ret_date && (
                <div className="bg-[#f8fafc] rounded-lg p-4 mt-4">
                  <div className="text-sm text-[#194C66]/70 mb-1">Noteringar</div>
                  <div className="text-[#194C66] whitespace-pre-wrap">
                    {order.notes ?? "—"}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <a
                  className="px-4 py-2 rounded-[25px] bg-[#194C66] text-white text-sm"
                  href={`tel:${order.contact_phone ?? ""}`}
                >
                  Ring kontakt
                </a>
                <button
                  onClick={ack}
                  disabled={acking || order.status === "ack" || order.status === "done"}
                  className="px-4 py-2 rounded-[25px] border text-sm disabled:opacity-60"
                >
                  {order.status === "ack" ? "Bekräftad" : acking ? "Bekräftar…" : "Bekräfta mottaget"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
