// src/pages/api/offert/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendOfferMail";
import qs from "node:querystring";

/** Hämta Supabase-klient oavsett hur supabaseAdmin.ts exporterar */
function getAdminClient(): any {
  const a: any = admin;
  try {
    if (typeof a === "function") return a();                   // default export är en factory
    if (typeof a?.requireAdmin === "function") return a.requireAdmin(); // named factory
  } catch { /* ignore */ }

  // named/dflt klient-objekt
  if (a?.supabaseAdmin) return a.supabaseAdmin;
  if (a?.supabase) return a.supabase;
  if (a?.default) return a.default;

  return null;
}

/** CORS: tillåt anrop från dina domäner */
function applyCors(req: NextApiRequest, res: NextApiResponse) {
  const allow = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const origin = String(req.headers.origin || "").toLowerCase();
  if (allow.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    // @ts-ignore
    res.__corsEnded = true;
  }
}

/** Plocka body oavsett JSON eller urlencoded */
function getBody(req: NextApiRequest): Record<string, any> {
  const ct = String(req.headers["content-type"] || "").toLowerCase();
  const b: any = req.body;

  if (b && typeof b === "object" && !Buffer.isBuffer(b)) return b;

  if (typeof b === "string") {
    if (ct.includes("application/json")) {
      try { return JSON.parse(b); } catch { /* fallthrough */ }
    }
    return qs.parse(b) as any; // urlencoded
  }

  if (ct.includes("application/x-www-form-urlencoded") && typeof b === "object") {
    return b;
  }

  return {};
}

const get = (obj: any, ...keys: string[]) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
};
const getNum = (obj: any, ...keys: string[]) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return null as number | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(req, res);
  // @ts-ignore
  if (res.__corsEnded) return;

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const input = getBody(req);
    const supabase = getAdminClient();
    if (!supabase) {
      console.error("[offert/create] supabase client saknas");
      return res.status(500).json({ ok: false, error: "Server config error" });
    }

    // Normalisering (tål olika fältnamn från hemsidan)
    const customerEmail = get(input, "customer_email", "email", "E-post", "epost", "mail");
    const customerName  = get(input, "customer_name", "name", "contact_person", "kontaktperson");
    const customerPhone = get(input, "customer_phone", "phone", "telefon");

    const from = get(input, "from", "fran", "departure_place", "start");
    const to   = get(input, "to", "till", "destination", "mål", "mal");
    const date = get(input, "date", "datum", "departure_date");
    const time = get(input, "time", "tid", "departure_time");
    const passengers = getNum(input, "passengers", "pax", "antal", "antal_personer");

    const via            = get(input, "via", "stopp", "stopover_places");
    const onboardContact = get(input, "onboardContact", "onboard_contact", "kontakt_ombord");

    const return_from = get(input, "return_from", "retur_fran", "return_departure");
    const return_to   = get(input, "return_to", "retur_till", "return_destination");
    const return_date = get(input, "return_date", "retur_datum");
    const return_time = get(input, "return_time", "retur_tid");

    const notes = get(input, "notes", "message", "meddelande", "ovrigt", "övrigt");

    // 1) Spara i DB
    const insertPayload = {
      contact_email: customerEmail || null,
      contact_person: customerName || null,
      contact_phone: customerPhone || null,
      departure_place: from || null,
      destination: to || null,
      departure_date: date || null,
      departure_time: time || null,
      passengers: passengers,
      via: via || null,
      onboard_contact: onboardContact || null,
      return_departure: return_from || null,
      return_destination: return_to || null,
      return_date: return_date || null,
      return_time: return_time || null,
      notes: notes || null,
      status: "inkommen",
      offer_date: new Date().toISOString().slice(0, 10),
    };

    const { data: row, error } = await supabase
      .from("offers")
      .insert(insertPayload)
      .select("id, offer_number, contact_email")
      .single();

    if (error) {
      console.error("[offert/create] insert error:", error);
      return res.status(500).json({ ok: false, error: "Database error" });
    }

    const offerId     = String(row?.id);
    const offerNumber = String(row?.offer_number ?? row?.id);

    // 2) Skicka mejl (vänta in, logga om fel)
    let mailOk = true;
    try {
      await sendOfferMail({
        offerId,
        offerNumber,
        customerEmail: customerEmail,
        customerName,
        customerPhone,
        from, to, date, time,
        passengers: passengers ?? null,
        via, onboardContact,
        return_from, return_to, return_date, return_time,
        notes,
      });
    } catch (mailErr: any) {
      mailOk = false;
      console.error("[offert/create] sendOfferMail failed:", mailErr?.message || mailErr);
    }

    return res.status(200).json({ ok: true, id: offerId, offer_number: offerNumber, mailOk });
  } catch (e: any) {
    console.error("[offert/create] fatal:", e?.message || e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};
