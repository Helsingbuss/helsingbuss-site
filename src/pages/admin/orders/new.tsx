// src/pages/admin/orders/new.tsx
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

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function tidyTime(v?: string | null, fallback = "08:00") {
  if (!v) return fallback;
  const s = String(v).slice(0, 5);
  const [h = "00", m = "00"] = s.split(":");
  const hh = `${h}`.padStart(2, "0");
  const mm = `${m}`.padStart(2, "0");
  return /^\d{2}:\d{2}$/.test(`${hh}:${mm}`) ? `${hh}:${mm}` : fallback;
}
function isEmailLike(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

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
    out_date: todayISO(),
    out_time: "08:00",

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

  // Om bookingId kom i URL:en – hämta den och autofyll
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

  // Valfri autofyll om offerId angivits i URL och du har en 1-post-endpoint
  useEffect(() => {
    (async () => {
      if (!offerId) return;
      try {
        const u = new URL("/api/offers/one", window.location.origin);
        u.searchParams.set("id", offerId);
        const res = await fetch(u.toString());
        const j = await res.json();
        if (!res.ok || !j?.offer) return;
        const o = j.offer as any;

        setF((s) => ({
          ...s,
          offer_id: offerId,
          // Kund
          contact_name: o.contact_person ?? o.customer_name ?? s.contact_name,
          contact_phone: o.customer_phone ?? s.contact_phone,
          passengers: o.passengers != null ? String(o.passengers) : s.passengers,
          notes: o.notes ?? s.notes,

          // Utresa
          out_from: o.departure_place ?? s.out_from,
          out_to: o.destination ?? s.out_to,
          out_date: o.departure_date ?? s.out_date ?? todayISO(),
          out_time: tidyTime(o.departure_time ?? s.out_time),

          // Retur
          ret_from: o.return_departure ?? s.ret_from,
          ret_to: o.return_destination ?? s.ret_to,
          ret_date: o.return_date ?? s.ret_date,
          ret_time: tidyTime(o.return_time ?? s.ret_time, ""),
        }));
        setMsg(null);
        setErr(null);
      } catch {}
    })();
  }, [offerId]);

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
      passengers: b.passengers != null ? String(b.passengers) : s.passengers,
      notes: b.notes ?? s.notes,

      // Utresa
      out_from: b.departure_place ?? s.out_from,
      out_to: b.destination ?? s.out_to,
      out_date: b.departure_date ?? s.out_date ?? todayISO(),
      out_time: tidyTime(b.departure_time ?? s.out_time),

      // Retur
      ret_from: b.return_departure ?? s.ret_from,
      ret_to: b.return_destination ?? s.ret_to,
      ret_date: b.return_date ?? s.ret_date,
      ret_time: tidyTime(b.return_time ?? s.ret_time, ""),
    }));
    setLinkedBookingNo(b.booking_number ?? "");
    setMsg(null);
    setErr(null);
  }

  /** Snabbhjälp: vänd utresans från/till */
  function flipOutbound() {
    setF((s) => ({ ...s, out_from: s.out_to, out_to: s.out_from }));
  }

  /** Snabbhjälp: skapa retur från utresan (vänd sträckan, kopiera datum/tid) */
  function createReturnFromOutbound() {
    setF((s) => ({
      ...s,
      ret_from: s.out_to || s.ret_from,
      ret_to: s.out_from || s.ret_to,
      ret_date: s.out_date || s.ret_date,
      ret_time: s.out_time || s.ret_time,
    }));
  }

  /** Rensa hela retursektionen snabbt */
  function clearReturn() {
    setF((s) => ({ ...s, ret_from: "", ret_to: "", ret_date: "", ret_time: "" }));
  }

  function validate(mode: "draft" | "send" | "preview") {
    const missing: string[] = [];

    // Alltid krav på utresans grunddata
    if (!f.out_from.trim()) missing.push("Utresa: Från");
    if (!f.out_to.trim()) missing.push("Utresa: Till");
    if (!f.out_date.trim()) missing.push("Utresa: Datum");
    if (!f.out_time.trim()) missing.push("Utresa: Tid");

    // PAX bör vara siffra (om angivet)
    if (f.passengers && isNaN(Number(f.passengers))) {
      missing.push("Passagerare (måste vara siffra)");
    }

    // Vid SKICKA kräver vi operativa fält
    if (mode === "send") {
      if (!f.driver_email.trim() || !isEmailLike(f.driver_email.trim())) {
        missing.push("Chaufför: E-post (giltig)");
      }
      if (!f.driver_name.trim()) missing.push("Chaufför: Namn");
      if (!f.vehicle_reg.trim()) missing.push("Fordon");
      if (!f.contact_name.trim()) missing.push("Kontakt på plats");
      if (!f.contact_phone.trim()) missing.push("Kontakt telefon");

      // Om retur fyllts delvis – kräver hela returens datum/tid/platser
      const anyRet = f.ret_from || f.ret_to || f.ret_date || f.ret_time;
      if (anyRet) {
        if (!f.ret_from.trim()) missing.push("Retur: Från");
        if (!f.ret_to.trim()) missing.push("Retur: Till");
        if (!f.ret_date.trim()) missing.push("Retur: Datum");
        if (!f.ret_time.trim()) missing.push("Retur: Tid");
      }
    }

    return missing;
  }

  async function submit(mode: "draft" | "send" | "preview") {
    setLoading(true);
    setErr(null);
    setMsg(null);

    const problems = validate(mode);
    if (problems.length) {
      setLoading(false);
      setErr(`Kontrollera följande fält:\n• ${problems.join("\n• ")}`);
      return;
    }

    // Normalisera tider innan payload
    const outTime = tidyTime(f.out_time);
    const retTime = tidyTime(f.ret_time || "", "");

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
        out_time: outTime || null,

        ret_from: f.ret_from || null,
        ret_to: f.ret_to || null,
        ret_date: f.ret_date || null,
        ret_time: retTime || null,
      };

      const r = await fetch("/api/driver-orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Kunde inte skapa körorder");

      if (mode === "send") {
        setMsg(`Körorder skapad och skickad till ${payload.driver_email || "chaufför"}.`);
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
        aria-label="Välj chaufför"
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
        aria-label="Välj fordon"
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
              <div className="rounded bg-red-50 border border-red-200 text-red-700 p-2 mb-3 text-sm whitespace-pre-line" role="alert" aria-live="assertive">
                {err}
              </div>
            )}
            {msg && (
              <div className="rounded bg-green-50 border border-green-200 text-green-700 p-2 mb-3 text-sm" role="status" aria-live="polite">
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

              {f.offer_id && (
                <div className="text-xs text-[#194C66]/70 mt-1">
                  Kopplad offert: <b>{f.offer_id}</b>
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
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="E-post (kan skrivas in manuellt)"
                    value={f.driver_email}
                    onChange={(e) => upd("driver_email", e.target.value)}
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
                    inputMode="numeric"
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
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#194C66]/70 mb-1">Utresa</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={flipOutbound}
                      className="px-2 py-1 border rounded text-xs text-[#194C66]"
                      title="Vänd Från/Till för utresan"
                    >
                      Vänd utresa
                    </button>
                    <button
                      type="button"
                      onClick={createReturnFromOutbound}
                      className="px-2 py-1 border rounded text-xs text-[#194C66]"
                      title="Skapa retur genom att vända utresan"
                    >
                      Skapa retur
                    </button>
                  </div>
                </div>
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
                      min={todayISO()}
                      className="border rounded px-3 py-2"
                      value={f.out_date}
                      onChange={(e) => upd("out_date", e.target.value)}
                    />
                    <input
                      type="time"
                      className="border rounded px-3 py-2"
                      value={f.out_time}
                      onChange={(e) => upd("out_time", e.target.value)}
                      onBlur={(e) => upd("out_time", tidyTime(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#f8fafc] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#194C66]/70 mb-1">Retur (valfritt)</div>
                  <button
                    type="button"
                    onClick={clearReturn}
                    className="px-2 py-1 border rounded text-xs text-[#194C66]"
                    title="Rensa retur"
                  >
                    Rensa retur
                  </button>
                </div>
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
                      onBlur={(e) => upd("ret_time", tidyTime(e.target.value, ""))}
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
