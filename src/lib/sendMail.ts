// src/lib/sendMail.ts
import { Resend } from "resend";
import { signOfferToken } from "@/lib/offerToken";

/* ============ ENV HELPERS ============ */
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const MAIL_FROM =
  process.env.MAIL_FROM?.trim() || "Helsingbuss <onboarding@resend.dev>";
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO?.trim() || undefined;

const OFFERS_INBOX = process.env.OFFERS_INBOX?.trim() || "";
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL?.trim() || "";
const MAIL_BCC_ALL = (process.env.MAIL_BCC_ALL || "")
  .split(/[;,]/)
  .map((s) => s.trim())
  .filter(Boolean);
const MAIL_FORCE_TO = (process.env.MAIL_FORCE_TO || "")
  .split(/[;,]/)
  .map((s) => s.trim())
  .filter(Boolean);

const resendClient = new Resend(RESEND_API_KEY);

/* ============ TYPES ============ */
export type SendReceiptParams = {
  to: string | string[];
  from?: string;
  replyTo?: string | string[];
  offerNumber?: string | null;
  offerId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  // valfritt extra innehåll
  htmlIntro?: string | null;
};

export type SendOfferParams = {
  to?: string | string[]; // default: OFFERS_INBOX / ADMIN_ALERT_EMAIL
  from?: string;
  replyTo?: string | string[];
  offerId: string;
  offerNumber?: string | null;
  summary?: string | null; // t.ex. sträcka/kund
};

/* ============ UTIL ============ */
function arr(v?: string | string[]): string[] {
  if (!v) return [];
  return Array.isArray(v)
    ? v.filter(Boolean)
    : v
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean);
}

/** Respekt för MAIL_FORCE_TO: om satt skickar vi endast dit. */
function computeTo(original: string | string[]): string[] {
  const originalList = arr(original);
  if (MAIL_FORCE_TO.length > 0) return MAIL_FORCE_TO;
  return originalList.length ? originalList : MAIL_FORCE_TO; // fallback om original var tomt
}

function brandLink(href: string, label: string) {
  return `<a href="${href}" style="color:#194C66;text-decoration:none">${label}</a>`;
}

/** Publik länk till offert (JWT-baserad): /offert/[id]?t=... */
export function buildOfferPublicLink(baseUrl: string, offerId: string, offerNumber?: string | null) {
  const payload: Record<string, any> = { sub: offerId };
  if (offerNumber) payload.no = offerNumber;
  const token = signOfferToken(payload, "14d");
  const url = new URL(`/offert/${encodeURIComponent(offerId)}`, baseUrl);
  if (token) url.searchParams.set("t", token);
  return url.toString();
}

/* ============ EMAIL BUILDERS (enkla, icke-intrusiva) ============ */

