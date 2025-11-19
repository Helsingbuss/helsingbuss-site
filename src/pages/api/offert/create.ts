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

// Tål JSON, urlencoded och ”raw string JSON”
function readBody(req: NextApiRequest): Record<string, any> {
  const ct = String(req.headers["content-type"] || "");
  const b = (req.body ?? {}) as any;
  if (typeof b === "string") {
    try { return JSON.parse(b); } catch { return {}; }
  }
  // Next tolkar redan JSON + urlencoded till objekt
  return b;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  // --- CORS / preflight ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Webhook-Token");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST,OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const b = readBody(req);

    // (valfritt) shared secret för extern post
    const expected = process.env.WEBHOOK_TOKEN;
    if (expected) {
      const got = String(req.headers["x-webhook-token"] || "");
      if (got !== expected) return res.status(401).json({ error: "Unauthorized" });
    }

    const row = {
      status: "inkommen",

      contact_person:     S(b.contact_person),
      customer_email:     S(b.customer_email),
      customer_phone:     S(b.customer_phone),

      customer_reference: S(b.customer_reference) || S(b.contact_person),
      customer_name:      S(b.customer_name)      || S(b.namn_efternamn) || S(b.contact_person),
      customer_type:      S(b.customer_type)      || "privat",
      invoice_ref:        S(b.invoice_ref)        || S(b.Referens_PO_nummer),

      departure_place: S(b.departure_place),
      destination:     S(b.destination) || S(b.final_destination),
      departure_date:  S(b.departure_date),
      departure_time:  S(b.departure_time),

      // stöder både "via" och ditt ”stopover_places”
      via:  S(b.via) || S(b.stopover_places),
      stop: S(b.stop),

      return_departure:   S(b.return_departure),
      return_destination: S(b.return_destination),
      return_date:        S(b.return_date),
      return_time:        S(b.return_time),

      passengers:
        typeof b.passengers === "number"
          ? b.passengers
          : Number(b.passengers || 0) || null,

      // samla övrigt i notes
      notes: [
        S(b.notes),
        S(b.behöver_buss),
        S(b.basplats_pa_destination),
        S(b.notis_pa_plats),
        S(b.vad_ska_bussen_gora_pa_plats),
        S(b.local_kor),
        S(b.standby),
        S(b.parkering),
      ].filter(Boolean).join("\n") || null,
    };

    const { data, error } = await supabase
      .from("offers")
      .insert(row)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)   return res.status(500).json({ error: "Insert failed" });

    const offer = data;

    // --- Mail till admin + kvitto till kund ---
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
      });
    } catch (e:any) {
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
    } catch (e:any) {
      console.error("[offert/create] sendCustomerReceipt failed:", e?.message || e);
    }

    return res.status(200).json({ ok: true, offer });
  } catch (e:any) {
    console.error("[offert/create] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
