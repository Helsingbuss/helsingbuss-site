import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";

// 👉 typahead för bokningar
import BookingChooser, {
  type PickedBooking,
} from "@/components/orders/BookingChooser";

type Option = {
  id: string;
  label: string;
  email?: string | null;
  phone?: string | null;
  active?: boolean;
};

type FormState = {
  booking_id: string | null;
  offer_id: string | null;

  driver_name: string;
  driver_email: string;
  vehicle_reg: string;

  contact_name: string;
  contact_phone: string;
  passengers: string;
  notes: string;

  out_from: string;
  out_to: string;
  out_date: string; // YYYY-MM-DD
  out_time: string; // HH:mm

  ret_from: string;
  ret_to: string;
  ret_date: string;
  ret_time: string;
};

export default function NewDriverOrder() {
  const router = useRouter();
  const { bookingId, offerId } = router.query as {
    bookingId?: string;
    offerId?: string;
  };

  const [f, setF] = useState<FormState>({
    booking_id: bookingId ?? null,
    offer_id: offerId ?? null,

    driver_name: "",
    driver_email: "",
    vehicle_reg: "",

    contact_name: "",
    contact_phone: "",
    passengers: "",
    notes: "",

    out_from: "",
    out_to: "",
    out_date: "",
    out_time: "",

    ret_from: "",
    ret_to: "",
    ret_date: "",
    ret_time: "",
  });

  // För visning efter val (t.ex. "BK259153")
  const [linkedBookingNo, setLinkedBookingNo] = useState<string>("");

  // options
  const [drivers, setDrivers] = useState<Option[]>([]);
  const [vehicles, setVehicles] = useState<Option[]>([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Hämta chaufförer+fordon
  useEffect(() => {
    (async () => {
      try {
        const d = await fetch("/api/drivers/options").then((r) => r.json());
        setDrivers(d?.options ?? []);
      } catch {}
      try {
        const v = await fetch("/api/vehicles/options").then((r) => r.json());
        setVehicles(v?.options ?? []);
      } catch {}
    })();
  }, []);

  // Om bookingId kom i URL:en – hämta den fulla bokningen och autofyll
  useEffect(() => {
    (async () => {
      if (!bookingId) return;
      try {
        const u = new URL("/api/bookings/one", window.location.origin);
        u.searchParams.set("id", bookingId);
        const res = await fetch(u.toString());
        const j = await res.json();
        if (res.ok && j?.booking) {
          applyBooking(j.booking as PickedBooking);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  function upd<K extends keyof FormState>(k: K, v: string | null) {
    setF((s) => ({ ...s, [k]: (v ?? "") as any }));
  }

  /** När en bokning väljs i typaheaden – fyll formuläret men låt allt vara redigerbart */
  function applyBooking(b: PickedBooking) {
    setF((s) => ({
      ...s,
      booking_id: b.id || s.booking_id,
      // Kund
      contact_name: b.contact_person ?? s.contact_name,
      contact_phone: b.customer_phone ?? s.contact_phone,
      passengers:
        (b.passengers !== null && b.passengers !== undefined
          ? String(b.passengers)
          : s.passengers) || s.passengers,
      notes: b.notes ?? s.notes,

      // Utresa
      out_from: b.departure_place ?? s.out_from,
      out_to: b.destination ?? s.out_to,
      out_date: b.departure_date ?? s.out_date,
      out_time: b.departure_time ?? s.out_time,

      // Retur
      ret_from: b.return_departure ?? s.ret_from,
      ret_to: b.return_destination ?? s.ret_to,
      ret_date: b.return_date ?? s.ret_date,
      ret_time: b.return_time ?? s.ret_time,
    }));
    setLinkedBookingNo(b.booking_number ?? "");
    setMsg(null);
    setErr(null);
  }

  async function submit(mode: "draft" | "send" | "preview") {
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const payload = {
        status: mode === "draft" || mode === "preview" ? "draft" : "sent",
        booking_id: f.booking_id,
        offer_id: f.offer_id,

        driver_name: f.driver_name || null,
        driver_email: f.driver_email || null,
        vehicle_reg: f.vehicle_reg || null,

        contact_name: f.contact_name || null,
        contact_phone: f.contact_phone || null,
        passengers: f.passengers ? Number(f.passengers) : null,
        notes: f.notes || null,

        out_from: f.out_from || null,
        out_to: f.out_to || null,
        out_date: f.out_date || null,
        out_time: f.out_time || null,

        ret_from: f.ret_from || null,
        ret_to: f.ret_to || null,
        ret_date: f.ret_date || null,
        ret_time: f.ret_time || null,
      };

      const r = await fetch("/api/driver-orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Kunde inte skapa körorder");

      if (mode === "send") {
        setMsg(
          `Körorder skapad och skickad till ${
            payload.driver_email || "chaufför"
          }.`
        );
      } else if (mode === "draft") {
        setMsg("Utkast sparat.");
      } else {
        // preview – öppna körorder i ny flik
        window.open(`/driver-order/${j.order.id}`, "_blank");
      }
    } catch (e: any) {
      setErr(e?.message || "Fel vid skapande");
    } finally {
      setLoading(false);
    }
  }

  const driverSelect = useMemo(
    () => (
      <select
        className="border rounded px-3 py-2"
        value={f.driver_email}
        onChange={(e) => {
          const opt = drivers.find((d) => d.email === e.target.value);
          upd("driver_email", e.target.value);
          if (opt) upd("driver_name", opt.label);
        }}
      >
        <option value="">— välj chaufför —</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.email || ""}>
            {d.label}
            {d.active === false ? " (inaktiv)" : ""}
            {d.email ? ` — ${d.email}` : ""}
          </option>
        ))}
      </select>
    ),
    [drivers, f.driver_email]
  );

  const vehicleSelect = useMemo(
    () => (
      <select
        className="border rounded px-3 py-2"
        value={f.vehicle_reg}
        onChange={(e) => upd("vehicle_reg", e.target.value)}
      >
        <option value="">— välj fordon —</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.label}>
            {v.label}
          </option>
        ))}
      </select>
    ),
    [vehicles, f.vehicle_reg]
  );

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="p-6 space-y-6">
          <h1 className="text-xl font-semibold text-[#194C66]">Skapa körorder</h1>

          <div className="bg-white rounded-xl shadow p-4">
            {err && (
              <div className="rounded bg-red-50 border border-red-200 text-red-700 p-2 mb-3 text-sm">
                {err}
              </div>
            )}
            {msg && (
              <div className="rounded bg-green-50 border border-green-200 text-green-700 p-2 mb-3 text-sm">
                {msg}
              </div>
            )}

            {/* Koppla bokning (typahead) */}
            <div className="bg-[#f8fafc] rounded-lg p-4 mb-4">
              <div className="text-sm text-[#194C66]/70 mb-1">
                Koppla till bokning (valfritt)
              </div>

              <BookingChooser
                onPick={applyBooking}
                placeholder="Sök bokning… (nummer, kontakt, ort)"
              />

              {(f.booking_id || linkedBookingNo) && (
                <div className="text-xs text-[#194C66]/70 mt-2">
                  Kopplad bokning:{" "}
                  <b>{linkedBookingNo || f.booking_id || ""}</b>
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => {
                      setF((s) => ({ ...s, booking_id: null }));
                      setLinkedBookingNo("");
                    }}
                  >
                    koppla bort
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#f8fafc] rounded-lg p-4">
                <div className="text-sm text-[#194C66]/70 mb-1">Chaufför</div>
                <div className="grid gap-2">
                  {driverSelect}
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Namn"
                    value={f.driver_name}
                    onChange={(e) => upd("driver_name", e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-[#f8fafc] rounded-lg p-4">
                <div className="text-sm text-[#194C66]/70 mb-1">Kontakt & grupp</div>
                <div className="grid gap-2">
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Kontakt på plats"
                    value={f.contact_name}
                    onChange={(e) => upd("contact_name", e.target.value)}
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Telefon"
                    value={f.contact_phone}
                    onChange={(e) => upd("contact_phone", e.target.value)}
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Passagerare"
                    value={f.passengers}
                    onChange={(e) => upd("passengers", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-[#f8fafc] rounded-lg p-4">
                <div className="text-sm text-[#194C66]/70 mb-1">Fordon</div>
                <div className="grid gap-2">{vehicleSelect}</div>
              </div>

              <div className="bg-[#f8fafc] rounded-lg p-4">
                <div className="text-sm text-[#194C66]/70 mb-1">Noteringar</div>
                <textarea
                  className="border rounded px-3 py-2 w-full min-h-[100px]"
                  value={f.notes}
                  onChange={(e) => upd("notes", e.target.value)}
                />
              </div>
            </div>

            {/* Utresa / Retur */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-[#f8fafc] rounded-lg p-4">
                <div className="text-sm text-[#194C66]/70 mb-1">Utresa</div>
                <div className="grid gap-2">
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Från"
                    value={f.out_from}
                    onChange={(e) => upd("out_from", e.target.value)}
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Till"
                    value={f.out_to}
                    onChange={(e) => upd("out_to", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      className="border rounded px-3 py-2"
                      value={f.out_date}
                      onChange={(e) => upd("out_date", e.target.value)}
                    />
                    <input
                      type="time"
                      className="border rounded px-3 py-2"
                      value={f.out_time}
                      onChange={(e) => upd("out_time", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#f8fafc] rounded-lg p-4">
                <div className="text-sm text-[#194C66]/70 mb-1">Retur (valfritt)</div>
                <div className="grid gap-2">
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Från"
                    value={f.ret_from}
                    onChange={(e) => upd("ret_from", e.target.value)}
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Till"
                    value={f.ret_to}
                    onChange={(e) => upd("ret_to", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      className="border rounded px-3 py-2"
                      value={f.ret_date}
                      onChange={(e) => upd("ret_date", e.target.value)}
                    />
                    <input
                      type="time"
                      className="border rounded px-3 py-2"
                      value={f.ret_time}
                      onChange={(e) => upd("ret_time", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                disabled={loading}
                onClick={() => submit("draft")}
                className="px-5 py-2 rounded-[25px] border text-sm disabled:opacity-60"
              >
                {loading ? "Sparar…" : "Spara som utkast"}
              </button>
              <button
                disabled={loading}
                onClick={() => submit("preview")}
                className="px-5 py-2 rounded-[25px] border text-sm disabled:opacity-60"
              >
                {loading ? "Öppnar…" : "Förhandsgranska"}
              </button>
              <button
                disabled={loading}
                onClick={() => submit("send")}
                className="px-5 py-2 rounded-[25px] bg-[#194C66] text-white disabled:opacity-60"
              >
                {loading ? "Skickar…" : "Skapa & skicka körorder"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
