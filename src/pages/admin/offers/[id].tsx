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
  stopover_places: string | null; // via / stopp
  extra_stops: string | null; // separat "stop"
  trip_kind: string | null; // enkel_tur_retur
  final_destination: string | null;
  need_bus_on_site: string | null;
  site_notes: string | null;
  base_at_destination: string | null;
  last_day_on_site: string | null;
  end_time: string | null;
  local_runs: string | null;
  standby_hours: string | null;
  parking: string | null;
  company_name: string | null;
  po_reference: string | null;
  org_number: string | null;
  onboard_contact: string | null;
  more_trip_info: string | null;

  notes: string | null;
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
    departure_place:
      o.departure_place ?? o.from ?? o.departure_location ?? null,
    destination: o.destination ?? o.to ?? o.destination_location ?? null,
    departure_date: o.departure_date ?? o.date ?? null,
    departure_time: o.departure_time ?? o.time ?? null,

    // Retur
    return_departure:
      o.return_departure ?? o.return_from ?? o.ret_from ?? null,
    return_destination:
      o.return_destination ?? o.return_to ?? o.ret_to ?? null,
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
    more_trip_info: o.more_trip_info ?? o.contact_person ?? null,

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
    !!(
      offer?.return_departure ||
      offer?.return_destination ||
      offer?.return_date ||
      offer?.return_time
    );

  const calculatorProps =
    offer && offer.contact_email
      ? {
          offerId: offer.id,
          offerNumber: offer.offer_number ?? "",
          customerEmail: offer.contact_email,
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

        <main className="px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-5">
            {/* Titelrad */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-[#194C66]">
                  Besvara offert{titleSuffix}
                </h1>
                {offer?.status && (
                  <p className="text-sm text-slate-600">
                    Status: <span className="font-medium">{offer.status}</span>
                  </p>
                )}
              </div>

              {offer && (
                <button
                  onClick={createBookingFromOffer}
                  disabled={creating}
                  className={`px-4 py-2 rounded-full text-sm font-medium text-white ${
                    creating ? "bg-gray-400 cursor-not-allowed" : "bg-[#194C66]"
                  }`}
                >
                  {creating ? "Skapar…" : "Skapa bokning"}
                </button>
              )}
            </div>

            {/* Fel / laddning */}
            {loading && (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                Laddar offert…
              </div>
            )}

            {!loading && error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Fel: {error}
              </div>
            )}

            {!loading && !error && !offer && (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                Ingen offert hittades.
              </div>
            )}

            {!loading && offer && (
              <>
                {/* Översta infokorten – liknande stil som skapa offert */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Offert-info */}
                  <section className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[#194C66]/70">
                      Offert
                    </h2>
                    <dl className="mt-3 space-y-1 text-sm text-[#194C66]">
                      <div className="flex gap-2">
                        <dt className="w-32 font-medium">Offert-ID:</dt>
                        <dd>{offer.offer_number || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-32 font-medium">Typ av resa:</dt>
                        <dd>{offer.trip_kind || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-32 font-medium">Passagerare:</dt>
                        <dd>{offer.passengers ?? "—"}</dd>
                      </div>
                    </dl>
                  </section>

                  {/* Kund-info */}
                  <section className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[#194C66]/70">
                      Kund
                    </h2>
                    <dl className="mt-3 space-y-1 text-sm text-[#194C66]">
                      <div className="flex gap-2">
                        <dt className="w-40 font-medium">Kontakt:</dt>
                        <dd>{offer.customer_reference || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-40 font-medium">E-post:</dt>
                        <dd>{offer.contact_email || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-40 font-medium">Telefon:</dt>
                        <dd>{offer.contact_phone || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-40 font-medium">
                          Företag / förening:
                        </dt>
                        <dd>{offer.company_name || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-40 font-medium">Ref / PO-nummer:</dt>
                        <dd>{offer.po_reference || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-40 font-medium">
                          Organisationsnummer:
                        </dt>
                        <dd>{offer.org_number || "—"}</dd>
                      </div>
                    </dl>
                  </section>
                </div>

                {/* Reseinfo + plats/logistik */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Reseinformation */}
                  <section className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[#194C66]/70">
                      Reseinformation
                    </h2>
                    <dl className="mt-3 space-y-1 text-sm text-[#194C66]">
                      <div className="flex gap-2">
                        <dt className="w-32 font-medium">Från:</dt>
                        <dd>{offer.departure_place || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-32 font-medium">Till:</dt>
                        <dd>{offer.destination || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-32 font-medium">Slutmål:</dt>
                        <dd>{offer.final_destination || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-32 font-medium">Datum:</dt>
                        <dd>{offer.departure_date || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-32 font-medium">Tid:</dt>
                        <dd>{offer.departure_time || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-32 font-medium">Via / stopp:</dt>
                        <dd>{offer.stopover_places || offer.extra_stops || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-32 font-medium">Kontakt ombord:</dt>
                        <dd>{offer.onboard_contact || "—"}</dd>
                      </div>
                    </dl>
                  </section>

                  {/* Plats & logistik */}
                  <section className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[#194C66]/70">
                      Plats & logistik
                    </h2>
                    <dl className="mt-3 space-y-1 text-sm text-[#194C66]">
                      <div className="flex gap-2">
                        <dt className="w-44 font-medium">
                          Behöver ni bussen på plats?
                        </dt>
                        <dd>{offer.need_bus_on_site || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-44 font-medium">Notis på plats:</dt>
                        <dd>{offer.site_notes || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-44 font-medium">
                          Basplats på destinationen:
                        </dt>
                        <dd>{offer.base_at_destination || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-44 font-medium">
                          Sista dagen (på plats):
                        </dt>
                        <dd>{offer.last_day_on_site || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-44 font-medium">Sluttid:</dt>
                        <dd>{offer.end_time || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-44 font-medium">Lokala körningar:</dt>
                        <dd>{offer.local_runs || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-44 font-medium">
                          Väntetid / standby (timmar):
                        </dt>
                        <dd>{offer.standby_hours || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-44 font-medium">
                          Parkering & tillstånd:
                        </dt>
                        <dd>{offer.parking || "—"}</dd>
                      </div>
                    </dl>
                  </section>
                </div>

                {/* Returinfo */}
                {hasReturn && (
                  <section className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[#194C66]/70">
                      Retur
                    </h2>
                    <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-[#194C66] md:grid-cols-2">
                      <div className="flex gap-2">
                        <dt className="w-28 font-medium">Från:</dt>
                        <dd>{offer.return_departure || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-28 font-medium">Till:</dt>
                        <dd>{offer.return_destination || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-28 font-medium">Datum:</dt>
                        <dd>{offer.return_date || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-28 font-medium">Tid:</dt>
                        <dd>{offer.return_time || "—"}</dd>
                      </div>
                    </dl>
                  </section>
                )}

                {/* Övrig info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <section className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[#194C66]/70">
                      Övrig information
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-[#194C66]">
                      {offer.notes || "Ingen information."}
                    </p>
                  </section>

                  <section className="rounded-xl bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[#194C66]/70">
                      Mer om resplanen
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-[#194C66]">
                      {offer.more_trip_info || "—"}
                    </p>
                  </section>
                </div>

                {/* Kalkyl – hela kortet liknar “Skapa offert” */}
                <section className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-[#194C66]">
                        Kalkyl & prisförslag
                      </h2>
                      <p className="text-sm text-slate-600">
                        Räkna fram pris, spara utkast och skicka prisförslag
                        direkt till kunden.
                      </p>
                    </div>
                  </div>

                  {calculatorProps ? (
                    <OfferCalculator
                      offerId={calculatorProps.offerId}
                      offerNumber={calculatorProps.offerNumber}
                      customerEmail={calculatorProps.customerEmail}
                    />
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      Kunde inte hitta kundens e-postadress. Fyll i e-post på
                      offerten innan du skickar prisförslag.
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
