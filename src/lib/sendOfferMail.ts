// src/lib/sendOfferMail.ts
import { Resend } from "resend";
import { createOfferToken } from "@/lib/offerToken";

export type SendOfferParams = {
  offerId: string;
  offerNumber: string;
  customerEmail: string; // <— camelCase

  customerName?: string | null;
  customerPhone?: string | null;

  from?: string | null;
  to?: string | null;
  date?: string | null;
  time?: string | null;
  passengers?: number | null;
  via?: string | null;
  onboardContact?: string | null;

  return_from?: string | null;
  return_to?: string | null;
  return_date?: string | null;
  return_time?: string | null;

  notes?: string | null;
};

const env = (v?: string | null) => (v ?? "").toString().trim();

const RESEND_KEY    = env(process.env.RESEND_API_KEY);

// — avsändaradresser —
const FROM_PRIMARY  = env(process.env.MAIL_FROM)
  || env(process.env.EMAIL_FROM)
  || "Helsingbuss <onboarding@resend.dev>";

const FROM_FALLBACK = env(process.env.RESEND_FROM_FALLBACK)
  || "Helsingbuss <onboarding@resend.dev>";

const REPLY_TO      = env(process.env.EMAIL_REPLY_TO);

// — mottagare/konfiguration —
const OFFERS_INBOX  = env(process.env.OFFERS_INBOX);       // ex. offert@helsingbuss.se
const ADMIN_ALERT   = env(process.env.ADMIN_ALERT_EMAIL);  // fallback om OFFERS_INBOX saknas
const FORCE_TO      = env(process.env.MAIL_FORCE_TO);      // endast för test (töm i drift)
const BCC_ALL       = env(process.env.MAIL_BCC_ALL);       // global bcc (töm i drift)

// — bas-URL:er —
const CUSTOMER_BASE_URL =
  env(process.env.CUSTOMER_BASE_URL)
  || env(process.env.NEXT_PUBLIC_CUSTOMER_BASE_URL)
  || "https://kund.helsingbuss.se";

const ADMIN_BASE =
  env(process.env.NEXT_PUBLIC_LOGIN_BASE_URL)
  || env(process.env.NEXT_PUBLIC_BASE_URL)
  || "https://login.helsingbuss.se";

// — varumärkesfärger/branding i mailen —
const BRAND = {
  name: "Helsingbuss",
  logoUrl: env(process.env.MAIL_BRAND_LOGO_URL) || "https://helsingbuss.se/assets/mail/logo-helsingbuss.png",
  primary: env(process.env.MAIL_BRAND_COLOR) || "#1D2937",
  primaryText: env(process.env.MAIL_BRAND_TEXT_COLOR) || "#ffffff",
  border: "#e5e7eb",
  muted: "#6b7280",
};

const safe = (v?: string | null) => (v ?? "").toString().trim() || "—";
const isValidEmail = (e?: string | null) => !!e && /\S+@\S+\.\S+/.test(e);
const looksLikePlaceholder = (e: string) => /^(e-?post|email|e-?mail)$/i.test(e.trim());
const sanitizeEmail = (raw?: string | null) => {
  const e = (raw ?? "").trim();
  if (!e || looksLikePlaceholder(e)) return "";
  return e;
};

function buildCustomerUrl(offerId: string, offerNumber: string) {
  const base = CUSTOMER_BASE_URL.replace(/\/+$/, "");
  const token = createOfferToken({ sub: offerId, no: offerNumber, role: "customer" }, "14d");
  // inkluderar både 'token' och 't' för kompatibilitet
  return `${base}/offert/${encodeURIComponent(offerNumber)}?view=inkommen&token=${encodeURIComponent(token)}&t=${encodeURIComponent(token)}`;
}

function adminStartUrl() {
  const base = ADMIN_BASE.replace(/\/+$/, "");
  return `${base}/start`;
}

