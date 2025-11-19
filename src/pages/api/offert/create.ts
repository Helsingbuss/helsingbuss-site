// src/pages/api/offert/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { sendOfferMail, sendCustomerReceipt } from "@/lib/sendMail";

export const config = { runtime: "nodejs" };

type ApiOk  = { ok: true; offer: any };
type ApiErr = { error: string };

const S = (v: any) => (v == null ? null : String(v).trim() || null);
const U = <T extends string | number | null | undefined>(v: T) =>
  (v == null ? undefined : (v as Exclude<T, null>));

/** Plocka fram nästa offertsiffra (HB + 5 siffror). Miniminivå 25009. */
async function nextOfferNumber(): Promise<string> {
  // Ta senaste som faktiskt har ett nummer
  const { data } = await supabase
    .from("offers")
    .select("offer_number")
    .not("offer_number", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  const latest = Array.isArray(data) && data[0]?.offer_number
    ? String(data[0].offer_number)
    : null;

  const parseNum = (s: string | null) => {
    if (!s) return null;
    const m = s.match(/HB\s*([0-9]+)/i);
    return m ? parseInt(m[1], 10) : null;
  };

  const base = 25009;                       // <-- ditt golv
  const last = parseNum(latest);
  const next = Math.max((last ?? base - 1) + 1, base);
  return `HB${String(next).padStart(5, "0")}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  // Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST,OPTIONS");
    return res.status(204).end();
  }

  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST,OPTIONS");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const b = req.body || {};

    // Generera offer_number först
    const offer_number = await nextOfferNumber();

    const row = {
      offer_number,
      status: "inkommen",

      contact_person:     S(b.contact_person),
      customer_email:     S(b.customer_email),
      customer_phone:     S(b.customer_phone),

      customer_reference: S(b.customer_reference) || S(b.contact_person),
      customer_name:      S(b.customer_name)      || S(b.contact_person),
      customer_type:      S(b.customer_type)      || "privat",
      invoice_ref:        S(b.invoice_ref),

      departure_place: S(b.departure_place),
      destination:     S(b.destination),
      departure_date:  S(b.departure_date),
      departure_time:  S(b.departure_time),
      via:             S(b.stopover_places) || S(b.via),
      stop:            S(b.stop),

      return_departure:   S(b.return_departure),
      return_destination: S(b.return_destination),
      return_date:        S(b.return_date),
      return_time:        S(b.return_time),

      passengers:
        typeof b.passengers === "number"
          ? b.passengers
          : Number(b.passengers || 0) || null,

      notes: S(b.notes),
    };

    const { data, error } = await supabase
      .from("offers")
      .insert(row)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)   return res.status(500).json({ error: "Insert failed" });

    const offer = data;

    // --- Mail till admin + kvitto till kund (mallar styr utseende/texter) ---
    try {
      await sendOfferMail({
        offerId:     String(offer.id),
        offerNumber: String(offer.offer_number || "HB25???"),

        customerEmail: U(S(offer.customer_email)),
        customerName:  U(S(offer.contact_person)),

        from: U(S(offer.departure_place)),
        to:   U(S(offer.destination)),
        date: U(S(offer.departure_date)),
        time: U(S(offer.departure_time)),

        via:  U(S(offer.via)),
        stop: U(S(offer.stop)),
        passengers: typeof offer.passengers === "number" ? offer.passengers : undefined,

        return_from: U(S(offer.return_departure)),
        return_to:   U(S(offer.return_destination)),
        return_date: U(S(offer.return_date)),
        return_time: U(S(offer.return_time)),

        notes: U(S(offer.notes)),
        // rubriker/knappar styrs i dina mallar (admin: Portal-start,
        // kund: kund.helsingbuss.se/offert/:id)
      });
    } catch (e: any) {
      console.error("[offert/create] sendOfferMail failed:", e?.message || e);
    }

    try {
      const to = S(offer.customer_email);
      if (to && to.includes("@")) {
        await sendCustomerReceipt({
          to,
          offerNumber: String(offer.offer_number || "HB25???"),
        });
      }
    } catch (e: any) {
      console.error("[offert/create] sendCustomerReceipt failed:", e?.message || e);
    }

    return res.status(200).json({ ok: true, offer });
  } catch (e: any) {
    console.error("[offert/create] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
