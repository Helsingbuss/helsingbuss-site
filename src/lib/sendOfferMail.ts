import { Resend } from "resend";
import sg from "@sendgrid/mail";
import nodemailer from "nodemailer";
import { createOfferToken } from "./offerToken";

/** Inparametrar för utskick när en offert skapas */
export type SendOfferParams = {
  // Obligatoriskt
  offerId: string;
  offerNumber: string; // t.ex. HB251234
  customerEmail: string;

  // Valfritt men rekommenderat
  customerName?: string | null;
  customerPhone?: string | null;

  // Primär sträcka
  from?: string | null;
  to?: string | null;
  date?: string | null; // YYYY-MM-DD
  time?: string | null; // HH:mm
  passengers?: number | null;
  via?: string | null;
  onboardContact?: string | null;

  // Retur (om finns)
  return_from?: string | null;
  return_to?: string | null;
  return_date?: string | null;
  return_time?: string | null;

  // Övrigt
  notes?: string | null;

  // Extra (om du vill visa i adminmailet)
  customerReference?: string | null;
  internalReference?: string | null;
};

/** Välj avsändare och admin-adresser från env */
const FROM = process.env.MAIL_FROM || "Helsingbuss <no-reply@localhost>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "";
const OFFERS_INBOX = process.env.OFFERS_INBOX || process.env.MAIL_ADMIN || process.env.ADMIN_ALERT_EMAIL || "";
const FORCE_TO = process.env.MAIL_FORCE_TO || ""; // endast för test

/** === Leverantörsväljare (Resend → SendGrid → SMTP) === */
function pickProvider() {
  const haveResend = !!process.env.RESEND_API_KEY;
  const haveSendgrid = !!process.env.SENDGRID_API_KEY;
  const haveSmtp =
    !!process.env.SMTP_HOST &&
    !!process.env.SMTP_PORT &&
    !!process.env.SMTP_USER &&
    !!process.env.SMTP_PASS;

  if (haveResend) return "resend" as const;
  if (haveSendgrid) return "sendgrid" as const;
  if (haveSmtp) return "smtp" as const;
  throw new Error(
    "Ingen mejlkonfiguration hittades. Sätt RESEND_API_KEY eller SENDGRID_API_KEY eller SMTP_* i .env.local."
  );
}

/** === Skicka via vald leverantör, med Resend-error hantering === */
async function sendWithProvider(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  bcc?: string[];
}) {
  const prov = pickProvider();

  if (prov === "resend") {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const r = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
      ...(args.bcc?.length ? { bcc: args.bcc } : {}),
    } as any);
    if ((r as any)?.error) {
      throw new Error((r as any).error?.message || "Resend error");
    }
    return { provider: "resend" as const };
  }

  if (prov === "sendgrid") {
    sg.setApiKey(process.env.SENDGRID_API_KEY!);
    await sg.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
      ...(args.bcc?.length ? { bcc: args.bcc } : {}),
    } as any);
    return { provider: "sendgrid" as const };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  await transporter.sendMail({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    ...(args.bcc?.length ? { bcc: args.bcc } : {}),
  });
  return { provider: "smtp" as const };
}

/** === Helpers === */
function safe(v?: string | null) {
  return (v ?? "").toString().trim() || "—";
}

function resolveCustomerBase() {
  const u =
    process.env.CUSTOMER_BASE_URL ||
    process.env.NEXT_PUBLIC_CUSTOMER_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_LOGIN_BASE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "";
  if (!u) return "http://localhost:3000";
  return /^https?:\/\//i.test(u) ? u.replace(/\/+$/, "") : `https://${u}`.replace(/\/+$/, "");
}

function customerCtaHref(offerId: string, offerNumber: string) {
  const base = resolveCustomerBase();
  const t = createOfferToken({ sub: offerId, no: offerNumber, role: "customer" }, "14d");
  return `${base}/offert/${encodeURIComponent(offerNumber)}?view=inkommen&t=${encodeURIComponent(t)}`;
}

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

