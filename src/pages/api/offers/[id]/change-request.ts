// src/pages/api/offers/[id]/change-request.ts
import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseAdmin";
import { Resend } from "resend";
import { buildOfferPublicLink, buildAdminOfferLink } from "@/lib/offerToken";

// ===== Typer =====
type OfferRow = {
  id: string;
  offer_number: string;
  status?: string | null;

  contact_person: string | null;
  customer_email: string | null;
  customer_phone: string | null;

  departure_place: string | null;
  destination: string | null;
  departure_date: string | null;
  departure_time: string | null;

  via: string | null;   // ✅ enligt din lista
  stop: string | null;  // ✅ enligt din lista

  return_departure: string | null;
  return_destination: string | null;
  return_date: string | null;
  return_time: string | null;

  notes?: string | null;
};

function isOfferRow(d: any): d is OfferRow {
  return d && typeof d === "object" && typeof d.id === "string" && typeof d.offer_number === "string";
}

const S = (v: unknown) => (v == null ? undefined : String(v));

// ===== ENV =====
const RESEND_API_KEY  = process.env.RESEND_API_KEY || "";
const MAIL_FROM       = process.env.MAIL_FROM || process.env.EMAIL_FROM || "Helsingbuss <info@helsingbuss.se>";
const EMAIL_REPLY_TO  = process.env.EMAIL_REPLY_TO || "kundteam@helsingbuss.se";
const OFFERS_INBOX    = process.env.OFFERS_INBOX || process.env.ADMIN_ALERT_EMAIL || "info@helsingbuss.se";
const MAIL_FORCE_TO   = process.env.MAIL_FORCE_TO || "";
const MAIL_BCC_ALL    = (process.env.MAIL_BCC_ALL || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// ===== Layout helpers (behåll look & feel) =====
const BRAND_COLOR   = "#194C66";
const BRAND_BG      = "#f5f4f0";
const BRAND_BG_SOFT = "#e5eef3";

function safeTo(to: string | string[]) {
  if (MAIL_FORCE_TO) return [MAIL_FORCE_TO];
  return Array.isArray(to) ? to : [to];
}
function escapeHtml(s: string) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]!));
}
function sectionTitle(txt: string) {
  return `<h2 style="margin:0 0 8px 0;font-size:16px;line-height:22px;color:${BRAND_COLOR};">${escapeHtml(txt)}</h2>`;
}
function kv(label: string, value?: string | number | null) {
  if (value == null || value === "") return "";
  return `<tr>
    <td style="padding:6px 10px;width:40%;color:#374151;font-size:14px;background:#fafafa;border-bottom:1px solid #f0f0f0;">${escapeHtml(label)}</td>
    <td style="padding:6px 10px;color:#111827;font-size:14px;border-bottom:1px solid #f0f0f0;">${escapeHtml(String(value))}</td>
  </tr>`;
}
function cta(href: string, label = "Öppna") {
  return `<div style="margin:16px 0 4px 0;">
    <a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:600;">
      ${escapeHtml(label)}
    </a>
  </div>
  <div style="font-size:12px;color:#6b7280;margin-top:6px;word-break:break-all;">Eller kopiera länken: <span>${escapeHtml(href)}</span></div>`;
}
function wrapHtml(opts: { title: string; preheader?: string; body: string }) {
  const { title, preheader = "", body } = opts;
  const pre = preheader
    ? `<span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</span>`
    : "";
  return `<!doctype html>
<html lang="sv"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/>
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;">
  ${pre}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.05);overflow:hidden;">
        <tr>
          <td style="background:${BRAND_COLOR};padding:16px 24px;">
            <div style="color:#fff;font-weight:700;font-size:18px;line-height:24px;">Helsingbuss</div>
            <div style="color:rgba(255,255,255,.9);font-size:12px;line-height:16px;">Komfort, säkerhet och omtanke</div>
          </td>
        </tr>
        <tr><td style="padding:24px;">${body}</td></tr>
        <tr>
          <td style="background:${BRAND_BG_SOFT};padding:16px 24px;color:#194c66;font-size:12px;line-height:18px;">
            Detta e-postmeddelande skickades av Helsingbuss. Behöver du hjälp?
            Svara på mailet eller kontakta <a href="mailto:${EMAIL_REPLY_TO}" style="color:${BRAND_COLOR};text-decoration:underline;">kundteamet</a>.
          </td>
        </tr>
      </table>
      <div style="color:#6b7280;font-size:11px;line-height:16px;margin-top:12px;">© ${new Date().getFullYear()} Helsingbuss</div>
    </td></tr>
  </table>
</body></html>`;
}