function tripBlockHtml(p: SendOfferParams) {
  const rows: string[] = [];
  const row = (label: string, value?: string | null) => `
    <tr>
      <td style="padding:6px 0;color:#111;font-weight:600;width:160px;vertical-align:top">${label}</td>
      <td style="padding:6px 0;color:#111">${safe(value)}</td>
    </tr>`;
  rows.push(row("Från", p.from));
  rows.push(row("Till", p.to));
  rows.push(row("Datum", p.date));
  rows.push(row("Tid", p.time));
  rows.push(row("Passagerare", (p.passengers ?? "—").toString()));
  if (p.via) rows.push(row("Via", p.via));
  if (p.onboardContact) rows.push(row("Kontakt ombord", p.onboardContact));

  const ret: string[] = [];
  if (p.return_from || p.return_to || p.return_date || p.return_time) {
    ret.push(
      `<div style="font-weight:600;margin:14px 0 6px">Retur</div>`,
      row("Från", p.return_from),
      row("Till", p.return_to),
      row("Datum", p.return_date),
      row("Tid", p.return_time)
    );
  }

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
      <tbody>
        ${rows.join("")}
        ${ret.join("")}
      </tbody>
    </table>`;
}

function renderWrapper(inner: string, heading?: string, sub?: string, cta?: { href: string; label: string }) {
  const ctaBtn = cta ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 4px">
      <tr>
        <td>
          <a href="${cta.href}"
             style="display:inline-block;background:${BRAND.primary};color:${BRAND.primaryText};text-decoration:none;
                    padding:12px 18px;border-radius:10px;font-weight:700">
            ${cta.label}
          </a>
        </td>
      </tr>
    </table>` : "";

  const logo = BRAND.logoUrl ? `
    <div style="text-align:left;margin-bottom:12px">
      <img src="${BRAND.logoUrl}" alt="${BRAND.name}" height="36" style="display:block"/>
    </div>` : "";

  const subline = sub ? `<div style="color:${BRAND.muted};margin-top:6px">${sub}</div>` : "";

  return `
  <div style="background:#f7f7f8;padding:24px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="width:100%;max-width:640px;border-collapse:collapse">
      <tr>
        <td style="padding:0 16px">
          ${logo}
          <div style="background:#fff;border:1px solid ${BRAND.border};border-radius:14px;padding:22px">
            ${heading ? `<h2 style="margin:0 0 6px 0;color:#111;font-size:20px">${heading}</h2>` : ""}
            ${subline}
            <div style="margin-top:14px">${inner}</div>
            ${ctaBtn}
          </div>
          <div style="color:${BRAND.muted};font-size:12px;margin-top:12px;text-align:left">
            ${BRAND.name} • Detta är ett automatiskt meddelande – svara gärna om du vill komplettera något.
          </div>
        </td>
      </tr>
    </table>
  </div>`;
}

function renderAdminHtml(p: SendOfferParams) {
  const inner = `
    <div style="margin:0 0 12px 0"><b>Offert-ID:</b> ${safe(p.offerNumber)}</div>
    <div><b>Beställare:</b> ${safe(p.customerName)}${p.customerPhone ? `, ${safe(p.customerPhone)}` : ""}</div>
    <div><b>E-post:</b> ${safe(isValidEmail(p.customerEmail) ? p.customerEmail : "")}</div>
    <div><b>Telefon:</b> ${safe(p.customerPhone)}</div>
    <hr style="border:none;border-top:1px solid ${BRAND.border};margin:16px 0"/>
    <div style="font-weight:600;margin-bottom:6px">Reseinformation</div>
    ${tripBlockHtml(p)}
    ${p.notes ? `
      <hr style="border:none;border-top:1px solid ${BRAND.border};margin:16px 0"/>
      <div style="font-weight:600;margin-bottom:6px">Övrigt</div>
      <div>${safe(p.notes)}</div>` : ""}`;
  const cta = { href: adminStartUrl(), label: "Öppna Admin" };
  return renderWrapper(inner, "Ny offertförfrågan", undefined, cta);
}

