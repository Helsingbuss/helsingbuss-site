// src/pages/offert/[id].tsx
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import supabase from "@/lib/supabaseAdmin";

// Kundkomponenter
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

  // datum / metadata
  offer_date?: string | null;
  created_at?: string | null;

  // *** PRISFÄLT ***
  amount_ex_vat?: number | null;
  vat_amount?: number | null;
  total_amount?: number | null;
  vat_breakdown?: any | null;

  // kunduppgifter / referenser
  customer_number?: string | null;
  contact_person?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  customer_reference?: string | null;
  internal_reference?: string | null;
  customer_address?: string | null;

  // resa – huvud
  trip_type?: string | null;
  round_trip?: boolean | null;
  departure_place?: string | null;
  destination?: string | null;
  final_destination?: string | null;
  departure_date?: string | null;
  departure_time?: string | null;
  via?: string | null;
  stop?: string | null;
  passengers?: number | null;

  // resa – tider
  on_site_time?: number | null;
  on_site_minutes?: number | null;
  end_time?: string | null;

  // retur
  return_departure?: string | null;
  return_destination?: string | null;
  return_date?: string | null;
  return_time?: string | null;
  return_on_site_time?: number | null;
  return_on_site_minutes?: number | null;
  return_end_time?: string | null;

  // chaufför / fordon / buss
  driver_name?: string | null;
  driver_phone?: string | null;
  return_driver_name?: string | null;
  return_driver_phone?: string | null;
  vehicle_reg?: string | null;
  vehicle_model?: string | null;
  return_vehicle_reg?: string | null;
  return_vehicle_model?: string | null;
  bus_name?: string | null;
  bus_reg?: string | null;

  // övrigt
  notes?: string | null;
  payment_terms?: string | null;

  // trafikledning
  ops_message?: string | null;
  ops_comment?: string | null;
  traffic_comment?: string | null;

  // multi-leg (JSON från DB)
  legs?: any | null;

  // kundens godkännande
  customer_approved?: boolean | null;
  customer_approved_at?: string | null;
};

type Props = {
  offer: OfferRow | null;
  auth: { ok: boolean; reason?: string };
  viewOverride: string | null;
};

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

const Page: NextPage<Props> = ({ offer, auth, viewOverride }) => {
  const statusRaw = (() => {
    const base = (viewOverride || offer?.status || "").toLowerCase();

    if (!offer) return base;

    const isCancelled =
      base === "makulerad" || base === "avböjd" || base === "avbojd";

    const isBookingConfirmed =
      base === "bokningsbekräftelse" || base === "bokningsbekraftelse";

    if (offer.customer_approved && !isCancelled && !isBookingConfirmed) {
      return "godkänd";
    }

    return base;
  })();

  const renderByStatus = () => {
    if (!auth.ok) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-lg rounded-2xl border bg-white p-6 text-center shadow">
            <h1 className="text-xl font-semibold text-[#194C66] mb-2">
              Åtkomst nekad
            </h1>
            <p className="text-gray-600">
              Tekniskt fel eller saknad behörighet för att visa offerten.
            </p>
          </div>
        </div>
      );
    }

    if (!offer) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-lg rounded-2xl border bg-white p-6 text-center shadow">
            <h1 className="text-xl font-semibold text-[#194C66] mb-2">
              Offert saknas
            </h1>
            <p className="text-gray-600">
              Vi kunde inte hitta någon offert med angivet ID/nummer.
            </p>
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
      <main className="bg-[#f5f4f0] min-h-screen">{renderByStatus()}</main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = String(ctx.params?.id ?? "").trim();
  const q = ctx.query || {};

  const token =
    typeof q.token === "string"
      ? q.token.trim()
      : typeof q.t === "string"
      ? q.t.trim()
      : "";

  const viewOverride = typeof q.view === "string" ? q.view : null;

  if (!slug) {
    return {
      props: {
        offer: null,
        auth: { ok: false, reason: "missing-id" },
        viewOverride,
      },
    };
  }

  // ✅ NYTT: Om token är UUID => hämta på id=token.
  // Annars: hämta på id=slug om slug är UUID, annars offer_number=slug.
  const lookupId = isUuid(token) ? token : isUuid(slug) ? slug : null;

  let query = supabase.from("offers").select("*").limit(1);
  query = lookupId ? query.eq("id", lookupId) : query.eq("offer_number", slug);

  const { data, error } = await query.maybeSingle();

  if (error) {
    return {
      props: {
        offer: null,
        auth: { ok: false, reason: "db" },
        viewOverride,
      },
    };
  }

  const offer = (data ?? null) as OfferRow | null;

  return {
    props: {
      offer,
      auth: { ok: true },
      viewOverride,
    },
  };
};

export default Page;
