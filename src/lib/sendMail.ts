// src/lib/sendMail.ts
import { Resend } from "resend";
import { buildAdminOfferLink, buildOfferPublicLink } from "@/lib/offerToken";

export type SendOfferParams = {
  offerId: string;
  offerNumber: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  from?: string;
  to?: string;
  date?: string;
  time?: string;
  passengers?: number;
  via?: string;   // ✅
  stop?: string;  // ✅
  return_from?: string;
  return_to?: string;
  return_date?: string;
  return_time?: string;
  notes?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const MAIL_FROM = process.env.MAIL_FROM || process.env.EMAIL_FROM || "Helsingbuss <info@helsingbuss.se>";
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "";
const OFFERS_INBOX = process.env.OFFERS_INBOX || process.env.ADMIN_ALERT_EMAIL || MAIL_FROM;
const MAIL_FORCE_TO = process.env.MAIL_FORCE_TO || "";
const MAIL_BCC_ALL = (process.env.MAIL_BCC_ALL || "").split(",").map(s=>s.trim()).filter(Boolean);

const BRAND_COLOR="#194C66", BRAND_BG="#f5f4f0", BRAND_BG_SOFT="#e5eef3";
const safeTo = (to: string|string[]) => (MAIL_FORCE_TO ? [MAIL_FORCE_TO] : Array.isArray(to) ? to : [to]);
const esc = (s?: string|number) => (s==null ? "" : String(s).replace(/[&<>"]/g,(c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]!)));
const kv = (k:string,v?:string|number) => v==null||v==="" ? "" : `<tr><td style="padding:6px 10px;width:40%;color:#374151;font-size:14px;background:#fafafa;border-bottom:1px solid #f0f0f0;">${esc(k)}</td><td style="padding:6px 10px;color:#111827;font-size:14px;border-bottom:1px solid #f0f0f0;">${esc(v)}</td></tr>`;
const cta = (href:string,label="Öppna") => `<div style="margin:16px 0 4px 0;"><a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:600;">${esc(label)}</a></div><div style="font-size:12px;color:#6b7280;margin-top:6px;word-break:break-all;">Eller kopiera länken: <span>${esc(href)}</span></div>`;
const wrap = (title:string, preheader:string, body:string) => `<!doctype html><html><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width"/><title>${esc(title)}</title></head><body style="margin:0;padding:0;background:${BRAND_BG};font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;">
<span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:24px 0;">
<tr><td align="center">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.05);overflow:hidden;">
    <tr><td style="background:${BRAND_COLOR};padding:16px 24px;"><div style="color:#fff;font-weight:700;font-size:18px;line-height:24px;">Helsingbuss</div><div style="color:rgba(255,255,255,.9);font-size:12px;line-height:16px;">Komfort, säkerhet och omtanke</div></td></tr>
    <tr><td style="padding:24px;">${body}</td></tr>
    <tr><td style="background:${BRAND_BG_SOFT};padding:16px 24px;color:#194c66;font-size:12px;line-height:18px;">Detta e-postmeddelande skickades av Helsingbuss. Frågor? Svara på mailet eller kontakta <a href="mailto:${EMAIL_REPLY_TO || "kundteam@helsingbuss.se"}" style="color:${BRAND_COLOR};text-decoration:underline;">kundteamet</a>.</td></tr>
  </table>
  <div style="color:#6b7280;font-size:11px;line-height:16px;margin-top:12px;">© ${new Date().getFullYear()} Helsingbuss</div>
</td></tr></table></body></html>`;

export async function sendOfferMail(p: SendOfferParams) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY saknas");
  const resend = new Resend(RESEND_API_KEY);

  const adminLink = buildAdminOfferLink(p.offerId, p.offerNumber);
  const custLink  = buildOfferPublicLink(p.offerId, p.offerNumber);

  const title = `Ny offertförfrågan – ${p.offerNumber}`;
  const body = `
    <h1 style="margin:0 0 10px 0;font-size:20px;line-height:28px;">Ny offertförfrågan</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;margin:0 0 12px 0;">
      ${kv("Kontakt", p.customerName)}
      ${kv("E-post", p.customerEmail)}
      ${kv("Telefon", p.customerPhone)}
      ${kv("Från", p.from)} ${kv("Till", p.to)}
      ${kv("Avresa", [p.date,p.time].filter(Boolean).join(" ")) }
      ${kv("Passagerare", p.passengers ?? undefined)}
      ${kv("Via", p.via)}             <!-- ✅ -->
      ${kv("Stopp", p.stop)}          <!-- ✅ -->
      ${kv("Retur från", p.return_from)}
      ${kv("Retur till", p.return_to)}
      ${kv("Retur", [p.return_date,p.return_time].filter(Boolean).join(" "))}
      ${kv("Övrigt", p.notes)}
    </table>
    ${cta(adminLink, "Öppna i Admin")}
    ${cta(custLink, "Öppna kundlänken")}
  `;

  await resend.emails.send({
    from: MAIL_FROM,
    to: safeTo(OFFERS_INBOX || MAIL_FROM),
    subject: title,
    html: wrap(title, `Offertförfrågan ${p.offerNumber}`, body),
    reply_to: EMAIL_REPLY_TO || undefined,
    bcc: MAIL_BCC_ALL.length ? MAIL_BCC_ALL : undefined,
  });

  // kundkvitto om adress finns
  if (p.customerEmail && /@/.test(p.customerEmail)) {
    await sendCustomerReceipt({
      to: p.customerEmail,
      offerId: p.offerId,
      offerNumber: p.offerNumber,
      name: p.customerName,
    });
  }
}

export async function sendCustomerReceipt(opts: {
  to: string;
  offerId: string;
  offerNumber: string;
  name?: string;
}) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY saknas");
  const resend = new Resend(RESEND_API_KEY);

  const custLink = buildOfferPublicLink(opts.offerId, opts.offerNumber);
  const title = `Tack – vi har mottagit din förfrågan (${opts.offerNumber})`;
  const body = `
    <p style="margin:0 0 8px 0;">Hej${opts.name ? " " + esc(opts.name) : ""}!</p>
    <p style="margin:0 0 12px 0;">Vi har tagit emot din offertförfrågan. Du kan följa ärendet via länken nedan.</p>
    ${cta(custLink, "Visa din offert")}
  `;

  await resend.emails.send({
    from: MAIL_FROM,
    to: safeTo(opts.to),
    subject: title,
    html: wrap(title, `Offert ${opts.offerNumber}`, body),
    reply_to: EMAIL_REPLY_TO || undefined,
  });
}
