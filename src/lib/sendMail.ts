// src/lib/sendMail.ts
import { Resend } from "resend";
import sg from "@sendgrid/mail";
import nodemailer from "nodemailer";

/** Inparametrar för utskick när en offert skapas */
export type SendOfferParams = {
  offerId: string;
  offerNumber: string;     // t.ex. HB251234
  customerEmail: string;

  customerName?: string | null;
  customerPhone?: string | null;

  from?: string | null;
  to?: string | null;
  date?: string | null;    // YYYY-MM-DD
  time?: string | null;    // HH:mm
  passengers?: number | null;
  via?: string | null;
  onboardContact?: string | null;

  return_from?: string | null;
  return_to?: string | null;
  return_date?: string | null;
  return_time?: string | null;

  notes?: string | null;
};

/** Avsändare och admin-adress */
const FROM  = process.env.MAIL_FROM || "Helsingbuss <no-reply@helsingbuss.se>";
const ADMIN = process.env.ADMIN_ALERT_EMAIL || "";

/** Leverantörsväljare med debug */
function pickProvider() {
  const haveResend   = !!process.env.RESEND_API_KEY;
  const haveSendgrid = !!process.env.SENDGRID_API_KEY;
  const haveSmtp     =
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_PORT &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS;

  const provider =
    haveResend ? "resend" :
    haveSendgrid ? "sendgrid" :
    haveSmtp ? "smtp" : null;

  if (!provider) {
    throw new Error(
      "Ingen mejlkonfiguration: sätt RESEND_API_KEY eller SENDGRID_API_KEY eller SMTP_* i miljövariabler."
    );
  }

  console.log("[sendMail] provider:", provider, {
    hasResend: haveResend,
    hasSendgrid: haveSendgrid,
    hasSmtp: haveSmtp,
    from: FROM,
    adminSet: !!ADMIN,
  });

  return provider as "resend" | "sendgrid" | "smtp";
}

