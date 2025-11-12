// src/pages/api/offers/[id]/change-request.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "@/lib/supabaseAdmin";
import { Resend } from "resend";
import sg from "@sendgrid/mail";
import nodemailer from "nodemailer";
import { createOfferToken } from "@/lib/offerToken";

const supabase =
  (admin as any).supabaseAdmin || (admin as any).supabase || (admin as any).default;

const FROM      = process.env.MAIL_FROM || "Helsingbuss <info@helsingbuss.se>";
const REPLY_TO  = process.env.EMAIL_REPLY_TO || "";
const OFFERS_INBOX =
  process.env.OFFERS_INBOX ||
  process.env.MAIL_ADMIN ||
  process.env.ADMIN_ALERT_EMAIL ||
  "offert@helsingbuss.se";

const FORCE_FROM_FALLBACK = /^(1|true|yes)$/i.test(String(process.env.MAIL_FORCE_FROM_FALLBACK || ""));
const RESEND_KEY = process.env.RESEND_API_KEY || "";
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

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

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]
  );
}

function renderAdminHtml(offer: any, message?: string) {
  const link = adminOfferUrl(offer.id);
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111">
    <h2 style="margin:0 0 8px 0">Ändringsförfrågan</h2>
    <div><b>Offert:</b> ${offer.offer_number || offer.id}</div>
    ${message ? `<div style="margin-top:8px"><b>Meddelande från kund:</b><br/>${escapeHtml(message)}</div>` : ""}
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:18px 0 6px">
      <tr><td>
        <a href="${link}" style="display:inline-block;background:#1D2937;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">
          Öppna i Admin
        </a>
      </td></tr>
    </table>
  </div>`;
}

function renderCustomerHtml(offer: any, message?: string) {
  const href = customerOfferUrl(String(offer.id), String(offer.offer_number || offer.id));
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111">
    <h2 style="margin:0 0 8px 0">Tack! Din ändringsförfrågan är mottagen</h2>
    <div><b>Ärendenummer:</b> ${offer.offer_number || offer.id}</div>
    ${message ? `<p style="margin:10px 0 0 0">Du skrev:</p><div style="margin-top:6px">${escapeHtml(message)}</div>` : ""}
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:18px 0 6px">
      <tr><td>
        <a href="${href}" style="display:inline-block;background:#1D2937;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">
          Visa din offert
        </a>
      </td></tr>
    </table>
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

async function sendWithResend(args: { to: string; subject: string; html: string; text: string; bcc?: string[] }) {
  if (!resend) throw new Error("Resend not configured");
  const isInternalTo = /@helsingbuss\.se$/i.test(args.to);
  const from = (FORCE_FROM_FALLBACK || isInternalTo)
    ? "Helsingbuss <onboarding@resend.dev>"
    : (FROM || "Helsingbuss <noreply@helsingbuss.se>");

  await resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    ...(REPLY_TO ? { reply_to: REPLY_TO } : {}),
    ...(args.bcc?.length ? { bcc: args.bcc } : {}),
  } as any);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    if (OFFERS_INBOX && resend) {
      await sendWithResend({
        to: OFFERS_INBOX,
        subject: `✏️ Ändringsförfrågan på offert ${offer.offer_number || offer.id}`,
        html: renderAdminHtml(offer, message),
        text: renderTextAdmin(offer, message),
      });
    }

    const target = String((offer as any).customer_email || (offer as any).contact_email || "").trim();
    if (/\S+@\S+\.\S+/.test(target) && resend) {
      await sendWithResend({
        to: target,
        subject: `Vi har mottagit din ändringsförfrågan (${offer.offer_number || offer.id})`,
        html: renderCustomerHtml(offer, message),
        text: renderTextCustomer(offer, message),
        bcc: OFFERS_INBOX ? [OFFERS_INBOX] : undefined,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
