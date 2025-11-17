// src/pages/offert/[id].tsx
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import supabase from "@/lib/supabaseAdmin";
import { verifyOfferToken, type OfferTokenPayload } from "@/lib/offerToken";

// Kundkomponenter (behåll dina befintliga)
import OfferInkommen from "@/components/offers/OfferInkommen";
import OfferBesvarad from "@/components/offers/OfferBesvarad";
import OfferGodkand from "@/components/offers/OfferGodkand";
import OfferAvbojd from "@/components/offers/OfferAvbojd";
import OfferMakulerad from "@/components/offers/OfferMakulerad";
import OfferBokningsbekraftelse from "@/components/offers/OfferBokningsbekraftelse";

type OfferRow = {
  id: string;
  offer_number: string;
  status?: string | null;

  contact_person?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;

  departure_place?: string | null;
  destination?: string | null;
  departure_date?: string | null;
  departure_time?: string | null;

  via?: string | null;   // ✅ nya namnet
  stop?: string | null;  // ✅ nya namnet
  passengers?: number | null;

  return_departure?: string | null;
  return_destination?: string | null;
  return_date?: string | null;
  return_time?: string | null;

  notes?: string | null;
};

type Props = {
  offer: OfferRow | null;
  auth: { ok: boolean; reason?: string };
  viewOverride: string | null;
};

const Page: NextPage<Props> = ({ offer, auth, viewOverride }) => {
  const statusRaw = (viewOverride || offer?.status || "").toLowerCase();

  const renderByStatus = () => {
    if (!auth.ok) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-lg rounded-2xl border bg-white p-6 text-center shadow">
            <h1 className="text-xl font-semibold text-[#194C66] mb-2">Åtkomst nekad</h1>
            <p className="text-gray-600">Ogiltig eller saknad token för visning av offert.</p>
          </div>
        </div>
      );
    }
    if (!offer) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-lg rounded-2xl border bg-white p-6 text-center shadow">
            <h1 className="text-xl font-semibold text-[#194C66] mb-2">Offert saknas</h1>
            <p className="text-gray-600">Vi kunde inte hitta någon offert med angivet ID/nummer.</p>
          </div>
        </div>
      );
    }

    switch (statusRaw) {
      case "inkommen":
        return <OfferInkommen offer={offer} />;
      case "besvarad":
        return <OfferBesvarad offer={offer} />;
      case "godkänd":
      case "godkand":
        return <OfferGodkand offer={offer} />;
      case "avböjd":
      case "avbojd":
        return <OfferAvbojd offer={offer} />;
      case "makulerad":
        return <OfferMakulerad offer={offer} />;
      case "bokningsbekräftelse":
      case "bokningsbekraftelse":
        return <OfferBokningsbekraftelse offer={offer} />;
      default:
        // Fallback: visa “inkommen” om okänt statusvärde
        return <OfferInkommen offer={offer} />;
    }
  };

  const title = offer?.offer_number
    ? `Offert ${offer.offer_number} – Helsingbuss`
    : "Offert – Helsingbuss";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="bg-[#f5f4f0] min-h-screen">
        {renderByStatus()}
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = String(ctx.params?.id ?? "");
  const q = ctx.query || {};
  const token = typeof q.token === "string" ? q.token : typeof q.t === "string" ? q.t : "";
  const viewOverride = typeof q.view === "string" ? q.view : null;

  if (!slug) {
    return { props: { offer: null, auth: { ok: false, reason: "missing-id" }, viewOverride } };
  }

  // ✅ Tokenvalidering – säkert och utan null-problem
  let payload: OfferTokenPayload | null = null;
  try {
    // verifyOfferToken kan vara sync eller async – await funkar i båda fallen
    payload = await verifyOfferToken(token);
  } catch {
    payload = null;
  }

  if (!payload) {
    return { props: { offer: null, auth: { ok: false, reason: "forbidden" }, viewOverride } };
  }

  const matchesNo = !!payload.no && String(payload.no) === slug;
  const matchesId = !!payload.id && String(payload.id) === slug;

  if (!matchesNo && !matchesId) {
    return { props: { offer: null, auth: { ok: false, reason: "forbidden" }, viewOverride } };
  }

  // ✅ Hämta offerten via id ELLER offer_number (utan generics som bråkar)
  const { data, error } = await supabase
    .from("offers")
    .select(
      [
        "id",
        "offer_number",
        "status",
        "contact_person",
        "customer_email",
        "customer_phone",
        "departure_place",
        "destination",
        "departure_date",
        "departure_time",
        "via",   // ✅
        "stop",  // ✅
        "passengers",
        "return_departure",
        "return_destination",
        "return_date",
        "return_time",
        "notes",
      ].join(",")
    )
    .or(`id.eq.${slug},offer_number.eq.${slug}`)
    .maybeSingle();

  if (error) {
    return { props: { offer: null, auth: { ok: false, reason: "db" }, viewOverride } };
  }

  return {
    props: {
      offer: (data ?? null) as OfferRow | null,
      auth: { ok: true },
      viewOverride,
    },
  };
};

export default Page;
