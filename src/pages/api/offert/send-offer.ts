// src/pages/api/offert/send-offer.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendMail";

// (frivilligt – pages API kör ändå i Node-miljö)
export const config = { runtime: "nodejs" };

/* ---------- Typer som matchar kolumner i `offers` ---------- */
type OfferRow = {
  id: string;
  offer_number: string;

  contact_person: string | null;
  customer_email: string | null;
  customer_phone: string | null;

  departure_place: string | null;
  destination: string | null;
  departure_date: string | null;
  departure_time: string | null;

  via: string | null;
  stop: string | null;
  passengers?: number | null;

  return_departure: string | null;
  return_destination: string | null;
  return_date: string | null;
  return_time: string | null;

  notes?: string | null;
};

/* -------------------- Helpers -------------------- */
const S = (v: any) => (v == null ? null : String(v).trim() || null);
const U = <T extends string | number | null | undefined>(v: T) =>
  (v == null ? undefined : (v as Exclude<T, null>));

function isOfferRow(d: any): d is OfferRow {
  return d && typeof d === "object" && typeof d.id === "string" && typeof d.offer_number === "string";
}

/* -------------------- Handler -------------------- */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS (så att extern hemsida kan kalla denna)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST,OPTIONS");
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ID kan komma via body eller query
    const id = String((req.body?.offer_id ?? req.query.id ?? "") || "");
    if (!id) return res.status(400).json({ error: "Saknar offert-id" });

    // Hämta offerten
    const { data, error } = await supabase
      .from("offers")
      .select([
        "id",
        "offer_number",
        "contact_person",
        "customer_email",
        "customer_phone",
        "departure_place",
        "destination",
        "departure_date",
        "departure_time",
        "via",
        "stop",
        "passengers",
        "return_departure",
        "return_destination",
        "return_date",
        "return_time",
        "notes",
        "status",
      ].join(","))
      .eq("id", id)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!isOfferRow(data)) return res.status(500).json({ error: "Dataparsning misslyckades (OfferRow)" });

    const offer = data as OfferRow;

    // Markera som "besvarad" så den försvinner från Obesvarade (om inte redan)
    try {
      await supabase.from("offers")
        .update({ status: "besvarad" })
        .eq("id", id);
    } catch { /* tolerera om uppdatering faller */ }

    // Skicka offert-mail (använder dina mallar i sendMail)
    await sendOfferMail({
      offerId: String(offer.id),
      offerNumber: String(offer.offer_number || "HB25???"),

      customerEmail: U(S(offer.customer_email)),
      customerName: U(S(offer.contact_person)),

      from: U(S(offer.departure_place)),
      to: U(S(offer.destination)),
      date: U(S(offer.departure_date)),
      time: U(S(offer.departure_time)),

      via: U(S(offer.via)),
      stop: U(S(offer.stop)),
      passengers: typeof offer.passengers === "number" ? offer.passengers : undefined,

      return_from: U(S(offer.return_departure)),
      return_to: U(S(offer.return_destination)),
      return_date: U(S(offer.return_date)),
      return_time: U(S(offer.return_time)),

      // Vill du att kundens telefon ska synas i texten kan vi injicera den i notes
      notes: U(
        [S(offer.notes) || "", S(offer.customer_phone) ? `Telefon: ${S(offer.customer_phone)}` : ""]
          .filter(Boolean)
          .join("\n")
      ),
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("[offert/send-offer] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
