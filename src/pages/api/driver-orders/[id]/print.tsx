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

export default function DriverOrderPrint() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const r = await fetch(`/api/driver-orders/${id}`);
      const j = await r.json();
      setOrder(j?.order ?? null);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="p-6 print:p-0">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="no-print mb-4">
        <button onClick={()=>window.print()} className="px-4 py-2 rounded bg-[#194C66] text-white">Skriv ut</button>
      </div>
      {loading && <div>Laddar…</div>}
      {!loading && !order && <div>Hittades inte</div>}
      {!loading && order && (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-semibold text-[#194C66] mb-2">
            Körorder {order.order_number ?? ""}
          </h1>
          <div className="text-sm text-[#194C66]/70 mb-4">Status: {order.status ?? "—"}</div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-semibold text-[#194C66] mb-1">Utresa</div>
              <div>{order.out_from ?? "—"} → {order.out_to ?? "—"}</div>
              <div>{order.out_date ?? "—"} {order.out_time ?? ""}</div>
              <div>Passagerare: {order.passengers ?? "—"}</div>
            </div>
            <div>
              <div className="font-semibold text-[#194C66] mb-1">Kontakt & fordon</div>
              <div>Kontakt: {order.contact_name ?? "—"} ({order.contact_phone ?? "—"})</div>
              <div>Fordon: {order.vehicle_reg ?? "—"}</div>
              <div>Chaufför: {order.driver_name ?? "—"}</div>
            </div>
          </div>

          {(order.ret_date || order.ret_from || order.ret_to) && (
            <div className="mt-4">
              <div className="font-semibold text-[#194C66] mb-1">Retur</div>
              <div>{order.ret_from ?? "—"} → {order.ret_to ?? "—"}</div>
              <div>{order.ret_date ?? "—"} {order.ret_time ?? ""}</div>
            </div>
          )}

          <div className="mt-4">
            <div className="font-semibold text-[#194C66] mb-1">Noteringar</div>
            <div className="whitespace-pre-wrap">{order.notes ?? "—"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
