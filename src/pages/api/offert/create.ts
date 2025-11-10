// src/pages/api/offert/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
import { sendOfferMail } from "@/lib/sendOfferMail";

// ⬇️ Extra: Resend-fallback om sendOfferMail skulle fallera
import { Resend } from "resend";

// Få en supabase-klient oavsett export i supabaseAdmin
const supabase =
  (admin as any).supabaseAdmin ||
  (admin as any).supabase ||
  (admin as any).default;

function toNull<T = any>(v: T | null | undefined): T | null {
  return v === "" || v === undefined ? null : (v as any);
}

function pickYmd(v?: string | null) {
  if (!v) return null;
  // accepterar "YYYY-MM-DD" eller en ISO-sträng
  return v.length >= 10 ? v.slice(0, 10) : v;
}

function parseNumber(n: any): number | null {
  if (typeof n === "number") return Number.isFinite(n) ? n : null;
  const t = Number(n);
  return Number.isFinite(t) ? t : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const p = req.body ?? {};

    // ---- Läs in fält från formuläret ----
    const customer_name: string | null = toNull(p.customer_name);
    const customer_email: string | null = toNull(p.customer_email);
    const customer_phone: string | null = toNull(p.customer_phone);

    // UI-fält (valfritt) “Kontaktperson ombord (namn och nummer)”
    const raw_onboard_contact: string | null = toNull(p.onboard_contact);

    // Rätt DB-kolumn: customer_reference
    const customer_reference: string | null =
      toNull(p.customer_reference) ?? raw_onboard_contact ?? customer_name;

    const internal_reference: string | null = toNull(p.internal_reference);

    const passengers: number | null = parseNumber(p.passengers);

    const departure_place: string | null = toNull(p.departure_place);
    const destination: string | null = toNull(p.destination);
    const departure_date: string | null = pickYmd(toNull(p.departure_date));
    const departure_time: string | null = toNull(p.departure_time);

    const return_departure: string | null = toNull(p.return_departure);
    const return_destination: string | null = toNull(p.return_destination);
    const return_date: string | null = pickYmd(toNull(p.return_date));
    const return_time: string | null = toNull(p.return_time);

    // Tidigare “via”, rätt kolumn i DB heter stopover_places
    const stopover_places: string | null = toNull(p.stopover_places ?? p.via);

    // Övrigt
    const notes: string | null = toNull(p.notes);

    // Minimal validering
    if (!customer_name || !customer_email) {
      return res
        .status(400)
        .json({ error: "customer_name och customer_email krävs" });
    }
    if (!departure_place || !destination) {
      // Inte hårt krav, men bra feedback om publika formuläret missar
      console.warn("create.ts: saknar departure_place/destination");
    }

    // ---- Offertnummer (HB25xxx) – samma logik som tidigare ----
    const { data: lastOffer } = await supabase
      .from("offers")
      .select("offer_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNumber = 7; // startvärde (HB25007)
    if (lastOffer?.offer_number) {
      const lastNum = parseInt(String(lastOffer.offer_number).replace("HB25", ""), 10);
      if (Number.isFinite(lastNum)) nextNumber = lastNum + 1;
    }
    const offer_number = `HB25${String(nextNumber).padStart(3, "0")}`;

    // ---- Spara i DB ----
    const nowIso = new Date().toISOString();

    const insertPayload: any = {
      offer_number,
      status: "inkommen",
      offer_date: nowIso.slice(0, 10),

      // kontakt
      contact_person: customer_name,
      contact_phone: customer_phone,
      contact_email: customer_email,

      // referenser
      customer_reference,
      internal_reference,

      // resa
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

      created_at: nowIso,
      updated_at: nowIso,
    };

    const { data: row, error: insErr } = await supabase
      .from("offers")
      .insert([insertPayload])
      .select("*")
      .single();

    if (insErr) throw insErr;

    // ---- Skicka mejl
    let mailOk = false;
    let mailError: string | null = null;

    try {
      // Din befintliga funktion (behåll!)
      await sendOfferMail({
        offerId: String(row.id ?? offer_number),
        offerNumber: String(offer_number),
        customerEmail: customer_email,

        customerName: customer_name,
        customerPhone: customer_phone,

        from: departure_place,
        to: destination,
        date: departure_date,
        time: departure_time,
        passengers,
        via: stopover_places,
        onboardContact: raw_onboard_contact,

        return_from: return_departure,
        return_to: return_destination,
        return_date,
        return_time,

        notes,
      });
      mailOk = true;
    } catch (err: any) {
      mailError = err?.message || String(err);
      console.warn("sendOfferMail (create offert) failed:", mailError);

      // ⬇️ Fallback via Resend om nyckel finns.
      try {
        const apiKey = process.env.RESEND_API_KEY;
        const from = process.env.EMAIL_FROM; // t.ex. "Helsingbuss <no-reply@helsingbuss.se>"
        const replyTo = process.env.EMAIL_REPLY_TO || "kundteam@helsingbuss.se";

        if (apiKey && from) {
          const resend = new Resend(apiKey);

          const previewUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/offert/${offer_number}?view=inkommen`;

          await resend.emails.send({
            from,
            to: customer_email!,
            reply_to: replyTo,
            subject: `Tack för din offertförfrågan – ${offer_number}`,
            text:
              `Hej ${customer_name || ""}!\n\n` +
              `Vi har tagit emot er offertförfrågan. Ni kan följa och granska den här: ${previewUrl}\n\n` +
              `Sammanfattning:\n` +
              `Från: ${departure_place || "-"}\n` +
              `Till: ${destination || "-"}\n` +
              `Datum: ${departure_date || "-"}\n` +
              `Tid: ${departure_time || "-"}\n` +
              `Passagerare: ${passengers ?? "-"}\n` +
              (return_date || return_time || return_departure || return_destination
                ? `\nRetur: ${return_departure || "-"} → ${return_destination || "-"} ` +
                  `(${return_date || "-"} ${return_time || "-"})\n`
                : "") +
              `\nHar du frågor eller vill justera något? Svara på detta mail eller kontakta oss på ${replyTo}.\n\n` +
              `Vänliga hälsningar,\nHelsingbuss`,
          });

          mailOk = true; // fallback lyckades
        }
      } catch (fallbackErr: any) {
        console.error("Resend fallback failed:", fallbackErr?.message || fallbackErr);
      }
    }

    return res.status(200).json({
      success: true,
      offer: row,
      mail: mailOk ? "sent" : (mailError ? `failed: ${mailError}` : "skipped"),
    });
  } catch (e: any) {
    console.error("/api/offert/create error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