// ===== API =====
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!RESEND_API_KEY) return res.status(500).json({ error: "RESEND_API_KEY saknas i miljön" });

    const offerId = String(req.query.id || "");
    if (!offerId) return res.status(400).json({ error: "Saknar offert-id" });

    const { message, contact_email, customer_email, contact_person, phone } = (req.body || {}) as {
      message?: string;
      contact_email?: string;
      customer_email?: string;
      contact_person?: string;
      phone?: string;
    };

    if (!message || String(message).trim().length === 0) {
      return res.status(400).json({ error: "Skriv vad som ska ändras (message)" });
    }

    const { data, error } = await supabase
      .from("offers")
      .select([
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
        "return_departure",
        "return_destination",
        "return_date",
        "return_time",
        "notes",
      ].join(","))
      .eq("id", offerId)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!isOfferRow(data)) return res.status(500).json({ error: "Dataparsning misslyckades (OfferRow)" });

    const offer = data;
    const offerNumber = String(offer.offer_number || "—");
    const adminUrl    = buildAdminOfferLink(offer.id, offerNumber);
    const customerUrl = buildOfferPublicLink(offer.id, offerNumber);

    // ===== Mail till OFFERS_INBOX (admin) =====
    const subjectLine = `Ändringsförfrågan: ${offerNumber}`;
    const body = `
      <h1 style="margin:0 0 10px 0;font-size:20px;line-height:28px;color:#111;">Ändringsförfrågan</h1>

      ${sectionTitle("Offert")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;margin:0 0 12px 0;">
        ${kv("Offertnummer", offerNumber)}
        ${kv("Från", offer.departure_place)}
        ${kv("Till", offer.destination)}
        ${kv("Avresa datum", offer.departure_date)}
        ${kv("Avresa tid", offer.departure_time)}
        ${kv("Passagerare", offer.notes /* behålls; om du vill ha pax separat, lägg till kolumn i DB */)}
        ${kv("Via", offer.via)}      <!-- ✅ -->
        ${kv("Stopp", offer.stop)}   <!-- ✅ -->
        ${kv("Retur från", offer.return_departure)}
        ${kv("Retur till", offer.return_destination)}
        ${kv("Retur datum", offer.return_date)}
        ${kv("Retur tid", offer.return_time)}
      </table>

      ${sectionTitle("Meddelande från kund")}
      <div style="white-space:pre-wrap;color:#111827;font-size:14px;border:1px solid #eee;border-radius:10px;padding:12px;margin:0 0 12px 0;">
        ${escapeHtml(String(message))}
      </div>

      ${sectionTitle("Kontakt")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;margin:0 0 12px 0;">
        ${kv("Namn / referens", contact_person || offer.contact_person)}
        ${kv("E-post", contact_email || customer_email || offer.customer_email)}
        ${kv("Telefon", phone || offer.customer_phone)}
      </table>

      ${cta(adminUrl, "Öppna i Admin")}
      ${cta(customerUrl, "Visa kundvy")}
    `;
    const html = wrapHtml({
      title: subjectLine,
      preheader: `Offert ${offerNumber} – ändringsförfrågan`,
      body,
    });

    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: MAIL_FROM,
      to: safeTo(OFFERS_INBOX),
      subject: subjectLine,
      html,
      reply_to: EMAIL_REPLY_TO || undefined,
      bcc: MAIL_BCC_ALL.length ? MAIL_BCC_ALL : undefined,
    });

    // (Valfritt) bekräftelse till kund – låt vara avstängd tills du vill ha den
    // const customerTo = (contact_email || customer_email || offer.customer_email || "").trim();
    // if (customerTo.includes("@")) {
    //   const customerHtml = wrapHtml({
    //     title: `Vi har tagit emot din ändringsförfrågan (${offerNumber})`,
    //     preheader: "Tack! Vi återkommer så snart vi kan.",
    //     body: `
    //       <h1 style="margin:0 0 10px 0;font-size:20px;line-height:28px;color:#111;">Tack!</h1>
    //       <p style="margin:0 0 16px 0;color:#374151;font-size:14px;">Vi har mottagit din ändringsförfrågan för offert ${escapeHtml(offerNumber)}.</p>
    //       ${cta(customerUrl, "Visa din offert")}
    //     `
    //   });
    //   await resend.emails.send({
    //     from: MAIL_FROM,
    //     to: safeTo(customerTo),
    //     subject: `Vi har tagit emot din ändringsförfrågan (${offerNumber})`,
    //     html: customerHtml,
    //     reply_to: EMAIL_REPLY_TO || undefined,
    //   });
    // }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("[offers/change-request] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Serverfel" });
  }
}
