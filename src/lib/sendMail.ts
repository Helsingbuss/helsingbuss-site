// src/lib/sendMail.ts
// Exponerar sendOfferMail + sendCustomerReceipt (named exports) och typen SendOfferParams.

import { Resend } from "resend";
import { renderOfferEmail, type OfferEmailData } from "./mailTemplates";

// ===== ENV helpers =====
const env = (k: string, fb?: string) =>
  process.env[k] && process.env[k]!.trim() !== "" ? process.env[k]! : (fb ?? "");

const RESEND_API_KEY = env("RESEND_API_KEY", "");
const MAIL_FROM = env("MAIL_FROM", env("EMAIL_FROM", "Helsingbuss <info@helsingbuss.se>"));
const EMAIL_REPLY_TO = env("EMAIL_REPLY_TO", "");
const OFFERS_INBOX = env("OFFERS_INBOX", env("ADMIN_ALERT_EMAIL", MAIL_FROM));
const MAIL_FORCE_TO = env("MAIL_FORCE_TO", "");
const MAIL_BCC_ALL = env("MAIL_BCC_ALL", "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const CUSTOMER_BASE_URL = env("NEXT_PUBLIC_CUSTOMER_BASE_URL", env("CUSTOMER_BASE_URL", "https://kund.helsingbuss.se"));
const LOGIN_BASE_URL    = env("NEXT_PUBLIC_LOGIN_BASE_URL",    env("LOGIN_BASE_URL",    "https://login.helsingbuss.se"));

const safeTo = (to: string | string[]) => (MAIL_FORCE_TO ? [MAIL_FORCE_TO] : Array.isArray(to) ? to : [to]);

// ===== Types =====
export type SendOfferParams = {
  offerId: string;
  offerNumber: string;

  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;

  from?: string; to?: string; date?: string; time?: string;
  passengers?: number;

  via?: string;  // ✅ nya fält
  stop?: string; // ✅ nya fält

  return_from?: string;
  return_to?: string;
  return_date?: string;
  return_time?: string;

  notes?: string;

  adminUrl?: string;
  customerUrl?: string;
  subject?: string;
};

// ===== Link helpers (fallback om API:et inte skickar färdiga länkar) =====
function adminLinkFallback(offerNumber: string) {
  const base = LOGIN_BASE_URL.replace(/\/+$/, "");
  // Du bad att adminknappen ska gå till /start
  return `${base}/start`;
}
function customerLinkFallback(offerNumber: string) {
  const base = CUSTOMER_BASE_URL.replace(/\/+$/, "");
  return `${base}/offert/${encodeURIComponent(offerNumber)}`;
}

// ===== Core: sendOfferMail =====
export async function sendOfferMail(p: SendOfferParams) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY saknas");
  }

  const resend = new Resend(RESEND_API_KEY);

  const adminUrl    = p.adminUrl    || adminLinkFallback(p.offerNumber);
  const customerUrl = p.customerUrl || customerLinkFallback(p.offerNumber);

  const data: OfferEmailData = {
    id: p.offerId,
    number: p.offerNumber,

    customerEmail: p.customerEmail,
    customerName:  p.customerName,
    customerPhone: p.customerPhone,

    from: p.from,
    to: p.to,
    date: p.date,
    time: p.time,
    passengers: p.passengers,

    via:  p.via,
    stop: p.stop,

    return_from: p.return_from,
    return_to:   p.return_to,
    return_date: p.return_date,
    return_time: p.return_time,

    notes: p.notes,

    adminUrl,
    customerUrl,
    subject: p.subject,
  };

  const { htmlForAdmin, htmlForCustomer, subjectForAdmin, subjectForCustomer } =
    renderOfferEmail(data);

  // 1) Admin (OFFERS_INBOX)
  await resend.emails.send({
    from: MAIL_FROM,
    to: safeTo(OFFERS_INBOX || MAIL_FROM),
    subject: subjectForAdmin,
    html: htmlForAdmin,
    reply_to: EMAIL_REPLY_TO || undefined,
    bcc: MAIL_BCC_ALL.length ? MAIL_BCC_ALL : undefined,
  });

  // 2) Kund (om e-post finns)
  if (data.customerEmail && data.customerEmail.includes("@")) {
    await resend.emails.send({
      from: MAIL_FROM,
      to: safeTo(data.customerEmail),
      subject: subjectForCustomer,
      html: htmlForCustomer,
      reply_to: EMAIL_REPLY_TO || undefined,
    });
  }
}

// ===== Optional: kvitto till kund vid nyoffert =====
export type CustomerReceiptParams = {
  to: string;
  offerNumber: string;
  customerUrl?: string;
  subject?: string;
  message?: string;
};

export async function sendCustomerReceipt(p: CustomerReceiptParams) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY saknas");
  }
  const resend = new Resend(RESEND_API_KEY);
  const customerUrl = p.customerUrl || customerLinkFallback(p.offerNumber);
  const subject = p.subject || `Vi har mottagit din offertförfrågan – ${p.offerNumber}`;

  const html = `<!doctype html><html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <h1 style="font-size:20px;margin:0 0 10px 0;color:#111;">Tack för din förfrågan</h1>
    <p style="font-size:14px;color:#374151;margin:0 0 14px 0;">${esc(p.message || "Vi återkommer inom kort med svar.")}</p>
    <p style="margin:0 0 10px 0;"><a href="${customerUrl}">Visa din offert (${p.offerNumber})</a></p>
  </body></html>`;

  await resend.emails.send({
    from: MAIL_FROM,
    to: safeTo(p.to),
    subject,
    html,
    reply_to: EMAIL_REPLY_TO || undefined,
  });
}

// Hjälpfunktion för kvitto-html
function esc(s: any) {
  return s == null ? "" : String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
}

// Behåll kompatibilitet med äldre importer som använde default
export default sendOfferMail;
