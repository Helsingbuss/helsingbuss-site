// src/pages/api/offert/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin"; // default-export: admin-klient
import { signOfferToken } from "@/lib/offerToken";
import { sendCustomerReceipt, sendOfferMail, buildOfferPublicLink } from "@/lib/sendMail";

type ApiOk = { ok: true; offer: any; public_url: string };
type ApiErr = { ok: false; error: string };

// ---- Helpers ---------------------------------------------------------------

// plockar första sanna träffen från många alias (tål kapslade { form: {...} })
function pickFirst<T extends Record<string, any>>(src: T, ...keys: string[]) {
  for (const k of keys) {
    if (k.includes(".")) {
      // stöd "form.email" etc
      const parts = k.split(".");
      let cur: any = src;
      for (const p of parts) cur = cur?.[p];
      if (cur != null && String(cur).trim() !== "") return cur;
    } else {
      const v = (src as any)?.[k];
      if (v != null && String(v).trim() !== "") return v;
    }
  }
  // kolla ev. top-level "form" fallback
  const form = (src as any)?.form || (src as any)?.body;
  if (form) {
    for (const k of keys) {
      const v = (form as any)?.[k];
      if (v != null && String(v).trim() !== "") return v;
    }
  }
  return null;
}

const _t = (v: any) => (v == null ? null : String(v).trim() || null);
const tidyTime = (t?: string | null) => {
  if (!t) return null;
  const s = String(t);
  return s.length === 5 ? s : (s.length >= 4 ? `${s.slice(0,2)}:${s.slice(2,4)}` : null);
};
const looksFilled = (v: any) => v != null && String(v).trim() !== "";

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

async function nextOfferNumber(): Promise<string> {
  // Använder ev. DB-funktion om den finns, annars fallback
  try {
    const { data, error } = await (supabase as any).rpc("next_offer_serial");
    if (!error && data) return String(data);
  } catch {}
  // fallback: HB + YY + random 4
  const yy = String(new Date().getFullYear()).slice(-2);
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `HB${yy}${rnd}`;
}

// robust insert som hanterar unik nyckel-krock och försöker igen
async function insertOffer(row: any) {
  let attempts = 0;
  while (attempts < 3) {
    const { data, error } = await supabase.from("offers").insert(row).select("*").maybeSingle();
    if (!error && data) return { offer: data, error: null };

    // unik nyckel (offertnummer) – försök nytt nummer
    const msg = String(error?.message || "").toLowerCase();
    if (error?.code === "23505" || msg.includes("duplicate key") || msg.includes("unique")) {
      row.offer_number = await nextOfferNumber();
      attempts++;
      continue;
    }
    return { offer: null, error };
  }
  return { offer: null, error: new Error("Kunde inte generera unikt offertnummer") };
}

// Bygg publik länk (använder helper om den finns)
function buildPublicUrl(offer: any): string {
  const base =
    process.env.NEXT_PUBLIC_LOGIN_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    "http://localhost:3000";

  const token = signOfferToken({ sub: offer.id, no: offer.offer_number }, "14d");
  try {
    // har du en util:
    if (typeof buildOfferPublicLink === "function") {
      const u = buildOfferPublicLink(offer, token);
      if (u) return u;
    }
  } catch {}
  const url = new URL(`/offert/${encodeURIComponent(offer.id)}`, base);
  if (token) url.searchParams.set("t", token);
  return url.toString();
}

