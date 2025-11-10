// src/pages/admin/offers/[id].tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import AdminMenu from "@/components/AdminMenu";
import OfferCalculator from "@/components/offers/OfferCalculator";

type Offer = {
  id: string;
  offer_number: string | null;
  status: string | null;

  // Kontakt/kund
  customer_reference: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  // Utresa
  departure_place: string | null;
  destination: string | null;
  departure_date: string | null;
  departure_time: string | null;

  // Retur
  return_departure: string | null;
  return_destination: string | null;
  return_date: string | null;
  return_time: string | null;

  // Nya fält (formuläret)
  passengers: number | null;
  stopover_places: string | null;        // via / stopp
  extra_stops: string | null;            // om du skickar separat "stop"
  trip_kind: string | null;              // enkel_tur_retur (t.ex. "enkel" | "tur_ret")
  final_destination: string | null;      // ev. slutmål
  need_bus_on_site: string | null;       // behöver buss på plats?
  site_notes: string | null;             // notis på plats
  base_at_destination: string | null;    // basplats på destinationen
  last_day_on_site: string | null;       // sista dagen (på plats)
  end_time: string | null;               // sluttid
  local_runs: string | null;             // lokala körningar
  standby_hours: string | null;          // väntetid/standby (timmar)
  parking: string | null;                // parkering & tillstånd
  company_name: string | null;           // företag/förening
  po_reference: string | null;           // referens / PO-nummer
  org_number: string | null;             // organisationsnummer
  onboard_contact: string | null;        // kontaktperson ombord
  more_trip_info: string | null;         // mer om resplanen

  notes: string | null;                  // legacy "notes"
};

