// src/pages/api/_debug/email-ping.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

export const config = { runtime: "nodejs" };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ÖPPEN CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  if (req.method === "GET") {
    res.status(200).json({ ok: true, via: "email-ping", method: "GET" });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) { res.status(500).json({ error: "Missing RESEND_API_KEY" }); return; }

  const resend = new Resend(key);
  const from =
    process.env.MAIL_FROM ||
    process.env.RESEND_FROM_FALLBACK ||
    "Helsingbuss <onboarding@resend.dev>";
  const to =
    process.env.OFFERS_INBOX ||
    process.env.ADMIN_ALERT_EMAIL ||
    "offert@helsingbuss.se";

  const base =
    process.env.NEXT_PUBLIC_LOGIN_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const r = await resend.emails.send({
    from,
    to,
    subject: "EMAIL-PING: Helsingbuss Portal",
    html: `<p>Ping ${new Date().toISOString()} – <a href="${base}/start">Start</a></p>`,
    text: `Ping ${new Date().toISOString()} – ${base}/start`,
  } as any);

  if ((r as any)?.error) {
    res.status(400).json({ error: (r as any).error?.message || "Resend error" });
    return;
  }
  res.status(200).json({ ok: true, id: (r as any)?.data?.id || null });
}
