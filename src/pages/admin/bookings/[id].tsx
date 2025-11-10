// src/pages/admin/bookings/[id].tsx
import { useEffect, useMemo, useRef, useState } from "react";
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

const RED_HOURS = 48;
const ORANGE_HOURS = 120;

function clsStatusPill(s?: string | null) {
  const v = (s || "").toLowerCase();
  if (v === "godkand") return "bg-green-100 text-green-800";
  if (v === "bekraftad" || v === "confirmed") return "bg-emerald-100 text-emerald-800";
  if (v === "planerad" || v === "bokad") return "bg-blue-100 text-blue-800";
  if (v === "makulerad" || v === "avbojt" || v === "avböjt" || v === "inställd") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-700";
}

function tidyTime(t?: string | null) {
  if (!t) return null;
  if (t.includes(":")) return t.slice(0, 5);
  if (t.length >= 4) return `${t.slice(0, 2)}:${t.slice(2, 4)}`;
  return null;
}

function parseDateTime(date?: string | null, time?: string | null): Date | null {
  if (!date) return null;
  const tt = tidyTime(time) || "00:00";
  const dt = new Date(`${date}T${tt}`);
  return isNaN(dt.getTime()) ? null : dt;
}

function prioMeta(date?: string | null, time?: string | null) {
  const target = parseDateTime(date, time);
  if (!target) return { label: "—", cls: "bg-gray-200 text-gray-700", title: "Saknar/ogiltigt datum" };

  const diffH = (target.getTime() - Date.now()) / 36e5;
  if (diffH <= RED_HOURS) return { label: "Röd", cls: "bg-red-100 text-red-800", title: "<= 48h kvar" };
  if (diffH <= ORANGE_HOURS) return { label: "Orange", cls: "bg-amber-100 text-amber-800", title: "48–120h kvar" };
  return { label: "Grön", cls: "bg-green-100 text-green-800", title: "> 120h kvar" };
}

function relUntil(date?: string | null, time?: string | null) {
  const target = parseDateTime(date, time);
  if (!target) return "—";
  let diffMs = target.getTime() - Date.now();
  const neg = diffMs < 0;
  diffMs = Math.abs(diffMs);
  const h = Math.floor(diffMs / 36e5);
  const d = Math.floor(h / 24);
  const hr = h % 24;
  const m = Math.floor((diffMs % 36e5) / 60000);
  const base = d > 0 ? `${d} d ${hr} h` : `${hr} h ${m} min`;
  return neg ? `−${base} (passerad)` : `om ${base}`;
}

function fmtDateSv(iso?: string | null) {
  if (!iso) return "—";
  const dt = new Date(`${iso}T00:00:00`);
  try {
    return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(dt);
  } catch {
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    const [y, m, d] = parts;
    const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    const mi = Math.max(1, Math.min(12, parseInt(m, 10))) - 1;
    return `${parseInt(d, 10)} ${months[mi]} ${y}`;
  }
}
function fmtTime(t?: string | null) { return (tidyTime(t) ?? "—"); }

function toNumOrNull(v: any): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sanitizeTel(t?: string | null) {
  if (!t) return "";
  return t.replace(/[^\d+]/g, "");
}

