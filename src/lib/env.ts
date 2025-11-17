// src/lib/env.ts
// Central och säker laddning av miljövariabler för serversidan.

export const NODE_ENV = process.env.NODE_ENV || "development";

export const MAIL_FROM =
  process.env.MAIL_FROM ||
  process.env.EMAIL_FROM ||
  "Helsingbuss <info@helsingbuss.se>";

export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "";

export const OFFERS_INBOX =
  process.env.OFFERS_INBOX ||
  process.env.ADMIN_ALERT_EMAIL ||
  MAIL_FROM;

export const MAIL_FORCE_TO = (process.env.MAIL_FORCE_TO || "").trim();

export const MAIL_BCC_ALL = (process.env.MAIL_BCC_ALL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function getResendApiKey(): string {
  const key = (process.env.RESEND_API_KEY || "").trim();
  if (!key) {
    // Låt anroparen få ett tydligt fel – men härifrån kastar vi ett "äkta" Error,
    // så vi slipper random text som bubblar upp till UI.
    throw new Error("RESEND_API_KEY saknas");
  }
  return key;
}
