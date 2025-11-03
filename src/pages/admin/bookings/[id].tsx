// src/pages/admin/bookings/[id].tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";

type Booking = {
  id: string;
  booking_number?: string | null;
  status?: string | null;

  contact_person?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;

  passengers?: number | null;

  departure_place?: string | null;
  destination?: string | null;
  departure_date?: string | null; // YYYY-MM-DD
  departure_time?: string | null;
  end_time?: string | null;
  on_site_minutes?: number | null;
  stopover_places?: string | null;

  return_departure?: string | null;
  return_destination?: string | null;
  return_date?: string | null;
  return_time?: string | null;
  return_end_time?: string | null;
  return_on_site_minutes?: number | null;

  notes?: string | null;

  assigned_driver_id?: string | null;
  assigned_vehicle_id?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

function prioColor(date?: string | null, time?: string | null) {
  if (!date) return "";
  const d = new Date(`${date}T${time || "00:00"}`);
  const diffH = (d.getTime() - Date.now()) / (1000 * 60 * 60);
  if (diffH <= 48) return "text-red-600";
  if (diffH <= 120) return "text-orange-500";
  return "text-green-600";
}

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [b, setB] = useState<Booking | null>(null);
  const [driverLabel, setDriverLabel] = useState<string | null>(null);
  const [vehicleLabel, setVehicleLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const r = await fetch(`/api/bookings/${id}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setB(j.booking || null);
        setDriverLabel(j.driver_label ?? null);
        setVehicleLabel(j.vehicle_label ?? null);
      } catch (e: any) {
        setErr(e?.message || "Kunde inte hämta bokningen.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const title = useMemo(() => {
    if (!b) return "Bokning";
    const nr = b.booking_number || b.id;
    return `Bokning ${nr}`;
  }, [b]);

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#194C66]">{title}</h1>
            <a
              href="/admin/bookings"
              className="px-4 py-2 rounded-[25px] border text-sm text-[#194C66]"
            >
              Alla bokningar
            </a>
          </div>

          <div className="bg-white rounded-xl shadow p-4 space-y-6">
            {loading && <div className="text-[#194C66]/70">Laddar…</div>}
            {!loading && err && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
                {err}
              </div>
            )}
            {!loading && !err && !b && (
              <div className="text-[#194C66]/70">Ingen bokning hittades.</div>
            )}

            {!loading && b && (
              <>
                {/* Översta kort: status + prio */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Allmänt</div>
                    <div className="text-[#194C66]">
                      <div><span className="font-semibold">ID:</span> {b.booking_number || b.id}</div>
                      <div><span className="font-semibold">Status:</span> {b.status || "—"}</div>
                      <div className={`text-xs ${prioColor(b.departure_date, b.departure_time)}`}>
                        {b.departure_date || "—"} {b.departure_time || ""}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Kund</div>
                    <div className="text-[#194C66]">
                      <div><span className="font-semibold">Beställare:</span> {b.contact_person || "—"}</div>
                      <div><span className="font-semibold">E-post:</span> {b.customer_email || "—"}</div>
                      <div><span className="font-semibold">Telefon:</span> {b.customer_phone || "—"}</div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Tilldelning (internt)</div>
                    <div className="text-[#194C66]">
                      <div><span className="font-semibold">Chaufför:</span> {driverLabel || "—"}</div>
                      <div><span className="font-semibold">Fordon:</span> {vehicleLabel || "—"}</div>
                    </div>
                  </div>
                </section>

                {/* Utresa / Retur */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Utresa</div>
                    <div className="text-[#194C66] space-y-1">
                      <div><span className="font-semibold">Datum:</span> {b.departure_date || "—"}</div>
                      <div><span className="font-semibold">Start:</span> {b.departure_time || "—"}</div>
                      <div><span className="font-semibold">Slut (planerat):</span> {b.end_time || "—"}</div>
                      <div><span className="font-semibold">Plats på:</span> {b.on_site_minutes ? `${b.on_site_minutes} min före` : "—"}</div>
                      <div><span className="font-semibold">Från:</span> {b.departure_place || "—"}</div>
                      <div><span className="font-semibold">Via:</span> {b.stopover_places || "—"}</div>
                      <div><span className="font-semibold">Till:</span> {b.destination || "—"}</div>
                      <div><span className="font-semibold">Passagerare:</span> {b.passengers ?? "—"}</div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Retur</div>
                    <div className="text-[#194C66] space-y-1">
                      <div><span className="font-semibold">Datum:</span> {b.return_date || "—"}</div>
                      <div><span className="font-semibold">Start:</span> {b.return_time || "—"}</div>
                      <div><span className="font-semibold">Slut (planerat):</span> {b.return_end_time || "—"}</div>
                      <div><span className="font-semibold">Plats på:</span> {b.return_on_site_minutes ? `${b.return_on_site_minutes} min före` : "—"}</div>
                      <div><span className="font-semibold">Från:</span> {b.return_departure || "—"}</div>
                      <div><span className="font-semibold">Till:</span> {b.return_destination || "—"}</div>
                    </div>
                  </div>
                </section>

                {/* Noteringar */}
                <section className="bg-[#f8fafc] rounded-lg p-4">
                  <div className="text-sm text-[#194C66]/70 mb-1">Övrig information</div>
                  <div className="text-[#194C66] whitespace-pre-wrap">
                    {b.notes || "—"}
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

// Tvinga SSR för att undvika statisk export av dynamisk sida
export async function getServerSideProps() {
  return { props: {} };
}
