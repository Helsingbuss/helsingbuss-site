// src/lib/mail.ts
import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY || "";
const DEFAULT_FROM =
  process.env.MAIL_FROM ||
  "Helsingbuss <no-reply@helsingbuss.se>";
const FALLBACK_FROM =
  process.env.RESEND_FROM_FALLBACK ||
  "Helsingbuss <no-reply@helsingbuss.se>";

function pickFrom(): string {
  const from = (DEFAULT_FROM || "").trim();
  // extra guard: måste vara @helsingbuss.se
  const match = from.match(/<([^>]+)>/);
  const addr = (match?.[1] || from).toLowerCase();
  if (addr.endsWith("@helsingbuss.se")) return from;
  return FALLBACK_FROM;
}

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  bcc?: string | string[];
}) {
  if (!API_KEY) throw new Error("RESEND_API_KEY saknas");
  const resend = new Resend(API_KEY);

  const from = pickFrom();
  const payload: any = {
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    reply_to: opts.replyTo ?? process.env.EMAIL_REPLY_TO ?? undefined,
  };
  if (process.env.MAIL_BCC_ALL) {
    payload.bcc = [opts.bcc, process.env.MAIL_BCC_ALL].flat().filter(Boolean);
  } else if (opts.bcc) {
    payload.bcc = opts.bcc;
  }

  const res = await resend.emails.send(payload);
  if ((res as any).error) {
    console.error("[mail] Resend error:", (res as any).error);
    throw new Error((res as any).error.message || "Resend error");
  }
  return res;
}