async function sendWithResend(args: { to: string; subject: string; html: string; text: string; }) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  try {
    const r = await resend.emails.send({
      from: FROM,          // måste vara verifierad domän i Resend
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    // Resend SDK returnerar { data?: { id: string }, error?: ... }
    const id = (r as any)?.data?.id ?? (r as any)?.id ?? "no-id";
    console.log("[sendMail] Resend OK:", id);
  } catch (e: any) {
    console.error("[sendMail] Resend FAIL:", e?.message || e);
    throw e;
  }
}

async function sendWithSendgrid(args: { to: string; subject: string; html: string; text: string; }) {
  try {
    sg.setApiKey(process.env.SENDGRID_API_KEY!);
    const [resp] = await sg.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    console.log("[sendMail] SendGrid OK:", resp?.statusCode);
  } catch (e: any) {
    console.error("[sendMail] SendGrid FAIL:", e?.message || e);
    throw e;
  }
}

async function sendWithSMTP(args: { to: string; subject: string; html: string; text: string; }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });

  try {
    const info = await transporter.sendMail({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    console.log("[sendMail] SMTP OK:", info?.messageId);
  } catch (e: any) {
    console.error("[sendMail] SMTP FAIL:", e?.message || e);
    throw e;
  }
}

/** === Template helpers === */
function safe(v?: string | null) { return (v ?? "").trim() || "—"; }

function tripBlock(p: SendOfferParams) {
  const first =
    `<b>Från:</b> ${safe(p.from)}<br/>` +
    `<b>Till:</b> ${safe(p.to)}<br/>` +
    `<b>Datum:</b> ${safe(p.date)}<br/>` +
    `<b>Tid:</b> ${safe(p.time)}<br/>` +
    `<b>Passagerare:</b> ${p.passengers ?? "—"}<br/>` +
    (p.via ? `<b>Via:</b> ${safe(p.via)}<br/>` : "") +
    (p.onboardContact ? `<b>Kontakt ombord:</b> ${safe(p.onboardContact)}<br/>` : "");

  const ret =
    p.return_from || p.return_to || p.return_date || p.return_time
      ? `<hr style="border:none;border-top:1px solid #eee;margin:12px 0" />
         <div style="font-weight:600;margin-bottom:4px">Retur</div>
         <b>Från:</b> ${safe(p.return_from)}<br/>
         <b>Till:</b> ${safe(p.return_to)}<br/>
         <b>Datum:</b> ${safe(p.return_date)}<br/>
         <b>Tid:</b> ${safe(p.return_time)}<br/>`
      : "";

  return `<div>${first}</div>${ret}`;
}

function renderAdminHtml(p: SendOfferParams) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111">
    <h2 style="margin:0 0 8px 0">Ny offertförfrågan</h2>
    <div><b>Offert-ID:</b> ${safe(p.offerNumber)}</div>
    <div><b>Beställare:</b> ${safe(p.customerName)}</div>
    <div><b>E-post:</b> ${safe(p.customerEmail)}</div>
    <div><b>Telefon:</b> ${safe(p.customerPhone)}</div>
    <hr style="border:none;border-top:1px solid #eee;margin:12px 0" />
    <div style="font-weight:600;margin-bottom:4px">Reseinformation</div>
    ${tripBlock(p)}
    ${
      p.notes
        ? `<hr style="border:none;border-top:1px solid #eee;margin:12px 0" />
           <div style="font-weight:600;margin-bottom:4px">Övrigt</div>
           <div>${safe(p.notes)}</div>`
        : ""
    }
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
    <div style="color:#6b7280;font-size:12px">Automatiskt från Helsingbuss Portal.</div>
  </div>`;
}

function renderCustomerHtml(p: SendOfferParams) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111">
    <h2 style="margin:0 0 8px 0">Tack! Vi har mottagit din offertförfrågan</h2>
    <div><b>Ärendenummer:</b> ${safe(p.offerNumber)}</div>
    <p>Vi återkommer så snart vi har gått igenom uppgifterna.</p>
    <div style="font-weight:600;margin:12px 0 4px">Sammanfattning</div>
    ${tripBlock(p)}
    ${ p.notes ? `<div style="margin-top:8px"><b>Övrigt:</b><br/>${safe(p.notes)}</div>` : "" }
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
    <div style="color:#6b7280;font-size:12px">Detta är ett automatiskt bekräftelsemejl – svara gärna om du vill komplettera något.</div>
  </div>`;
}

function renderText(p: SendOfferParams) {
  const lines = [
    `Offert: ${p.offerNumber}`,
    `Beställare: ${p.customerName || "-"}`,
    `E-post: ${p.customerEmail}`,
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
    lines.push("", "Retur",
      `Från: ${p.return_from || "-"}`,
      `Till: ${p.return_to || "-"}`,
      `Datum: ${p.return_date || "-"}`,
      `Tid: ${p.return_time || "-"}`
    );
  }
  if (p.notes) lines.push("", "Övrigt", p.notes);
  return lines.join("\n");
}

/** Skicka två mejl: admin + kund */
export async function sendOfferMail(p: SendOfferParams) {
  const provider = pickProvider();
  const send =
    provider === "resend"   ? sendWithResend :
    provider === "sendgrid" ? sendWithSendgrid :
    sendWithSMTP;

  const adminSubject    = `Ny offertförfrågan ${p.offerNumber}`;
  const customerSubject = `Tack! Vi har mottagit din offertförfrågan (${p.offerNumber})`;

  const htmlAdmin    = renderAdminHtml(p);
  const htmlCustomer = renderCustomerHtml(p);
  const text         = renderText(p);

  // Admin
  if (ADMIN) {
    await send({ to: ADMIN, subject: adminSubject, html: htmlAdmin, text });
  } else {
    console.warn("[sendMail] ADMIN_ALERT_EMAIL saknas – skickar inget adminmail.");
  }

  // Kund
  if (p.customerEmail && /\S+@\S+\.\S+/.test(p.customerEmail)) {
    await send({ to: p.customerEmail, subject: customerSubject, html: htmlCustomer, text });
  } else {
    console.warn("[sendMail] Ogiltig kundadress – skickar inget kundmail.", { email: p.customerEmail });
  }

  return { ok: true as const, provider };
}