function toIntOrNull(v: any): number | null {
  if (typeof v === "number") return v;
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Normalisera olika API-svar till Offer */
function normalizeOffer(o: any | null | undefined): Offer | null {
  if (!o) return null;

  return {
    id: o.id,

    offer_number: o.offer_number ?? o.offer_no ?? o.offerId ?? null,
    status: o.status ?? null,

    // Kontakt/kund
    customer_reference:
      o.customer_reference ?? o.reference ?? o.contact_person ?? null,
    contact_email: o.contact_email ?? o.customer_email ?? o.email ?? null,
    contact_phone: o.contact_phone ?? o.customer_phone ?? o.phone ?? null,

    // Utresa
    departure_place: o.departure_place ?? o.from ?? o.departure_location ?? null,
    destination: o.destination ?? o.to ?? o.destination_location ?? null,
    departure_date: o.departure_date ?? o.date ?? null,
    departure_time: o.departure_time ?? o.time ?? null,

    // Retur
    return_departure: o.return_departure ?? o.return_from ?? o.ret_from ?? null,
    return_destination: o.return_destination ?? o.return_to ?? o.ret_to ?? null,
    return_date: o.return_date ?? o.ret_date ?? null,
    return_time: o.return_time ?? o.ret_time ?? null,

    // Nya fält
    passengers: toIntOrNull(o.passengers),
    stopover_places: o.stopover_places ?? o.via ?? null,
    extra_stops: o.stop ?? null,
    trip_kind: o.trip_kind ?? o.enkel_tur_retur ?? null,
    final_destination: o.final_destination ?? null,
    need_bus_on_site: o.need_bus_on_site ?? o.behov_er_buss ?? null,
    site_notes: o.site_notes ?? o.notis_pa_plats ?? null,
    base_at_destination: o.base_at_destination ?? o.basplats_pa_destination ?? null,
    last_day_on_site: o.last_day_on_site ?? o.last_day_ ?? null,
    end_time: o.end_time ?? null,
    local_runs: o.local_runs ?? o.local_kor ?? null,
    standby_hours: o.standby_hours ?? o.standby ?? null,
    parking: o.parking ?? null,
    company_name: o.company_name ?? o.foretag_forening ?? null,
    po_reference: o.po_reference ?? o.referens_po_nummer ?? null,
    org_number: o.org_number ?? null,
    onboard_contact: o.onboard_contact ?? null,
    more_trip_info: o.more_trip_info ?? o.contact_person ?? null, // om legacy fältet råkade användas för "mer info"

    notes: o.notes ?? o.message ?? o.other_info ?? null,
  };
}

/** Hämtar via vårt API (stöder både UUID och offer_number) */
async function fetchOfferById(id: string): Promise<Offer | null> {
  try {
    const res = await fetch(`/api/offers/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const raw = json?.offer ?? json;
    return normalizeOffer(raw);
  } catch {
    return null;
  }
}

export default function AdminOfferDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const off = await fetchOfferById(id);
        if (cancelled) return;
        if (!off) throw new Error("Kunde inte hämta offerten (API).");
        setOffer(off);
      } catch (e: any) {
        setError(e?.message || "Kunde inte hämta offerten");
        setOffer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const titleSuffix = offer?.offer_number ? ` (${offer.offer_number})` : "";
  const hasReturn =
    !!(offer?.return_departure ||
       offer?.return_destination ||
       offer?.return_date ||
       offer?.return_time);

  // OfferCalculator behöver dessa tre:
  const calculatorProps =
    offer
      ? {
          offerId: offer.id,
          offerNumber: offer.offer_number ?? "",
          customerEmail: offer.contact_email ?? "",
        }
      : null;

  async function createBookingFromOffer() {
    if (!offer?.id) return;
    const ok = confirm("Skapa bokning från denna offert?");
    if (!ok) return;

    try {
      setCreating(true);
      const r = await fetch("/api/bookings/from-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: offer.id }),
      });
      const j = await r.json().catch(() => ({} as any));
      if (!r.ok) throw new Error(j?.error || "Kunde inte skapa bokning.");
      alert(`Bokning skapad (${j.booking?.booking_number || "BK…"})`);
      router.push("/admin/bookings");
    } catch (e: any) {
      alert(e?.message || "Ett fel uppstod vid skapande av bokning.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <AdminMenu />
      <div className="min-h-screen bg-[#f5f4f0] lg:pl-64">
        <Header />

        <main className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#194C66]">
              Besvara offert{titleSuffix}
            </h1>

            {offer && (
              <button
                onClick={createBookingFromOffer}
                disabled={creating}
                className={`px-4 py-2 rounded-[25px] text-sm text-white ${creating ? "bg-gray-400 cursor-not-allowed" : "bg-[#194C66]"}`}
              >
                {creating ? "Skapar…" : "Skapa bokning"}
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            {loading && <div>Laddar…</div>}
            {!loading && error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3">
                Fel: {error}
              </div>
            )}
            {!loading && !error && !offer && <div>Ingen offert hittades.</div>}

            {!loading && offer && (
              <div className="space-y-6">
                {/* Grundinfo */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Offert</div>
                    <div className="text-[#194C66]">
                      <div>
                        <span className="font-semibold">Offert-ID:</span>{" "}
                        {offer.offer_number || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Status:</span>{" "}
                        {offer.status || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Typ av resa:</span>{" "}
                        {offer.trip_kind || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Kund</div>
                    <div className="text-[#194C66]">
                      <div>
                        <span className="font-semibold">Kontakt:</span>{" "}
                        {offer.customer_reference || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">E-post:</span>{" "}
                        {offer.contact_email || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Telefon:</span>{" "}
                        {offer.contact_phone || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Företag/Förening:</span>{" "}
                        {offer.company_name || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Ref/PO-nummer:</span>{" "}
                        {offer.po_reference || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Organisationsnummer:</span>{" "}
                        {offer.org_number || "—"}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Reseinfo utresa */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">
                      Reseinformation
                    </div>
                    <div className="text-[#194C66]">
                      <div>
                        <span className="font-semibold">Från:</span>{" "}
                        {offer.departure_place || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Till:</span>{" "}
                        {offer.destination || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Slutmål:</span>{" "}
                        {offer.final_destination || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Datum:</span>{" "}
                        {offer.departure_date || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Tid:</span>{" "}
                        {offer.departure_time || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Passagerare:</span>{" "}
                        {offer.passengers ?? "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Via / stopp:</span>{" "}
                        {offer.stopover_places || offer.extra_stops || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Kontakt ombord:</span>{" "}
                        {offer.onboard_contact || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Plats & logistik</div>
                    <div className="text-[#194C66]">
                      <div>
                        <span className="font-semibold">Behöver ni bussen på plats?</span>{" "}
                        {offer.need_bus_on_site || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Notis på plats:</span>{" "}
                        {offer.site_notes || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Basplats på destinationen:</span>{" "}
                        {offer.base_at_destination || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Sista dagen (på plats):</span>{" "}
                        {offer.last_day_on_site || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Sluttid:</span>{" "}
                        {offer.end_time || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Lokala körningar:</span>{" "}
                        {offer.local_runs || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Väntetid / standby (timmar):</span>{" "}
                        {offer.standby_hours || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Parkering & tillstånd:</span>{" "}
                        {offer.parking || "—"}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Reseinfo retur */}
                {hasReturn && (
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#f8fafc] rounded-lg p-4">
                      <div className="text-sm text-[#194C66]/70 mb-1">Retur</div>
                      <div className="text-[#194C66]">
                        <div>
                          <span className="font-semibold">Från:</span>{" "}
                          {offer.return_departure || "—"}
                        </div>
                        <div>
                          <span className="font-semibold">Till:</span>{" "}
                          {offer.return_destination || "—"}
                        </div>
                        <div>
                          <span className="font-semibold">Datum:</span>{" "}
                          {offer.return_date || "—"}
                        </div>
                        <div>
                          <span className="font-semibold">Tid:</span>{" "}
                          {offer.return_time || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#f8fafc] rounded-lg p-4 hidden md:block" />
                  </section>
                )}

                {/* Övrigt */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Övrig information</div>
                    <div className="text-[#194C66] whitespace-pre-wrap">
                      {offer.notes || "Ingen information."}
                    </div>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-sm text-[#194C66]/70 mb-1">Mer om resplanen</div>
                    <div className="text-[#194C66] whitespace-pre-wrap">
                      {offer.more_trip_info || "—"}
                    </div>
                  </div>
                </section>

                {/* Kalkyl (din komponent) */}
                <section className="bg-white border rounded-lg p-4">
                  <div className="text-[#194C66] font-semibold mb-3">Kalkyl</div>
                  {calculatorProps ? (
                    <OfferCalculator
                      offerId={calculatorProps.offerId}
                      offerNumber={calculatorProps.offerNumber}
                      customerEmail={calculatorProps.customerEmail}
                    />
                  ) : (
                    <div className="text-[#194C66]/70">Väntar på offertdata…</div>
                  )}
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