/** Normalisera API-svar till Booking */
function normalizeBooking(x: any): Booking {
  const b: Booking = {
    id: String(x.id ?? x.booking_id ?? x.uuid ?? ""),
    booking_number: x.booking_number ?? x.bookingNo ?? x.number ?? null,
    status: x.status ?? x.state ?? null,

    contact_person: x.contact_person ?? x.customer_name ?? x.contact ?? null,
    customer_email: x.customer_email ?? x.email ?? null,
    customer_phone: x.customer_phone ?? x.phone ?? null,

    passengers: toNumOrNull(x.passengers),

    departure_place: x.departure_place ?? x.from ?? x.departure_location ?? null,
    destination: x.destination ?? x.to ?? x.destination_location ?? null,
    departure_date: x.departure_date ?? x.date ?? null,
    departure_time: tidyTime(x.departure_time ?? x.time ?? null),
    end_time: tidyTime(x.end_time ?? null),
    on_site_minutes: toNumOrNull(x.on_site_minutes),

    stopover_places: x.stopover_places ?? x.via ?? null,

    return_departure: x.return_departure ?? x.return_from ?? null,
    return_destination: x.return_destination ?? x.return_to ?? null,
    return_date: x.return_date ?? null,
    return_time: tidyTime(x.return_time ?? null),
    return_end_time: tidyTime(x.return_end_time ?? null),
    return_on_site_minutes: toNumOrNull(x.return_on_site_minutes),

    notes: x.notes ?? x.message ?? null,

    assigned_driver_id: x.assigned_driver_id ?? x.driver_id ?? null,
    assigned_vehicle_id: x.assigned_vehicle_id ?? x.vehicle_id ?? null,

    created_at: x.created_at ?? null,
    updated_at: x.updated_at ?? null,
  };
  return b;
}

