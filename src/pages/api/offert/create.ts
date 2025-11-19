// src/pages/api/offert/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { sendOfferMail, sendCustomerReceipt } from "@/lib/sendMail";

// ====== CORS ======
const ALLOWED_ORIGINS = new Set<string>([
  "https://helsingbuss.se",
  "https://www.helsingbuss.se",
  "https://kund.helsingbuss.se",
  "https://login.helsingbuss.se",
  "https://hbshuttle.se",
  "https://www.hbshuttle.se",
  "https://2airport.se",
  "https://www.2airport.se",
  // lägg till fler domäner vid behov
]);

function setCors(req: NextApiRequest, res: NextApiResponse) {
  const origin = String(req.headers.origin || "");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// ====== Typer & helpers ======
type ApiOk  = { ok: true; offer: any };
type ApiErr = { error: string };

const S = (v: any) => (v == null ? null : String(v).trim() || null);
const U = <T extends string | number | null | undefined>(v: T) =>
  (v == null ? undefined : (v as Exclude<T, null>));

// Generera nästa offertnummer (HB25009, HB25010, …)
async function nextOfferNumber(): Promise<string> {
  const START = 25009;

  const { data, error } = await supabase
    .from("offers")
    .select("offer_number")
    .ilike("offer_number", "HB25%")
    .order("offer_number", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return `HB${START}`;

  // Plocka siffrorna efter "HB"
  const last = String(data[0].offer_number || "").replace(/^HB/i, "");
  const lastNum = parseInt(last, 10);
  const next = Number.isFinite(lastNum) ? Math.max(START, lastNum + 1) : START;
  // Ex: "HB25021" (ingen extra padding behövs i ditt format)
  return `HB${next}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  setCors(req, res);

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST,OPTIONS");
      return res.status(405).json({ error: "Method not allowed" });
    }

    // --- Normalisera inkommande body (JSON eller urlencoded) ---
    const b: any = req.body || {};

    // Sätt upp raden som ska in i 'offers'
    const row: Record<string, any> = {
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

    // Säkerställ offer_number
    if (!b.offer_number) {
      row.offer_number = await nextOfferNumber();
    } else {
      row.offer_number = String(b.offer_number);
    }

    // --- INSERT ---
    const { data, error } = await supabase
      .from("offers")
      .insert(row)
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)   return res.status(500).json({ error: "Insert failed" });

    const offer = data;

    // --- MAIL: Admin + Kundkvitto (mallar använder dina helpers) ---
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
