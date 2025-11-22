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
  contact_email: string;
  contact_phone: string;
  passengers: string;
  notes: string;

  out_from: string;
  out_to: string;
  out_date: string; // YYYY-MM-DD
  out_time: string; // HH:mm
  out_end_time: string; // planerad sluttid

  ret_from: string;
  ret_to: string;
  ret_date: string;
  ret_time: string;
  ret_end_time: string;
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
    contact_email: "",
    contact_phone: "",
    passengers: "",
    notes: "",

    out_from: "",
    out_to: "",
    out_date: todayISO(),
    out_time: "08:00",
    out_end_time: "",

    ret_from: "",
    ret_to: "",
    ret_date: "",
    ret_time: "",
    ret_end_time: "",
  });

  const hasReturn =
    !!f.ret_from || !!f.ret_to || !!f.ret_date || !!f.ret_time;

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
      } catch {
        // ignore
      }
      try {
        const v = await fetch("/api/vehicles/options").then((r) => r.json());
        setVehicles(v?.options ?? []);
      } catch {
        // ignore
      }
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
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // Valfri autofyll om offerId angivits i URL
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
          contact_name:
            o.contact_person ?? o.customer_name ?? s.contact_name,
          contact_email:
            o.customer_email ?? o.contact_email ?? s.contact_email,
          contact_phone: o.customer_phone ?? s.contact_phone,
          passengers:
            o.passengers != null ? String(o.passengers) : s.passengers,
          notes: o.notes ?? s.notes,

          // Utresa
          out_from: o.departure_place ?? s.out_from,
          out_to: o.destination ?? s.out_to,
          out_date: o.departure_date ?? s.out_date ?? todayISO(),
          out_time: tidyTime(o.departure_time ?? s.out_time),
          out_end_time: tidyTime(
            (o.end_time ?? s.out_end_time) || "",
            ""
          ),

          // Retur
          ret_from: o.return_departure ?? s.ret_from,
          ret_to: o.return_destination ?? s.ret_to,
          ret_date: o.return_date ?? s.ret_date,
          ret_time: tidyTime(
            (o.return_time ?? s.ret_time) || "",
            ""
          ),
          ret_end_time: tidyTime(
            (o.return_end_time ?? s.ret_end_time) || "",
            ""
          ),
        }));
        setMsg(null);
        setErr(null);
      } catch {
        // ignore
      }
    })();
  }, [offerId]);

  function upd<K extends keyof FormState>(k: K, v: string | null) {
    setF((s) => ({ ...s, [k]: (v ?? "") as any }));
  }

  /** När en bokning väljs – fyll formuläret men låt allt vara redigerbart */
  function applyBooking(b: PickedBooking) {
    const bb = b as any;
    setF((s) => ({
      ...s,
      booking_id: b.id || s.booking_id,
      // Kund
      contact_name: b.contact_person ?? s.contact_name,
      contact_email: bb.customer_email ?? s.contact_email,
      contact_phone: b.customer_phone ?? s.contact_phone,
      passengers:
        b.passengers != null ? String(b.passengers) : s.passengers,
      notes: b.notes ?? s.notes,

      // Utresa
      out_from: b.departure_place ?? s.out_from,
      out_to: b.destination ?? s.out_to,
      out_date: b.departure_date ?? s.out_date ?? todayISO(),
      out_time: tidyTime(b.departure_time ?? s.out_time),
      out_end_time: tidyTime(
        (bb.end_time ?? s.out_end_time) || "",
        ""
      ),

      // Retur
      ret_from: b.return_departure ?? s.ret_from,
      ret_to: b.return_destination ?? s.ret_to,
      ret_date: b.return_date ?? s.ret_date,
      ret_time: tidyTime(
        (b.return_time ?? s.ret_time) || "",
        ""
      ),
      ret_end_time: tidyTime(
        (bb.return_end_time ?? s.ret_end_time) || "",
        ""
      ),
    }));
    setLinkedBookingNo(b.booking_number ?? "");
    setMsg(null);
    setErr(null);
  }

  /** Snabbhjälp: vänd utresans från/till */
  function flipOutbound() {
    setF((s) => ({
      ...s,
      out_from: s.out_to,
      out_to: s.out_from,
    }));
  }

  /** Skapa retur från utresan (vänd sträckan, kopiera datum/tid) */
  function createReturnFromOutbound() {
    setF((s) => ({
      ...s,
      ret_from: s.out_to || s.ret_from,
      ret_to: s.out_from || s.ret_to,
      ret_date: s.out_date || s.ret_date,
      ret_time: s.out_time || s.ret_time,
      ret_end_time: s.out_end_time || s.ret_end_time,
    }));
  }

  /** Rensa hela retursektionen snabbt */
  function clearReturn() {
    setF((s) => ({
      ...s,
      ret_from: "",
      ret_to: "",
      ret_date: "",
      ret_time: "",
      ret_end_time: "",
    }));
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

    // Vid SKICKA kräver vi mer
    if (mode === "send") {
      if (!f.booking_id) {
        missing.push("Koppla till bokning");
      }
      if (!f.driver_email.trim() || !isEmailLike(f.driver_email.trim())) {
        missing.push("Chaufför: E-post (giltig)");
      }
      if (!f.driver_name.trim()) missing.push("Chaufför: Namn");
      if (!f.vehicle_reg.trim()) missing.push("Tillsätt fordon");
      if (!f.contact_name.trim()) missing.push("Beställare");
      if (
        !f.contact_email.trim() ||
        !isEmailLike(f.contact_email.trim())
      ) {
        missing.push("E-postadress (kund)");
      }
      if (!f.contact_phone.trim()) missing.push("Telefon (kund)");

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
    const outEnd = tidyTime(f.out_end_time || "", "");
    const retTime = tidyTime(f.ret_time || "", "");
    const retEnd = tidyTime(f.ret_end_time || "", "");

    // Samla ihop noteringar + ev. planerad sluttid
    let mergedNotes = f.notes?.trim() || "";
    const extraLines: string[] = [];
    if (outEnd) extraLines.push(`Planerad sluttid utresa: ${outEnd}`);
    if (retEnd) extraLines.push(`Planerad sluttid retur: ${retEnd}`);
    if (extraLines.length) {
      mergedNotes = mergedNotes
        ? `${mergedNotes}\n\n${extraLines.join("\n")}`
        : extraLines.join("\n");
    }

    try {
      const payload: any = {
        status: mode === "draft" || mode === "preview" ? "draft" : "sent",
        booking_id: f.booking_id,
        offer_id: f.offer_id,

        driver_name: f.driver_name || null,
        driver_email: f.driver_email || null,
        vehicle_reg: f.vehicle_reg || null,

        contact_name: f.contact_name || null,
        contact_email: f.contact_email || null,
        contact_phone: f.contact_phone || null,
        passengers: f.passengers ? Number(f.passengers) : null,
        notes: mergedNotes || null,

        out_from: f.out_from || null,
        out_to: f.out_to || null,
        out_date: f.out_date || null,
        out_time: outTime || null,
        end_time: outEnd || null, // extra fält – kan ignoreras av API:t

        ret_from: f.ret_from || null,
        ret_to: f.ret_to || null,
        ret_date: f.ret_date || null,
        ret_time: retTime || null,
        return_end_time: retEnd || null, // extra fält – kan ignoreras av API:t
      };

      const r = await fetch("/api/driver-orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok)
        throw new Error(j?.error || "Kunde inte skapa körorder");

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
        className="w-full border rounded px-3 py-2 text-sm"
        value={f.driver_email}
        onChange={(e) => {
          const opt = drivers.find((d) => d.email === e.target.value);
          upd("driver_email", e.target.value);
          if (opt) upd("driver_name", opt.label);
        }}
        aria-label="Välj chaufför"
      >
        <option value="">-- Välj chaufför --</option>
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
        className="w-full border rounded px-3 py-2 text-sm"
        value={f.vehicle_reg}
        onChange={(e) => upd("vehicle_reg", e.target.value)}
        aria-label="Välj fordon"
      >
        <option value="">-- Välj fordon --</option>
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
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#194C66]">
              Skapa körorder
            </h1>
            {hasReturn && (
              <span className="px-3 py-1 rounded-full bg-[#e5eef3] text-[#194C66] text-sm">
                Tur &amp; retur
              </span>
            )}
          </div>

          {(err || msg) && (
            <div className="space-y-2">
              {err && (
                <div
                  className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm whitespace-pre-line"
                  role="alert"
                  aria-live="assertive"
                >
                  {err}
                </div>
              )}
              {msg && (
                <div
                  className="rounded-lg bg-green-50 border border-green-200 text-green-700 p-3 text-sm"
                  role="status"
                  aria-live="polite"
                >
                  {msg}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vänster: koppling, chaufför/fordon, utresa/retur */}
            <section className="bg-white rounded-xl shadow p-4 space-y-6 lg:col-span-2">
              {/* Koppla bokning */}
              <div>
                <label className="block text-sm text-[#194C66]/80 mb-1">
                  Koppla till bokning <span className="text-red-500">*</span>
                </label>
                <BookingChooser
                  onPick={applyBooking}
                  placeholder="Sök bokning (nummer, kund, från/till)…"
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

              {/* Chaufför + fordon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#194C66]/80 mb-1">
                    Tillsätt chaufför *
                  </label>
                  {driverSelect}
                </div>
                <div>
                  <label className="block text-sm text-[#194C66]/80 mb-1">
                    Tillsätt fordon *
                  </label>
                  {vehicleSelect}
                </div>
              </div>

              {/* Utresa */}
              <div className="pt-2 border-t border-gray-100 space-y-4">
                <h2 className="text-sm font-semibold text-[#194C66] uppercase tracking-wide">
                  Utresa
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Datum *
                    </label>
                    <input
                      type="date"
                      min={todayISO()}
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={f.out_date}
                      onChange={(e) => upd("out_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Starttid *
                    </label>
                    <input
                      type="time"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={f.out_time}
                      onChange={(e) => upd("out_time", e.target.value)}
                      onBlur={(e) =>
                        upd("out_time", tidyTime(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Sluttid (planerad)
                    </label>
                    <input
                      type="time"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={f.out_end_time}
                      onChange={(e) => upd("out_end_time", e.target.value)}
                      onBlur={(e) =>
                        upd(
                          "out_end_time",
                          tidyTime(e.target.value || "", "")
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Antal passagerare
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={f.passengers}
                      inputMode="numeric"
                      onChange={(e) => upd("passengers", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Från *
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Ange en plats"
                      value={f.out_from}
                      onChange={(e) => upd("out_from", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Till *
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Ange en plats"
                      value={f.out_to}
                      onChange={(e) => upd("out_to", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Via
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Ex. hållplatser / stopp"
                      value={"" /* ingen separat via för körorder */}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Retur */}
              <div className="pt-2 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#194C66] uppercase tracking-wide">
                    Returresa (valfritt)
                  </h2>
                  <button
                    type="button"
                    onClick={clearReturn}
                    className="px-3 py-1 border rounded-[20px] text-xs text-[#194C66]"
                  >
                    Rensa retur
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Datum
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={f.ret_date}
                      onChange={(e) => upd("ret_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Starttid
                    </label>
                    <input
                      type="time"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={f.ret_time}
                      onChange={(e) => upd("ret_time", e.target.value)}
                      onBlur={(e) =>
                        upd(
                          "ret_time",
                          tidyTime(e.target.value || "", "")
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Sluttid (planerad)
                    </label>
                    <input
                      type="time"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={f.ret_end_time}
                      onChange={(e) => upd("ret_end_time", e.target.value)}
                      onBlur={(e) =>
                        upd(
                          "ret_end_time",
                          tidyTime(e.target.value || "", "")
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Antal passagerare
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={f.passengers}
                      inputMode="numeric"
                      onChange={(e) => upd("passengers", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Från
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Ange en plats"
                      value={f.ret_from}
                      onChange={(e) => upd("ret_from", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Till
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Ange en plats"
                      value={f.ret_to}
                      onChange={(e) => upd("ret_to", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Via
                    </label>
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Ex. hållplatser / stopp"
                      value={""}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Höger: kunduppgifter + knappar */}
            <section className="bg-white rounded-xl shadow p-4 flex flex-col">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-[#111827] text-white text-[11px]">
                  Kunduppgifter
                </span>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm text-[#194C66]/80 mb-1">
                    Beställare *
                  </label>
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="Förnamn / Efternamn"
                    value={f.contact_name}
                    onChange={(e) => upd("contact_name", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#194C66]/80 mb-1">
                    E-postadress *
                  </label>
                  <input
                    type="email"
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={f.contact_email}
                    onChange={(e) => upd("contact_email", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#194C66]/80 mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={f.contact_phone}
                    onChange={(e) => upd("contact_phone", e.target.value)}
                  />
                </div>

                <div>
                  <p className="block text-sm text-[#194C66]/80 mb-1">
                    Noteringar till chaufför
                  </p>
                  <textarea
                    className="w-full border rounded px-2 py-2 text-sm min-h-[140px]"
                    value={f.notes}
                    onChange={(e) => upd("notes", e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 justify-end">
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
                  className="px-5 py-2 rounded-[25px] bg-[#194C66] text-white text-sm disabled:opacity-60"
                >
                  {loading ? "Skickar…" : "Skapa & skicka körorder"}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
