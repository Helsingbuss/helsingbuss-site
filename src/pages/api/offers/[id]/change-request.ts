import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
import { Resend } from "resend";
import sg from "@sendgrid/mail";
import nodemailer from "nodemailer";
import { createOfferToken } from "@/lib/offerToken";
import { withCors } from "@/lib/cors";

const supabase =
  (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

const FROM = process.env.MAIL_FROM || "Helsingbuss <info@helsingbuss.se>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "";
const OFFERS_INBOX =
  process.env.OFFERS_INBOX ||
  process.env.MAIL_ADMIN ||
  process.env.ADMIN_ALERT_EMAIL ||
  "offert@helsingbuss.se";
const FORCE_TO = process.env.MAIL_FORCE_TO || ""; // bara för test/labb

function resolveBaseUrl() {
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

function customerOfferUrl(offerId: string, offerNumber: string) {
  const base = resolveBaseUrl();
  const t = createOfferToken({ sub: offerId, no: offerNumber, role: "customer" }, "14d");
  return `${base}/offert/${encodeURIComponent(offerNumber)}?view=inkommen&t=${encodeURIComponent(t)}`;
}

function adminOfferUrl(offerId: string) {
  const base =
    (process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_LOGIN_BASE_URL ||
      "").replace(/\/$/, "") || "http://localhost:3000";
  return `${base}/admin/offers/${offerId}`;
}

/** Provider-väljare (Resend → SendGrid → SMTP) */
function pickProvider() {
  if (process.env.RESEND_API_KEY) return "resend" as const;
  if (process.env.SENDGRID_API_KEY) return "sendgrid" as const;
  if (process.env.SMTP_HOST) return "smtp" as const;
  throw new Error("Ingen mejlkonfiguration: RESEND_API_KEY eller SENDGRID_API_KEY eller SMTP_* krävs.");
}

async function sendWithProvider(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  bcc?: string[];
}) {
  const p = pickProvider();

  if (p === "resend") {
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
    if ((r as any)?.error) throw new Error((r as any).error?.message || "Resend error");
    return;
  }

  if (p === "sendgrid") {
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
    return;
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  } as any);

  await transport.sendMail({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    ...(args.bcc?.length ? { bcc: args.bcc } : {}),
  });
}

/** Minimal HTML helpers (samma stil/ton som dina andra mejl) */
const safe = (v?: string | null) => (v ?? "").toString().trim() || "—";
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]
  );

function renderAdminHtml(offer: any, message?: string) {
  const link = adminOfferUrl(offer.id);
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111">
    <h2 style="margin:0 0 8px 0">Ändringsförfrågan</h2>
    <div><b>Offert:</b> ${safe(offer.offer_number || offer.id)}</div>
    ${message ? `<div style="margin-top:8px"><b>Meddelande från kund:</b><br/>${escapeHtml(message)}</div>` : ""}
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:18px 0 6px">
      <tr><td>
        <a href="${link}" style="display:inline-block;background:#1D2937;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">
          Öppna i Admin
        </a>
      </td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
    <div style="color:#6b7280;font-size:12px">Detta är en automatisk notifiering från Helsingbuss Portal.</div>
  </div>`;
}

function renderCustomerHtml(offer: any, message?: string) {
  const href = customerOfferUrl(String(offer.id), String(offer.offer_number || offer.id));
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111">
    <h2 style="margin:0 0 8px 0">Tack! Din ändringsförfrågan är mottagen</h2>
    <div><b>Ärendenummer:</b> ${safe(offer.offer_number || offer.id)}</div>
    ${message ? `<p style="margin:10px 0 0 0">Du skrev:</p><div style="margin-top:6px">${escapeHtml(message)}</div>` : ""}
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:18px 0 6px">
      <tr><td>
        <a href="${href}" style="display:inline-block;background:#1D2937;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">
          Visa din offert
        </a>
      </td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
    <div style="color:#6b7280;font-size:12px">
      Helsingbuss • Detta är en automatisk bekräftelse – svara gärna om du vill komplettera något.
    </div>
  </div>`;
}

function renderTextAdmin(offer: any, msg?: string) {
  return [
    `Ändringsförfrågan`,
    `Offert: ${offer.offer_number || offer.id}`,
    msg ? `Meddelande: ${msg}` : ``,
    adminOfferUrl(offer.id),
  ].filter(Boolean).join("\n");
}

function renderTextCustomer(offer: any, msg?: string) {
  return [
    `Din ändringsförfrågan är mottagen`,
    `Ärende: ${offer.offer_number || offer.id}`,
    msg ? `Du skrev: ${msg}` : ``,
    customerOfferUrl(String(offer.id), String(offer.offer_number || offer.id)),
  ].filter(Boolean).join("\n");
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { id } = req.query as { id: string };
    const { message } = req.body as { message?: string };

    const { data: offer, error } = await supabase.from("offers").select("*").eq("id", id).single();
    if (error || !offer) return res.status(404).json({ error: "Offer not found" });

    await supabase
      .from("offers")
      .update({
        change_request_at: new Date().toISOString(),
        change_note: message || null,
      })
      .eq("id", id);

    if (OFFERS_INBOX) {
      await sendWithProvider({
        to: OFFERS_INBOX,
        subject: `✏️ Ändringsförfrågan på offert ${offer.offer_number || offer.id}`,
        html: renderAdminHtml(offer, message),
        text: renderTextAdmin(offer, message),
      });
    }

    const target = (FORCE_TO || (offer as any).contact_email || "").trim();
    if (/\S+@\S+\.\S+/.test(target)) {
      await sendWithProvider({
        to: target,
        subject: `Vi har mottagit din ändringsförfrågan (${offer.offer_number || offer.id})`,
        html: renderCustomerHtml(offer, message),
        text: renderTextCustomer(offer, message),
        bcc: FORCE_TO ? undefined : (OFFERS_INBOX ? [OFFERS_INBOX] : undefined),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}

export default withCors(handler);