export default function BookingDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [b, setB] = useState<Booking | null>(null);
  const [driverLabel, setDriverLabel] = useState<string | null>(null);
  const [vehicleLabel, setVehicleLabel] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        const r = await fetch(`/api/bookings/${encodeURIComponent(id)}`, { signal: ctrl.signal });
        const j = await r.json().catch(() => ({} as any));
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

        // Stöd flera former på payload
        const raw = j?.booking ?? j;
        const nb = normalizeBooking(raw);
        setB(nb);

        // Etiketter: toppnivå / inbäddat / fallback
        const drvLabel =
          j?.driver_label ??
          raw?.driver_label ??
          raw?.driver?.name ??
          raw?.assigned_driver_name ??
          null;

        const vehLabel =
          j?.vehicle_label ??
          raw?.vehicle_label ??
          raw?.vehicle?.name ??
          raw?.assigned_vehicle_name ??
          null;

        setDriverLabel(drvLabel ?? null);
        setVehicleLabel(vehLabel ?? null);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message || "Kunde inte hämta bokningen.");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [id]);

  const title = useMemo(() => {
    if (!b) return "Bokning";
    const nr = b.booking_number || b.id;
    return `Bokning ${nr}`;
  }, [b]);

  const prio = useMemo(
    () => prioMeta(b?.departure_date, b?.departure_time),
    [b?.departure_date, b?.departure_time]
  );

  const createdText = useMemo(() => {
    if (!b?.created_at) return "—";
    const dt = new Date(b.created_at);
    return isNaN(dt.getTime()) ? b.created_at : new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short" }).format(dt);
  }, [b?.created_at]);

  const updatedText = useMemo(() => {
    if (!b?.updated_at) return "—";
    const dt = new Date(b.updated_at);
    return isNaN(dt.getTime()) ? b.updated_at : new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short" }).format(dt);
  }, [b?.updated_at]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  const canCreateOrder = b && !["inställd","makulerad"].includes((b.status||"").toLowerCase());

  // helpers to show 0 min instead of "—"
  const hasOnSite = (v?: number | null) => v !== null && v !== undefined;

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#194C66]">{title}</h1>
            <div className="flex items-center gap-2">
              {b && (
                <button
                  onClick={() => copy(b.booking_number || b.id)}
                  className="px-4 py-2 rounded-[25px] border text-sm text-[#194C66]"
                  title="Kopiera boknings-ID"
                >
                  Kopiera ID
                </button>
              )}
              {canCreateOrder && (
                <a
                  href={`/admin/orders/new?bookingId=${encodeURIComponent(b!.id)}`}
                  className="px-4 py-2 rounded-[25px] bg-[#194C66] text-white text-sm"
                  title="Skapa körorder baserat på denna bokning"
                >
                  Skapa körorder
                </a>
              )}
              <a
                href="/admin/bookings"
                className="px-4 py-2 rounded-[25px] border text-sm text-[#194C66]"
              >
                Alla bokningar
              </a>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-[25px] border text-sm text-[#194C66]"
                title="Skriv ut denna bokning"
              >
                Skriv ut
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 space-y-6">
            {loading && <div className="text-[#194C66]/70">Laddar…</div>}
            {!loading && err && (
              <div
                className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm"
                role="alert"
                aria-live="assertive"
              >
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
                    <div className="text-[#194C66] space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">ID:</span>
                        <span>{b.booking_number || b.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Status:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${clsStatusPill(b.status)}`}>
                          {b.status || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Prio:</span>
                        <span title={prio.title} className={`px-2 py-0.5 rounded-full text-xs ${prio.cls}`}>
                          {prio.label}
                        </span>
                        <span className="text-xs text-[#194C66]/70">
                          {relUntil(b.departure_date, b.departure_time)}
                        </span>
                      </div>
                      <div className="text-xs text-[#194C66]/60 pt-1">
                        Skapad: {createdText} · Uppdaterad: {updatedText}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Kund</div>
                    <div className="text-[#194C66] space-y-1">
                      <div>
                        <span className="font-semibold">Beställare:</span>{" "}
                        {b.contact_person || "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">E-post:</span>{" "}
                        {b.customer_email ? (
                          <>
                            <a className="underline" href={`mailto:${b.customer_email}`}>
                              {b.customer_email}
                            </a>
                            <button
                              className="text-xs underline"
                              onClick={() => copy(b.customer_email!)}
                              title="Kopiera e-post"
                            >
                              kopiera
                            </button>
                          </>
                        ) : "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Telefon:</span>{" "}
                        {b.customer_phone ? (
                          <>
                            <a className="underline" href={`tel:${sanitizeTel(b.customer_phone)}`}>
                              {b.customer_phone}
                            </a>
                            <button
                              className="text-xs underline"
                              onClick={() => copy(b.customer_phone!)}
                              title="Kopiera telefon"
                            >
                              kopiera
                            </button>
                          </>
                        ) : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Tilldelning (internt)</div>
                    <div className="text-[#194C66] space-y-1">
                      <div>
                        <span className="font-semibold">Chaufför:</span>{" "}
                        {driverLabel || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Fordon:</span>{" "}
                        {vehicleLabel || "—"}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Utresa / Retur */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Utresa</div>
                    <div className="text-[#194C66] space-y-1">
                      <div><span className="font-semibold">Datum:</span> {fmtDateSv(b.departure_date)}</div>
                      <div><span className="font-semibold">Start:</span> {fmtTime(b.departure_time)}</div>
                      <div><span className="font-semibold">Slut (planerat):</span> {fmtTime(b.end_time)}</div>
                      <div>
                        <span className="font-semibold">På plats:</span>{" "}
                        {hasOnSite(b.on_site_minutes) ? `${Math.max(0, b.on_site_minutes || 0)} min före` : "—"}
                      </div>
                      <div><span className="font-semibold">Från:</span> {b.departure_place || "—"}</div>
                      <div><span className="font-semibold">Via:</span> {b.stopover_places || "—"}</div>
                      <div><span className="font-semibold">Till:</span> {b.destination || "—"}</div>
                      <div>
                        <span className="font-semibold">Passagerare:</span>{" "}
                        {typeof b.passengers === "number" ? b.passengers : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Retur</div>
                    <div className="text-[#194C66] space-y-1">
                      <div><span className="font-semibold">Datum:</span> {fmtDateSv(b.return_date)}</div>
                      <div><span className="font-semibold">Start:</span> {fmtTime(b.return_time)}</div>
                      <div><span className="font-semibold">Slut (planerat):</span> {fmtTime(b.return_end_time)}</div>
                      <div>
                        <span className="font-semibold">På plats:</span>{" "}
                        {hasOnSite(b.return_on_site_minutes) ? `${Math.max(0, b.return_on_site_minutes || 0)} min före` : "—"}
                      </div>
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
