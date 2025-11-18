// src/pages/api/offert/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Typ för vad vi tar emot från formuläret
type OffertPayload = {
  contact_person: string;
  company_name?: string;
  customer_email: string;
  phone?: string;
  departure_place: string;
  destination: string;
  departure_date?: string;
  return_date?: string;
  passengers_adults?: number;
  passengers_children?: number;
  message?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body as Partial<OffertPayload>;

    // 1) Enklaste grundvalideringen
    if (!body.contact_person || !body.customer_email || !body.departure_place || !body.destination) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // 2) Spara i Supabase
    const { data: offer, error: dbError } = await supabaseAdmin
      .from("offers")
      .insert({
        contact_person: body.contact_person,
        company_name: body.company_name ?? null,
        customer_email: body.customer_email,
        phone: body.phone ?? null,
        departure_place: body.departure_place,
        destination: body.destination,
        departure_date: body.departure_date ?? null,
        return_date: body.return_date ?? null,
        passengers_adults: body.passengers_adults ?? null,
        passengers_children: body.passengers_children ?? null,
        message: body.message ?? null,
        status: "new", // new / review / sent / accepted / rejected
      })
      .select("*")
      .single();

    if (dbError || !offer) {
      console.error("Failed to insert offer:", dbError);
      return res.status(500).json({ error: "Failed to save offer" });
    }

    // 3) Skicka mail till admin
    const adminEmail = process.env.OFFERT_ADMIN_EMAIL || "info@helsingbuss.se";

    const adminHtml = `
      <h2>Ny offertförfrågan – Helsingbuss</h2>
      <p>En ny offertförfrågan har skickats in via hemsidan.</p>
      <p><strong>Kontaktperson:</strong> ${offer.contact_person}</p>
      <p><strong>Företag:</strong> ${offer.company_name ?? "-"}</p>
      <p><strong>E-post:</strong> ${offer.customer_email}</p>
      <p><strong>Telefon:</strong> ${offer.phone ?? "-"}</p>
      <p><strong>Från:</strong> ${offer.departure_place}</p>
      <p><strong>Till:</strong> ${offer.destination}</p>
      <p><strong>Utresa:</strong> ${offer.departure_date ?? "-"}</p>
      <p><strong>Återresa:</strong> ${offer.return_date ?? "-"}</p>
      <p><strong>Antal vuxna:</strong> ${offer.passengers_adults ?? "-"}</p>
      <p><strong>Antal barn:</strong> ${offer.passengers_children ?? "-"}</p>
      <p><strong>Meddelande:</strong><br/>${offer.message ?? "-"}</p>
      <hr/>
      <p>Logga in i portalen för att hantera offerten:<br/>
      <a href="${process.env.NEXT_PUBLIC_LOGIN_BASE_URL || "https://login.helsingbuss.se"}/admin/offers/${offer.id}">
        Öppna i Helsingbuss Portal 2025
      </a></p>
    `;

    try {
      await resend.emails.send({
        from: "Helsingbuss <no-reply@helsingbuss.se>",
        to: [adminEmail],
        subject: "Ny offertförfrågan från hemsidan",
        html: adminHtml,
      });
    } catch (emailErr) {
      console.error("Failed to send admin email:", emailErr);
      // vi returnerar ändå 200 eftersom offerten är sparad
    }

    // 4) Bekräftelsemail till kund
    const customerHtml = `
      <h2>Tack för din förfrågan – Helsingbuss</h2>
      <p>Hej ${offer.contact_person},</p>
      <p>Tack för att du skickade en offertförfrågan till Helsingbuss. Vi går nu igenom uppgifterna och återkommer med en offert så snart som möjligt.</p>
      <p><strong>Sammanfattning av din förfrågan:</strong></p>
      <ul>
        <li>Från: ${offer.departure_place}</li>
        <li>Till: ${offer.destination}</li>
        <li>Utresa: ${offer.departure_date ?? "-"}</li>
        <li>Återresa: ${offer.return_date ?? "-"}</li>
      </ul>
      <p>Har du frågor eller vill komplettera uppgifter? Svara bara på detta mail eller kontakta oss på telefon.</p>
      <p>Vänliga hälsningar,<br/>Helsingbuss</p>
    `;

    try {
      await resend.emails.send({
        from: "Helsingbuss <no-reply@helsingbuss.se>",
        to: [offer.customer_email],
        subject: "Vi har tagit emot din offertförfrågan",
        html: customerHtml,
      });
    } catch (emailErr) {
      console.error("Failed to send customer email:", emailErr);
      // fortfarande 200 – kärnfunktionen (spara offert) är klar
    }

    // 5) Svar till frontend
    return res.status(200).json({
      ok: true,
      offer_id: offer.id,
    });
  } catch (err) {
    console.error("Unexpected error in /api/offert/create:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
