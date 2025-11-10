// src/pages/offert/preview/[id].tsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "@/lib/supabaseClient";

// Kundvyer (oförändrad design)
import OfferInkommen from "@/components/offers/OfferInkommen";
import OfferBesvarad from "@/components/offers/OfferBesvarad";
import OfferGodkand from "@/components/offers/OfferGodkand";

type Offer = {
  id: string;
  offer_number: string | null;
  status: string | null;
  customer_reference: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  customer_address?: string | null;

  departure_place: string | null;
  destination: string | null;
  departure_date?: string | null;
  departure_time?: string | null;
  passengers: number | null;

  round_trip?: boolean | null;
  return_departure?: string | null;
  return_destination?: string | null;
  return_date?: string | null;
  return_time?: string | null;

  price_ex_vat?: number | null;
  vat?: number | null;
  price_total?: number | null;

  notes?: string | null;
  trip_type?: "sverige" | "utrikes" | null;
};

const FALLBACK: Offer = {
  id: "demo",
  offer_number: "HB25DEMO",
  status: "besvarad",
  customer_reference: "Andreas Ekelöf",
  contact_person: "Andreas Ekelöf",
  contact_email: "ekelof.andreas@hotmail.com",
  contact_phone: "0729423537",
  customer_address: "Helsingborg",
  departure_place: "Helsingborg C",
  destination: "Göteborg C",
  departure_date: "2025-12-10",
  departure_time: "12:00",
  passengers: 50,
  round_trip: true,
  return_departure: "Göteborg C",
  return_destination: "Helsingborg C",
  return_date: "2025-12-10",
  return_time: "20:00",
  trip_type: "sverige",
  price_ex_vat: 12500,
  vat: 750,
  price_total: 13250,
  notes: "Ingen information.",
};

const FIELDS =
  "id,offer_number,status,customer_reference,contact_person,contact_email,contact_phone,customer_address,departure_place,destination,departure_date,departure_time,passengers,round_trip,return_departure,return_destination,return_date,return_time,price_ex_vat,vat,price_total,notes,trip_type";

function normView(v?: string | null): "inkommen" | "besvarad" | "godkand" {
  const s = (v || "").toLowerCase();
  if (s === "besvarad") return "besvarad";
  if (s === "godkand" || s === "godkänd") return "godkand";
  return "inkommen";
}

export default function OfferPreviewPage() {
  const router = useRouter();
  const { id, view, demo } = router.query as {
    id?: string;
    view?: string;
    demo?: string;
  };

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const chosenView = useMemo(
    () => normView(view),
    [view]
  );

  useEffect(() => {
    if (!router.isReady || !id) return;

    // Demo-läge: direkt fallback
    if (demo === "1") {
      setOffer(FALLBACK);
      setLoading(false);
      setErr(null);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) Försök via offer_number (t.ex. HB25XXXX)
        let { data, error } = await supabase
          .from("offers")
          .select(FIELDS)
          .eq("offer_number", id)
          .maybeSingle();

        // 2) Om ingen träff: försök via primärnyckel (UUID)
        if (!data) {
          const r2 = await supabase
            .from("offers")
            .select(FIELDS)
            .eq("id", id)
            .maybeSingle();
          data = r2.data as any;
          error = r2.error as any;
        }

        if (error) {
          // Logga i konsol, visa snäll feltext
          console.error("Preview fetch error:", error);
        }

        if (!data) {
          setOffer(null);
          setErr("Ingen offert hittades.");
        } else {
          setOffer(data as Offer);
          setErr(null);
        }
      } catch (e: any) {
        console.error(e);
        setOffer(null);
        setErr(e?.message || "Kunde inte läsa offerten.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router.isReady, id, demo]);

  const pageTitle = useMemo(() => {
    if (loading) return "Offert – hämtar… | Helsingbuss";
    if (!offer) return "Offert saknas | Helsingbuss";
    const nr = offer.offer_number || offer.id;
    return `Offert ${nr} – förhandsvisning | Helsingbuss`;
  }, [loading, offer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] p-6">
        <Head>
          <title>{pageTitle}</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6" role="status" aria-live="polite">
          Laddar…
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] p-6">
        <Head>
          <title>{pageTitle}</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-semibold text-[#0f172a] mb-2">Hittade ingen offert</h1>
          <p className="text-[#0f172a]/70">
            Ingen offert med nummer eller id <strong>{id}</strong>. Lägg till{" "}
            <code>?demo=1</code> för att se layouten utan databas.
          </p>
          {err && <p className="mt-2 text-red-600">{err}</p>}
        </div>
      </div>
    );
  }

  // Välj vy (kundkomponenterna är oförändrade)
  const ViewComp =
    chosenView === "besvarad"
      ? OfferBesvarad
      : chosenView === "godkand"
      ? OfferGodkand
      : OfferInkommen;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <ViewComp offer={offer} />
    </>
  );
}