/** === Mail HTML (BEHÅLLER DIN DESIGN, adderar CTA-knapp för kund) === */
function renderAdminHtml(p: SendOfferParams) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111">
    <h2 style="margin:0 0 8px 0">Ny offertförfrågan</h2>
    <div><b>Offert-ID:</b> ${safe(p.offerNumber)}</div>
    <div><b>Beställare:</b> ${safe(p.customerName)}${p.customerPhone ? `, ${safe(p.customerPhone)}` : ""}</div>
    <div><b>E-post:</b> ${safe(p.customerEmail)}</div>
    ${p.customerReference ? `<div><b>Referens / PO-nummer:</b> ${safe(p.customerReference)}</div>` : ""}

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
    <div style="color:#6b7280;font-size:12px">
      Denna notifiering skickades automatiskt från Helsingbuss Portal.
    </div>
  </div>`;
}

function renderCustomerHtml(p: SendOfferParams) {
  const href = customerCtaHref(p.offerId, p.offerNumber);
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111">
    <h2 style="margin:0 0 8px 0">Tack! Vi har mottagit din offertförfrågan</h2>
    <div><b>Ärendenummer:</b> ${safe(p.offerNumber)}</div>

    <p>Vi återkommer så snart vi har gått igenom uppgifterna.</p>

    <div style="font-weight:600;margin:12px 0 4px">Sammanfattning</div>
    ${tripBlock(p)}

    ${
      p.notes
        ? `<div style="margin-top:8px"><b>Övrig information:</b><br/>${safe(p.notes)}</div>`
        : ""
    }

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:18px 0 6px">
      <tr>
        <td>
          <a href="${href}" style="display:inline-block;background:#1D2937;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">
            Visa din offert
          </a>
        </td>
      </tr>
    </table>

    <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
    <div style="color:#6b7280;font-size:12px">
      Helsingbuss • Detta är ett automatiskt bekräftelsemejl – svara gärna om du vill komplettera något.
    </div>
  </div>`;
}

function renderText(p: SendOfferParams) {
  const lines = [
    `Offert: ${p.offerNumber}`,
    `Beställare: ${p.customerName || "-"}`,
    `E-post: ${p.customerEmail}`,
    `Telefon: ${p.customerPhone || "-"}`,
    ...(p.customerReference ? [`Referens/PO: ${p.customerReference}`] : []),
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
  if (p.notes) {
    lines.push("", "Övrigt", p.notes);
  }
  lines.push("", customerCtaHref(p.offerId, p.offerNumber));
  return lines.join("\n");
}

/** Skicka två mejl: till admin (OFFERS_INBOX) och till kund (med CTA & token). */
export async function sendOfferMail(p: SendOfferParams) {
  const adminSubject = `Ny offertförfrågan ${p.offerNumber}`;
  const customerSubject = `Tack! Vi har mottagit din offertförfrågan (${p.offerNumber})`;

  const htmlAdmin = renderAdminHtml(p);
  const htmlCustomer = renderCustomerHtml(p);
  const text = renderText(p);

  // 1) Admin → alltid OFFERS_INBOX om satt, annars ADMIN_ALERT_EMAIL
  if (OFFERS_INBOX) {
    await sendWithProvider({
      to: OFFERS_INBOX,
      subject: adminSubject,
      html: htmlAdmin,
      text,
    });
  }

  // 2) Kund (validera e-post) – BCC till OFFERS_INBOX när FORCE_TO inte används
  const target = (FORCE_TO || p.customerEmail || "").trim();
  if (/\S+@\S+\.\S+/.test(target)) {
    await sendWithProvider({
      to: target,
      subject: customerSubject,
      html: htmlCustomer,
      text,
      bcc: FORCE_TO ? undefined : (OFFERS_INBOX ? [OFFERS_INBOX] : undefined),
    });
  }

  return { ok: true as const };
}
