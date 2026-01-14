// src/pages/admin/offers/new.tsx
import { useMemo, useState } from "react";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";

type Leg = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  from: string;
  to: string;
  via: string;
  passengers?: number | null;
  onboardContact?: string;
  notes?: string;
};

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const svValidation = {
  required: "Detta fält är obligatoriskt",
  email: "Ange en giltig e-postadress",
  numberMin1: "Ange minst 1 passagerare",
  phone: "Ange ett giltigt telefonnummer (t.ex. +46 70 123 45 67)",
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^(?:\+?[1-9]\d{1,14}|0\d{6,14})$/; // enkel E.164/SE-tolerant

export default function NewOfferAdmin() {
  // Visuell placeholder – det riktiga numret skapas i API:et
  const nextUiId = useMemo(() => `HB25${"00XX"}`, []);

  // Körning (utkastrad) + lista
  const [draftLeg, setDraftLeg] = useState<Leg>({
    date: todayISO(),
    time: "08:00",
    from: "",
    to: "",
    via: "",
    passengers: undefined,
    onboardContact: "",
    notes: "",
  });

  const [legs, setLegs] = useState<Leg[]>([]);
  const isRoundTrip = legs.length >= 2; // används bara för "Tur & retur"-chip

  const [legErrors, setLegErrors] = useState<
    Partial<Record<keyof Leg, string>>
  >({});

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Kunduppgifter
  const [customerType, setCustomerType] = useState<
    "privat" | "forening" | "foretag"
  >("privat");
  const [customerReference, setCustomerReference] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");

  // Övrig information + meddelande från trafikledningen
  const [freeNotes, setFreeNotes] = useState("");
  const [trafficMessage, setTrafficMessage] = useState("");

  // Fel för kunddelen
  const [step2Errors, setStep2Errors] = useState<
    Partial<Record<"ref" | "email" | "phone", string>>
  >({});

  /* ================= VALIDERING ================= */

  function validateDraft(): boolean {
    const errs: Partial<Record<keyof Leg, string>> = {};
    const pax = Number(draftLeg.passengers ?? 0);

    if (!draftLeg.date) errs.date = svValidation.required;
    if (!draftLeg.time || draftLeg.time.length < 4)
      errs.time = svValidation.required;
    if (!draftLeg.from.trim()) errs.from = svValidation.required;
    if (!draftLeg.to.trim()) errs.to = svValidation.required;
    if (!pax || pax < 1) errs.passengers = svValidation.numberMin1;

    setLegErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateCustomer(): boolean {
    const errs: Partial<Record<"ref" | "email" | "phone", string>> = {};
    if (!customerReference.trim()) errs.ref = svValidation.required;
    if (!email.trim() || !emailRe.test(email.trim()))
      errs.email = svValidation.email;
    if (!phone.trim() || !phoneRe.test(phone.trim()))
      errs.phone = svValidation.phone;
    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ================= KÖRNINGAR ================= */

  const addLeg = () => {
    if (!validateDraft()) return;

    // ❌ tidigare spärrade vi vid 2 rader – nu tillåts hur många som helst
    setSubmitError(null);
    setLegs((prev) => [...prev, { ...draftLeg }]);

    // Reset för nästa rad (behåll passagerare + kontakt)
    setDraftLeg({
      date: todayISO(),
      time: "08:00",
      from: "",
      to: "",
      via: "",
      passengers: draftLeg.passengers,
      onboardContact: draftLeg.onboardContact,
      notes: "",
    });
    setLegErrors({});
  };

  const removeLeg = (idx: number) =>
    setLegs((prev) => prev.filter((_, i) => i !== idx));

  /* ================= SUBMIT ================= */

  function tidyTime(t?: string | null) {
    if (!t) return null;
    // Säkerställ "HH:MM"
    return t.length === 5
      ? t
      : t.length >= 4
      ? `${t.slice(0, 2)}:${t.slice(2, 4)}`
      : null;
  }

  async function handleSubmit() {
    setSubmitError(null);

    // Måste finnas minst en körning
    if (legs.length === 0) {
      setSubmitError("Lägg till minst en körning innan du skickar offerten.");
      return;
    }

    if (!validateCustomer()) return;

    const leg1 = legs[0];
    const leg2 = legs[1]; // retur (valfri)

    // Trimma alla strängar
    const _trim = (v?: string | null) =>
      v == null ? null : v.toString().trim() || null;

    // Sätt ihop Övrig information + Meddelande från trafikledningen
    let notesParts: string[] = [];
    if (freeNotes.trim()) notesParts.push(freeNotes.trim());
    if (trafficMessage.trim())
      notesParts.push(
        `Meddelande från trafikledningen:\n${trafficMessage.trim()}`
      );

    // Lägg in extra körningar (utöver första två) som text så inget tappas bort
    if (legs.length > 2) {
      const extra = legs.slice(2).map((l, idx) => {
        const base = `${idx + 3}. ${l.date} ${l.time} – ${l.from} → ${l.to}`;
        const viaText = l.via ? ` via ${l.via}` : "";
        const paxText =
          l.passengers && Number(l.passengers) > 0
            ? ` (${l.passengers} pax)`
            : "";
        return base + viaText + paxText;
      });
      if (extra.length) {
        notesParts.push("Extra körningar:\n" + extra.join("\n"));
      }
    }

    const finalNotes = notesParts.length ? notesParts.join("\n\n") : null;

    // Skicka med ALLA körningar i en legs-array också (för framtida stöd i API/DB)
    const legsPayload = legs.map((l) => {
      const pax = Number(l.passengers ?? 0);
      return {
        date: _trim(l.date),
        time: tidyTime(_trim(l.time)) ?? _trim(l.time),
        from: _trim(l.from),
        to: _trim(l.to),
        via: _trim(l.via),
        passengers: pax > 0 ? pax : null,
        onboardContact: _trim(l.onboardContact ?? null),
        notes: _trim(l.notes ?? null),
      };
    });

    const payload = {
      // kontakt (sparas konsekvent i DB)
      contact_person: _trim(customerReference),
      customer_email: _trim(email),
      customer_phone: _trim(phone),

      // sparas även som kundreferens
      customer_reference:
        _trim(leg1?.onboardContact) || _trim(customerReference),

      // övrigt kund
      customer_name: _trim(customerReference),
      customer_type:
        customerType === "privat"
          ? "privat"
          : customerType === "forening"
          ? "förening"
          : "företag",
      invoice_ref: _trim(invoiceRef),

      // primär sträcka (för bakåt-kompatibilitet)
      passengers: Number(leg1?.passengers ?? 0),
      departure_place: _trim(leg1?.from),
      destination: _trim(leg1?.to),
      departure_date: _trim(leg1?.date),
      departure_time: tidyTime(_trim(leg1?.time)),
      stopover_places: _trim(leg1?.via),

      // retur (om rad 2 finns)
      return_departure: _trim(leg2?.from || null),
      return_destination: _trim(leg2?.to || null),
      return_date: _trim(leg2?.date || null),
      return_time: tidyTime(_trim(leg2?.time || null)),

      // övrigt
      notes: finalNotes,

      // 🔹 NYTT: alla körningar skickas med som egen lista
      legs: legsPayload,
    };

    try {
      const res = await fetch("/api/offert/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        const msg: string =
          j?.error ||
          "Kunde inte skapa offert. Försök igen eller kontakta administratör.";

        if (String(msg).toLowerCase().includes("next_offer_serial")) {
          setSubmitError(
            "Kunde inte generera offertnummer (saknas DB-funktion next_offer_serial)."
          );
        } else {
          setSubmitError(msg);
        }
        setSubmitting(false);
        return;
      }

      const j = await res.json();
      const offerId = j?.offer?.id ?? j?.id ?? j?.offer_id ?? null;

      if (!offerId) {
        setSubmitError(
          "Kunde inte läsa svaret (saknar offer.id). Offerten kan vara skapad – kontrollera Offertlistan."
        );
        setSubmitting(false);
        return;
      }

      window.location.href = `/admin/offers/${offerId}`;
    } catch (e: any) {
      setSubmitError(e?.message || "Nätverksfel. Försök igen.");
      setSubmitting(false);
    }
  }

  const canSubmit = legs.length > 0 && !submitting;

  /* ================= RENDER ================= */

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="p-6 space-y-6">
          {/* Titelrad */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#194C66]">
              Skapa offertförfrågan{" "}
              <span className="text-[#194C66]/60 font-normal">
                ID ({nextUiId})
              </span>
            </h1>
            {isRoundTrip && (
              <span className="px-3 py-1 rounded-full bg-[#e5eef3] text-[#194C66] text-sm">
                Tur &amp; retur
              </span>
            )}
          </div>

          {/* Felbanner (både validering + API) */}
          {submitError && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
              {submitError}
            </div>
          )}

          {/* Övre två rutor – Körningar + Kunduppgifter */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* KÖRNINGAR – vänster, 2 kolumner */}
            <section className="bg-white rounded-xl shadow p-4 space-y-4 lg:col-span-2">
              <div className="mb-1">
                <span className="inline-block px-3 py-1 rounded-full bg-[#111827] text-white text-[11px]">
                  Körningar
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vänster kolumn */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Avresa *
                    </label>
                    <input
                      type="date"
                      value={draftLeg.date}
                      min={todayISO()}
                      onChange={(e) =>
                        setDraftLeg({ ...draftLeg, date: e.target.value })
                      }
                      className="w-full border rounded px-2 py-1 text-sm"
                      aria-invalid={!!legErrors.date}
                    />
                    {legErrors.date && (
                      <p className="text-xs text-red-600 mt-1">
                        {legErrors.date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Klockan *
                    </label>
                    <input
                      type="time"
                      value={draftLeg.time}
                      onChange={(e) =>
                        setDraftLeg({ ...draftLeg, time: e.target.value })
                      }
                      className="w-full border rounded px-2 py-1 text-sm"
                      aria-invalid={!!legErrors.time}
                    />
                    {legErrors.time && (
                      <p className="text-xs text-red-600 mt-1">
                        {legErrors.time}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Antal passagerare *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={draftLeg.passengers ?? ""}
                      onChange={(e) =>
                        setDraftLeg({
                          ...draftLeg,
                          passengers: Number(e.target.value) || 0,
                        })
                      }
                      onKeyDown={(e) => e.key === "Enter" && addLeg()}
                      className="w-full border rounded px-2 py-1 text-sm"
                      aria-invalid={!!legErrors.passengers}
                    />
                    {legErrors.passengers && (
                      <p className="text-xs text-red-600 mt-1">
                        {legErrors.passengers}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mitten kolumn */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Från *
                    </label>
                    <input
                      type="text"
                      value={draftLeg.from}
                      onChange={(e) =>
                        setDraftLeg({ ...draftLeg, from: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && addLeg()}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Ange en plats"
                      aria-invalid={!!legErrors.from}
                    />
                    {legErrors.from && (
                      <p className="text-xs text-red-600 mt-1">
                        {legErrors.from}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Via
                    </label>
                    <input
                      type="text"
                      value={draftLeg.via}
                      onChange={(e) =>
                        setDraftLeg({ ...draftLeg, via: e.target.value })
                      }
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Ex. hållplatser / stopp"
                    />
                  </div>
                </div>

                {/* Höger kolumn */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Till *
                    </label>
                    <input
                      type="text"
                      value={draftLeg.to}
                      onChange={(e) =>
                        setDraftLeg({ ...draftLeg, to: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && addLeg()}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Ange en plats"
                      aria-invalid={!!legErrors.to}
                    />
                    {legErrors.to && (
                      <p className="text-xs text-red-600 mt-1">
                        {legErrors.to}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-[#194C66]/80 mb-1">
                      Kontaktperson ombord
                    </label>
                    <input
                      type="text"
                      value={draftLeg.onboardContact}
                      onChange={(e) =>
                        setDraftLeg({
                          ...draftLeg,
                          onboardContact: e.target.value,
                        })
                      }
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Namn, nummer"
                    />
                  </div>
                </div>
              </div>

              {/* Övrig information */}
              <div>
                <label className="block text-sm text-[#194C66]/80 mb-1">
                  Övrig information
                </label>
                <textarea
                  value={freeNotes}
                  onChange={(e) => setFreeNotes(e.target.value)}
                  className="w-full border rounded px-2 py-2 min-h-[90px] text-sm"
                />
              </div>

              {/* Meddelande från trafikledningen */}
              <div>
                <label className="block text-sm text-[#194C66]/80 mb-1">
                  Meddelande från trafikledningen
                </label>
                <textarea
                  value={trafficMessage}
                  onChange={(e) => setTrafficMessage(e.target.value)}
                  className="w-full border rounded px-2 py-2 min-h-[90px] text-sm"
                />
              </div>

              {/* Lägg till rad-knapp */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addLeg}
                  className="px-4 py-2 rounded-[25px] bg-[#111827] text-white text-xs sm:text-sm"
                  title="Lägg till körning"
                >
                  + Lägg till rad
                </button>
              </div>
            </section>

            {/* KUNDUPPGIFTER – höger */}
            <section className="bg-white rounded-xl shadow p-4 flex flex-col">
              <div className="mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-[#111827] text-white text-[11px]">
                  Kunduppgifter
                </span>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <p className="block text-sm text-[#194C66]/80 mb-1">
                    Typ av kund *
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-4 w-4"
                        checked={customerType === "privat"}
                        onChange={() => setCustomerType("privat")}
                      />
                      Privatperson
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-4 w-4"
                        checked={customerType === "forening"}
                        onChange={() => setCustomerType("forening")}
                      />
                      Förening
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        className="h-4 w-4"
                        checked={customerType === "foretag"}
                        onChange={() => setCustomerType("foretag")}
                      />
                      Företag
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#194C66]/80 mb-1">
                    Referens *
                  </label>
                  <input
                    value={customerReference}
                    onChange={(e) => {
                      setCustomerReference(e.target.value);
                      setStep2Errors((s) => ({ ...s, ref: "" }));
                    }}
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="Förnamn / Efternamn"
                    aria-invalid={!!step2Errors.ref}
                  />
                  {step2Errors.ref && (
                    <p className="text-xs text-red-600 mt-1">
                      {step2Errors.ref}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-[#194C66]/80 mb-1">
                    E-postadress *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setStep2Errors((s) => ({ ...s, email: "" }));
                    }}
                    className="w-full border rounded px-2 py-1 text-sm"
                    aria-invalid={!!step2Errors.email}
                  />
                  {step2Errors.email && (
                    <p className="text-xs text-red-600 mt-1">
                      {step2Errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-[#194C66]/80 mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setStep2Errors((s) => ({ ...s, phone: "" }));
                    }}
                    className="w-full border rounded px-2 py-1 text-sm"
                    aria-invalid={!!step2Errors.phone}
                  />
                  {step2Errors.phone && (
                    <p className="text-xs text-red-600 mt-1">
                      {step2Errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-[#194C66]/80 mb-1">
                    Fakturareferens / ansvarskod
                  </label>
                  <input
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>

              {/* Skicka-knappen längst ned till höger i kortet */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="px-4 py-2 rounded-[25px] bg-[#111827] text-white text-xs sm:text-sm disabled:opacity-50"
                >
                  {submitting ? "Skickar…" : "Skicka offert till kund"}
                </button>
              </div>
            </section>
          </div>

          {/* NEDRE TABELLEN */}
          <section className="bg-white rounded-xl shadow p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#e5eef3] text-[#194C66]">
                  <tr>
                    <th className="text-left px-3 py-2">Avresa</th>
                    <th className="text-left px-3 py-2">Klockan</th>
                    <th className="text-left px-3 py-2">Från</th>
                    <th className="text-left px-3 py-2">Via</th>
                    <th className="text-left px-3 py-2">Till</th>
                    <th className="text-left px-3 py-2">Passagerare</th>
                    <th className="text-left px-3 py-2">Kontaktperson</th>
                    <th className="text-right px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {legs.map((l, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 py-2">{l.date}</td>
                      <td className="px-3 py-2">{l.time}</td>
                      <td className="px-3 py-2">{l.from}</td>
                      <td className="px-3 py-2">{l.via}</td>
                      <td className="px-3 py-2">{l.to}</td>
                      <td className="px-3 py-2">{l.passengers ?? "—"}</td>
                      <td className="px-3 py-2">
                        {l.onboardContact || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLeg(i)}
                          className="text-[#194C66] underline text-xs"
                        >
                          Ta bort
                        </button>
                      </td>
                    </tr>
                  ))}
                  {legs.length === 0 && (
                    <tr>
                      <td
                        className="px-3 py-4 text-[#194C66]/60"
                        colSpan={8}
                      >
                        Inga körningar tillagda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