// ---- Handler ---------------------------------------------------------------

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};

    // --- Läs med alias (stöd både nya & gamla namn + hemsideformulär) ----
    const contact_person = _t(
      pickFirst(body,
        "contact_person", "customer_contact", "referens", "reference", "contact",
        "customer_name", "name", "namn", "Kontaktperson"
      )
    );

    const customer_email = _t(
      pickFirst(body,
        "customer_email", "email", "email_address", "E-post", "epost", "mail", "form.email"
      )
    );

    const customer_phone = _t(
      pickFirst(body,
        "customer_phone", "phone", "telefon", "tel", "form.phone"
      )
    );

    const invoice_ref = _t(
      pickFirst(body, "invoice_ref", "invoice_reference", "fakturareferens", "ansvarskod")
    );

    const passengersRaw = pickFirst(body, "passengers", "pax", "antal", "antal_resenarer", "antal_resenärer");
    const passengers = passengersRaw == null ? null : Number(passengersRaw) || 0;

    const departure_place = _t(
      pickFirst(body, "departure_place", "from", "fran", "avreseplats", "avresa", "start")
    );
    const destination = _t(
      pickFirst(body, "destination", "to", "till", "mal", "mål")
    );

    const departure_date = _t(
      pickFirst(body, "departure_date", "date", "datum", "start_date")
    );
    const departure_time = tidyTime(
      _t(pickFirst(body, "departure_time", "time", "tid", "start_time"))
    );

    const stopover_places = _t(
      pickFirst(body, "stopover_places", "via", "stopp", "stopovers", "hållplatser")
    );

    // retur (frivillig)
    const return_departure = _t(
      pickFirst(body, "return_departure", "retur_fran", "retur_from", "retur_avresa")
    );
    const return_destination = _t(
      pickFirst(body, "return_destination", "retur_till", "retur_to", "retur_mal")
    );
    const return_date = _t(
      pickFirst(body, "return_date", "retur_datum", "returnDate")
    );
    const return_time = tidyTime(
      _t(pickFirst(body, "return_time", "retur_tid", "returnTime"))
    );

    const notes = _t(
      pickFirst(body, "notes", "ovrigt", "övrigt", "message", "meddelande", "freeNotes")
    );

    // Ombordkontakt → customer_reference (som du ville)
    const customer_reference = _t(
      pickFirst(body, "customer_reference", "onboardContact", "kontakt ombord", "contact_onboard")
    ) || contact_person;

    const customer_type = _t(pickFirst(body, "customer_type", "kundtyp")) || "privat";

    // --- Kravfält (svarar snyggt till admin-UI) --------------------------
    if (!looksFilled(contact_person)) {
      return res.status(400).json({ ok: false, error: "Kontaktperson (referens) saknas." });
    }
    if (!looksFilled(customer_email)) {
      return res.status(400).json({ ok: false, error: "E-postadress saknas eller är ogiltig." });
    }
    if (!passengers || passengers < 1) {
      return res.status(400).json({ ok: false, error: "Ange minst 1 passagerare." });
    }
    if (!looksFilled(departure_place) || !looksFilled(destination)) {
      return res.status(400).json({ ok: false, error: "Från/Till saknas." });
    }
    if (!looksFilled(departure_date)) {
      return res.status(400).json({ ok: false, error: "Datum saknas." });
    }

    // --- Offertnummer + rad ----------------------------------------------
    const offer_number = await nextOfferNumber();

    const row = {
      // system
      offer_number,
      offer_date: todayISO(),
      status: "inkommen" as const,

      // kund
      contact_person,
      customer_email,
      customer_phone,
      customer_reference,
      customer_name: contact_person,
      customer_type,
      invoice_ref,

      // körning
      passengers,
      departure_place,
      destination,
      departure_date,
      departure_time,
      stopover_places,

      // retur
      return_departure,
      return_destination,
      return_date,
      return_time,

      // övrigt
      notes,

      // här kan du lägga fler fält om din tabell har dem
    };

    const { offer, error } = await insertOffer(row);
    if (error || !offer) {
      console.error("[offert/create] insert error:", error);
      return res.status(500).json({ ok: false, error: "Kunde inte spara offert." });
    }

    // Publik länk + e-post
    const public_url = buildPublicUrl(offer);

    // 1) Kundkvitto (till kunden)
    try {
      await sendCustomerReceipt({
        to: customer_email!,
        from: process.env.MAIL_FROM || "Helsingbuss <no-reply@helsingbuss.se>",
        replyTo: process.env.EMAIL_REPLY_TO || undefined,
        offer,
        publicUrl: public_url,
      } as any);
    } catch (e: any) {
      console.error("[offert/create] sendCustomerReceipt failed:", e?.message || e);
      // vi fortsätter – internt mail skickas ändå
    }

    // 2) Internt larm (till OFFERS_INBOX)
    try {
      const internalTo =
        process.env.MAIL_FORCE_TO?.trim() ||
        process.env.OFFERS_INBOX?.trim() ||
        process.env.ADMIN_ALERT_EMAIL?.trim() ||
        "info@helsingbuss.se";

      await sendOfferMail({
        to: internalTo,
        from: process.env.MAIL_FROM || "Helsingbuss <no-reply@helsingbuss.se>",
        replyTo: customer_email || undefined, // så ni kan svara direkt
        offer,
        publicUrl: public_url,
      } as any);
    } catch (e: any) {
      console.error("[offert/create] sendOfferMail failed:", e?.message || e);
      // returnera ändå 200 – offerten finns i DB och publik länk funkar
    }

    return res.status(200).json({ ok: true, offer, public_url });
  } catch (e: any) {
    console.error("[offert/create] fatal:", e?.message || e);
    return res.status(500).json({ ok: false, error: "Serverfel" });
  }
}
