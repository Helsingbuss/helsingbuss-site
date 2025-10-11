// src/components/offers/OfferCalculator.tsx
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  offerNumber?: string | null;  // t.ex. HB25007
  customerEmail?: string | null;
};

type Pricing = {
  kmPrice: number;        // kr/km (exkl moms)
  dayHour: number;        // kr/timme dag (exkl moms)
  eveHour: number;        // kr/timme kväll (exkl moms)
  wkndHour: number;       // kr/timme helg (exkl moms)
  serviceFee: number;     // kr (exkl moms)
  includeService: boolean;
  vatRate: number;        // 0.06 eller 0.0
};

const LOCAL_KEY = "hb_pricing_defaults_v1";

const DEFAULTS: Pricing = {
  kmPrice: 10.9,
  dayHour: 300,
  eveHour: 345,
  wkndHour: 395,
  serviceFee: 1800,
  includeService: true,
  vatRate: 0.06, // Sverige 6% default
};

export default function OfferCalculator({ offerNumber, customerEmail }: Props) {
  const [pricing, setPricing] = useState<Pricing>(DEFAULTS);
  const [km, setKm] = useState<number>(0);
  const [hDay, setHDay] = useState<number>(0);
  const [hEve, setHEve] = useState<number>(0);
  const [hWknd, setHWknd] = useState<number>(0);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<string>("");

  // Ladda sparade standardvärden
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Pricing>;
        setPricing((p) => ({ ...p, ...parsed }));
      }
    } catch {}
  }, []);

  // Beräkningar
  const subtotalEx = useMemo(() => {
    const base =
      km * pricing.kmPrice +
      hDay * pricing.dayHour +
      hEve * pricing.eveHour +
      hWknd * pricing.wkndHour;
    const svc = pricing.includeService ? pricing.serviceFee : 0;
    return Math.max(0, base + svc);
  }, [km, hDay, hEve, hWknd, pricing]);

  const vatAmount = useMemo(
    () => Math.round(subtotalEx * pricing.vatRate * 100) / 100,
    [subtotalEx, pricing.vatRate]
  );
  const totalInc = useMemo(
    () => Math.round((subtotalEx + vatAmount) * 100) / 100,
    [subtotalEx, vatAmount]
  );

  function updatePricing<K extends keyof Pricing>(key: K, val: number | boolean) {
    setPricing((p) => ({ ...p, [key]: val } as Pricing));
  }

  function saveAsDefault() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(pricing));
  }

  async function sendProposal() {
    if (!offerNumber || !customerEmail) return;
    try {
      setSending(true);
      const payload = {
        offerNumber,
        customerEmail,
        pricing,
        input: { km, hDay, hEve, hWknd, note },
        totals: {
          subtotalEx,
          vat: vatAmount,
          totalInc,
        },
      };
      const res = await fetch("/api/offers/send-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Misslyckades att skicka");
      alert("Prisförslaget skickades till kunden 🎉");
    } catch (e: any) {
      alert(e?.message || "Kunde inte skicka prisförslaget");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Rad: Standardpriser */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <FieldNumber
          label="Kilometerpris (kr/km)"
          value={pricing.kmPrice}
          onChange={(v) => updatePricing("kmPrice", v)}
        />
        <FieldNumber
          label="Timpris dag (kr/tim)"
          value={pricing.dayHour}
          onChange={(v) => updatePricing("dayHour", v)}
        />
        <FieldNumber
          label="Timpris kväll (kr/tim)"
          value={pricing.eveHour}
          onChange={(v) => updatePricing("eveHour", v)}
        />
        <FieldNumber
          label="Timpris helg (kr/tim)"
          value={pricing.wkndHour}
          onChange={(v) => updatePricing("wkndHour", v)}
        />
        <FieldNumber
          label="Serviceavgift (kr)"
          value={pricing.serviceFee}
          onChange={(v) => updatePricing("serviceFee", v)}
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-[#194C66]">
          <input
            type="checkbox"
            checked={pricing.includeService}
            onChange={(e) => updatePricing("includeService", e.target.checked)}
          />
          Ta med serviceavgift (förvalt på)
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[#194C66]/80 text-sm">Moms:</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={pricing.vatRate}
            onChange={(e) => updatePricing("vatRate", Number(e.target.value))}
          >
            <option value={0.06}>6% (Sverige)</option>
            <option value={0}>0% (Utomlands)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={saveAsDefault}
          className="ml-auto h-9 px-3 rounded bg-[#194C66] text-white text-sm"
          title="Spara som standard så ligger dina priser kvar nästa gång"
        >
          Spara som standard
        </button>
      </div>

      {/* Rad: Mängder */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <FieldNumber label="Kilometer" value={km} onChange={setKm} />
        <FieldNumber label="Timmar dag" value={hDay} onChange={setHDay} />
        <FieldNumber label="Timmar kväll" value={hEve} onChange={setHEve} />
        <FieldNumber label="Timmar helg" value={hWknd} onChange={setHWknd} />
      </div>

      <div>
        <label className="block text-sm text-[#194C66]/70 mb-1">Intern anteckning (valfritt)</label>
        <textarea
          className="w-full border rounded px-3 py-2 text-sm"
          rows={2}
          placeholder="T.ex. 'Önskar toalett ombord' eller annan notering för prisförslaget"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {/* Summering */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryItem label="Pris exkl. moms" value={subtotalEx} />
        <SummaryItem label="Moms" value={vatAmount} />
        <SummaryItem label="Totalsumma" value={totalInc} strong />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="h-10 px-4 rounded bg-[#194C66] text-white text-sm disabled:opacity-50"
          onClick={sendProposal}
          disabled={!offerNumber || !customerEmail || sending}
          title={!offerNumber || !customerEmail ? "Saknar offertnummer eller kundens e-post" : ""}
        >
          {sending ? "Skickar…" : "Skicka prisförslag"}
        </button>
      </div>
    </div>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-[#194C66]/70 mb-1">{label}</span>
      <input
        type="number"
        step="0.01"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full border rounded px-3 py-2 text-sm"
      />
    </label>
  );
}

function SummaryItem({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="bg-[#f8fafc] rounded-lg p-3">
      <div className="text-xs text-[#194C66]/70 mb-1">{label}</div>
      <div className={`text-[#194C66] ${strong ? "font-semibold text-lg" : ""}`}>
        {value.toLocaleString("sv-SE", { style: "currency", currency: "SEK" })}
      </div>
    </div>
  );
}