function renderCustomerHtml(p: SendOfferParams) {
  const inner = `
    <div style="margin-bottom:8px"><b>Ärendenummer:</b> ${safe(p.offerNumber)}</div>
    <p style="margin:0 0 10px 0">Tack! Vi återkommer så snart vi har gått igenom uppgifterna.</p>
    <div style="font-weight:600;margin:12px 0 6px">Sammanfattning</div>
    ${tripBlockHtml(p)}
    ${p.notes ? `<div style="margin-top:8px"><b>Övrig information:</b><br/>${safe(p.notes)}</div>` : ""}`;
  const href = buildCustomerUrl(p.offerId, p.offerNumber);
  const cta = { href, label: "Visa din offert" };
  return renderWrapper(inner, "Vi har mottagit din offertförfrågan", undefined, cta);
}

function renderText(p: SendOfferParams) {
  const lines = [
    `Offert: ${p.offerNumber}`,
    `Beställare: ${p.customerName || "-"}`,
    `E-post: ${isValidEmail(p.customerEmail) ? p.customerEmail : "-"}`,
    `Telefon: ${p.customerPhone || "-"}`,
    "",
    "Reseinformation",
    `Från: ${p.from || "-"}`,
    `Till: ${p.to || "-"}`,
    `Datum: ${p.date || "-"}`,
    `Tid: ${p.time || "-"}`,
    `Passagerare: ${p.passengers ?? "-"}`,
  ];
  if (p.via) lines.push(`Via: ${p.via}`);
  if (p.onboardContact) lines.push(`Kontakt ombord: ${p.onboardContact}`);
  if (p.return_from || p.return_to || p.return_date || p.return_time) {
    lines.push(
      "",
      "Retur",
      `Från: ${p.return_from || "-"}`,
      `Till: ${p.return_to || "-"}`,
      `Datum: ${p.return_date || "-"}`,
      `Tid: ${p.return_time || "-"}`
    );
  }
  lines.push("", buildCustomerUrl(p.offerId, p.offerNumber));
  return lines.join("\n");
}

async function sendViaResend(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  internal?: boolean;   // <— om true, använd fallback-from
  bcc?: string[];
}) {
  if (!RESEND_KEY) throw new Error("RESEND_API_KEY saknas");
  const resend = new Resend(RESEND_KEY);

  const from = args.internal ? FROM_FALLBACK : FROM_PRIMARY;

  const payload: any = {
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  };

  if (REPLY_TO) payload.reply_to = REPLY_TO;
  if (args.bcc?.length) payload.bcc = args.bcc;
  if (BCC_ALL) payload.bcc = Array.isArray(payload.bcc) ? [...payload.bcc, BCC_ALL] : [BCC_ALL];

  const r: any = await resend.emails.send(payload);
  if (r?.error) throw new Error(r.error?.message || "Resend error");
  return r;
}

export async function sendOfferMail(p: SendOfferParams) {
  const cleanCustomerEmail = sanitizeEmail(p.customerEmail);
  const params: SendOfferParams = { ...p, customerEmail: cleanCustomerEmail };

  const adminSubject    = `Ny offertförfrågan ${p.offerNumber}`;
  const customerSubject = `Tack! Vi har mottagit din offertförfrågan (${p.offerNumber})`;

  const htmlAdmin    = renderAdminHtml(params);
  const htmlCustomer = renderCustomerHtml(params);
  const text         = renderText(params);

  // 1) ADMIN -> endast OFFERS_INBOX (eller ADMIN_ALERT). INTE kundmejlet.
  const adminTo = OFFERS_INBOX || ADMIN_ALERT;
  if (adminTo) {
    await sendViaResend({
      to: adminTo,
      subject: adminSubject,
      html: htmlAdmin,
      text,
      internal: true,      // <— använd FROM_FALLBACK för interna @helsingbuss.se
      // OBS! ingen kund-bcc här
    });
  }

  // 2) KUND -> ENDAST kunden (ingen bcc till Offert).
  const toCustomer = FORCE_TO || cleanCustomerEmail;
  if (isValidEmail(toCustomer)) {
    await sendViaResend({
      to: toCustomer,
      subject: customerSubject,
      html: htmlCustomer,
      text,
      // Medvetet ingen bcc till OFFERS_INBOX här.
    });
  } else {
    console.warn("[sendOfferMail] Ogiltig kundadress – hoppar över kundmejl:", toCustomer);
  }

  return { ok: true as const, forced: !!FORCE_TO };
}
