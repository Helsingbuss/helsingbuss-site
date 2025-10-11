// src/pages/offert/[id].tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import AdminMenu from "@/components/AdminMenu";
import Header from "@/components/Header";
import LegCalcCard from "@/components/offers/LegCalcCard";
import { calcQuote, type LegInput, type QuoteInput } from "@/lib/pricing";

type Offer = {
  id: string;
  offer_number: string | null;
  customer_reference: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  departure_place: string | null;
  destination: string | null;
  return_departure: string | null;
  return_destination: string | null;
  passengers: number | null;
  status: string | null;
};

export default function BesvaraOffert() {
  const router = useRouter();
  const { id } = router.query;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  // 1 eller 2 sträckor beroende på om retur finns
  const [leg1, setLeg1] = useState<LegInput>({
    isDomestic: true,
    km: 0,
    hoursDay: 0,
    hoursEvening: 0,
    hoursWeekend: 0,
    discount: 0,
  });
  const [leg2, setLeg2] = useState<LegInput>({
    isDomestic: true,
    km: 0,
    hoursDay: 0,
    hoursEvening: 0,
    hoursWeekend: 0,
    discount: 0,
  });
  const [serviceFee, setServiceFee] = useState<number>(0);

  // Hämta order
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("offers")
        .select(
          "id, offer_number, customer_reference, contact_person, contact_email, contact_phone, departure_place, destination, return_departure, return_destination, passengers, status"
        )
        .eq("id", id)
        .maybeSingle();
      if (!error) setOffer(data as any);
      setLoading(false);
    })();
  }, [id]);

  const hasReturn =
    !!offer?.return_departure || !!offer?.return_destination;

  const quoteInput: QuoteInput = useMemo(
    () => ({
      serviceFee,
      legs: hasReturn ? [leg1, leg2] : [leg1],
    }),
    [serviceFee, hasReturn, leg1, leg2]
  );

  const quote = useMemo(() => calcQuote(quoteInput), [quoteInput]);

  async function saveDraft() {
    if (!offer) return;
    await fetch(`/api/offers/${offer.id}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "draft",
        input: quoteInput,
        breakdown: quote,
      }),
    });
    // stanna kvar
  }

  async function sendQuote() {
    if (!offer) return;
    await fetch(`/api/offers/${offer.id}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "send",
        input: quoteInput,
        breakdown: quote,
      }),
    });
    // Tillbaka till start, då tabellen uppdateras
    router.push("/start");
  }

  if (loading) {
    return (
      <>
        <AdminMenu />
        <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
          <Header />
          <main className="p-6">Laddar offert…</main>
        </div>
      </>
    );
  }

  if (!offer) {
    return (
      <>
        <AdminMenu />
        <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
          <Header />
          <main className="p-6">Kunde inte hitta offerten.</main>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />
        <main className="p-6 space-y-6">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-xl font-semibold text-[#194C66]">
                Offertförfrågan [{offer.offer_number ?? "—"}]
              </h1>
              <div className="text-sm text-[#194C66]/70">
                Status: {offer.status ?? "okänd"}
              </div>
            </div>

            {/* Kund & faktaruta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-[#f9fafb] rounded-xl p-3">
                <div className="font-semibold text-[#194C66] mb-2">
                  Offertinfo
                </div>
                <div className="text-sm text-[#194C66]/80 space-y-1">
                  <div>
                    <span className="font-medium">Avresa:</span>{" "}
                    {offer.departure_place ?? "—"} → {offer.destination ?? "—"}
                  </div>
                  {hasReturn && (
                    <div>
                      <span className="font-medium">Retur:</span>{" "}
                      {offer.return_departure ?? "—"} →{" "}
                      {offer.return_destination ?? "—"}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Antal passagerare:</span>{" "}
                    {offer.passengers ?? "—"}
                  </div>
                </div>
              </div>

              <div className="bg-[#f9fafb] rounded-xl p-3">
                <div className="font-semibold text-[#194C66] mb-2">
                  Kunduppgifter
                </div>
                <div className="text-sm text-[#194C66]/80 space-y-1">
                  <div>
                    <span className="font-medium">Kontakt:</span>{" "}
                    {offer.contact_person ?? offer.customer_reference ?? "—"}
                  </div>
                  <div>
                    <span className="font-medium">E-post:</span>{" "}
                    {offer.contact_email ?? "—"}
                  </div>
                  <div>
                    <span className="font-medium">Telefon:</span>{" "}
                    {offer.contact_phone ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inmatningskort */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LegCalcCard title="Beräkning – Sträcka 1" value={leg1} onChange={setLeg1} />
            {hasReturn && (
              <LegCalcCard title="Beräkning – Sträcka 2" value={leg2} onChange={setLeg2} />
            )}
          </div>

          {/* Serviceavgift + summering */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-[#194C66] font-semibold mb-2">Serviceavgift</div>
              <label className="text-sm text-[#194C66]/80">
                <span className="block mb-1">Serviceavgift (exkl. moms)</span>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(Number(e.target.value) || 0)}
                  className="w-full border rounded px-2 py-1"
                />
              </label>
            </div>

            <div className="md:col-span-2 bg-white rounded-xl shadow p-4">
              <div className="text-[#194C66] font-semibold mb-2">Summering</div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <KPI label="Pris exkl. moms" value={quote.grandExVat} />
                <KPI label="Moms" value={quote.grandVat} />
                <KPI label="Totalsumma" value={quote.grandTotal} />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={saveDraft}
                  className="px-4 py-2 rounded-[25px] bg-[#E5EEF3] text-[#194C66] text-sm font-medium"
                >
                  Spara utkast
                </button>
                <button
                  onClick={sendQuote}
                  className="px-4 py-2 rounded-[25px] bg-[#194C66] text-white text-sm font-medium"
                >
                  Skicka prisförslag
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#f9fafb] rounded-lg p-3">
      <div className="text-xs text-[#194C66]/70">{label}</div>
      <div className="text-lg font-semibold text-[#194C66]">
        {value.toLocaleString("sv-SE", { style: "currency", currency: "SEK" })}
      </div>
    </div>
  );
}