function customerReceiptHtml(p: SendReceiptParams) {
  const appBase =
    process.env.NEXT_PUBLIC_LOGIN_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://login.helsingbuss.se";
  const link = buildOfferPublicLink(
    appBase,
    p.offerId,
    p.offerNumber ?? null
  );

  const intro =
    p.htmlIntro ??
    `Vi har tagit emot din offertförfrågan${
      p.offerNumber ? ` (${p.offerNumber})` : ""
    }.`;

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111827">
    <h2 style="margin:0 0 8px 0;color:#194C66">Tack för din förfrågan!</h2>
    <p style="margin:0 0 12px 0">${intro}</p>
    <p style="margin:0 0 12px 0">Du kan följa och bekräfta din offert via knappen nedan:</p>
    <p style="margin:16px 0">
      <a href="${link}" style="display:inline-block;background:#194C66;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none">Visa offert</a>
    </p>
    ${
      p.customerPhone || p.customerEmail
        ? `<p style="margin:16px 0 0 0;font-size:14px;color:#374151">
            Kontaktuppgifter: ${
              [p.customerEmail, p.customerPhone].filter(Boolean).join(" · ")
            }
          </p>`
        : ""
    }
    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" />
    <p style="margin:0;font-size:12px;color:#6b7280">
      Behöver du hjälp? Svara på detta e-postmeddelande eller besök ${brandLink(
        "https://helsingbuss.se",
        "helsingbuss.se"
      )}.
    </p>
  </div>`;
}

function internalOfferHtml(p: SendOfferParams) {
  const appBase =
    process.env.NEXT_PUBLIC_LOGIN_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://login.helsingbuss.se";
  const link = buildOfferPublicLink(
    appBase,
    p.offerId,
    p.offerNumber ?? null
  );

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111827">
    <h2 style="margin:0 0 8px 0;color:#194C66">Ny offertförfrågan${
      p.offerNumber ? ` (${p.offerNumber})` : ""
    }</h2>
    ${
      p.summary
        ? `<p style="margin:0 0 12px 0">${p.summary}</p>`
        : `<p style="margin:0 0 12px 0">En ny offert har inkommit.</p>`
    }
    <p style="margin:16px 0">
      <a href="${link}" style="display:inline-block;background:#194C66;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none">Öppna offert</a>
    </p>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" />
    <p style="margin:0;font-size:12px;color:#6b7280">
      Automatiskt utskick från Helsingbuss Portal.
    </p>
  </div>`;
}

/* ============ SENDERS (overloads som accepterar 1 eller 2 argument) ============ */

// --- sendCustomerReceipt ---
export async function sendCustomerReceipt(params: SendReceiptParams): Promise<any>;
export async function sendCustomerReceipt(resend: Resend, params: SendReceiptParams): Promise<any>;
export async function sendCustomerReceipt(a: any, b?: any): Promise<any> {
  const hasTwo = !!b;
  const resend = (hasTwo ? a : resendClient) as Resend;
  const p = (hasTwo ? b : a) as SendReceiptParams;

  const toList = computeTo(p.to);
  if (toList.length === 0) {
    throw new Error("sendCustomerReceipt: mottagare saknas");
  }

  const from = p.from || MAIL_FROM;
  const replyTo = p.replyTo || EMAIL_REPLY_TO;

  const subject =
    (p.offerNumber
      ? `Din offertförfrågan (${p.offerNumber}) är mottagen – Helsingbuss`
      : `Din offertförfrågan är mottagen – Helsingbuss`);

  return resend.emails.send({
    from,
    to: toList,
    reply_to: replyTo,
    subject,
    html: customerReceiptHtml(p),
    bcc: MAIL_FORCE_TO.length ? undefined : MAIL_BCC_ALL,
  });
}

// --- sendOfferMail ---
export async function sendOfferMail(params: SendOfferParams): Promise<any>;
export async function sendOfferMail(resend: Resend, params: SendOfferParams): Promise<any>;
export async function sendOfferMail(a: any, b?: any): Promise<any> {
  const hasTwo = !!b;
  const resend = (hasTwo ? a : resendClient) as Resend;
  const p = (hasTwo ? b : a) as SendOfferParams;

  // internt: default till OFFERS_INBOX + ADMIN_ALERT_EMAIL
  const defaults = [OFFERS_INBOX, ADMIN_ALERT_EMAIL].filter(Boolean);
  const toList = computeTo(p.to ?? defaults);
  if (toList.length === 0) {
    throw new Error("sendOfferMail: mottagare saknas");
  }

  const from = p.from || MAIL_FROM;
  const replyTo = p.replyTo || EMAIL_REPLY_TO;

  const subject =
    (p.offerNumber
      ? `Ny offertförfrågan (${p.offerNumber})`
      : `Ny offertförfrågan`);

  return resend.emails.send({
    from,
    to: toList,
    reply_to: replyTo,
    subject,
    html: internalOfferHtml(p),
    bcc: MAIL_FORCE_TO.length ? undefined : MAIL_BCC_ALL,
  });
}
