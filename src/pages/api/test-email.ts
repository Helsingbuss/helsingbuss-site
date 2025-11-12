// src/pages/api/test-email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { withCors } from "@/lib/cors";

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // CORS preflight
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  // Valfri enkel auth med header eller ?token=...
  const wantToken = (process.env.DEBUG_EMAIL_TOKEN || "").trim();
  const gotToken =
    (req.headers["x-debug-token"] as string) ||
    (req.query.token as string) ||
    (req.body && (req.body as any).token);

  if (wantToken && gotToken !== wantToken) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }

  // Tillåt GET för snabbtest i webbläsare och POST för “riktigt” test
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" }); return;
  }

  const key  = process.env.RESEND_API_KEY;
  if (!key) { res.status(500).json({ error: "Missing RESEND_API_KEY" }); return; }

  // Base-url för länkar i mailet
  const base =
    process.env.NEXT_PUBLIC_LOGIN_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  // Mottagare kan sättas via ?to=... eller body.to, annars env-fallbacks
  const to =
    (req.query.to as string) ||
    (req.body && (req.body as any).to) ||
    process.env.MAIL_FORCE_TO ||
    process.env.TEST_MAIL_TO ||
    process.env.ADMIN_ALERT_EMAIL ||
    "andreas@helsingbuss.se";

  // Avsändare: använd din domän, eller Resends säkra fallback om du vill
  const from =
    (req.query.from as string) ||
    (req.body && (req.body as any).from) ||
    process.env.MAIL_FROM ||
    process.env.RESEND_FROM_FALLBACK ||
    "Helsingbuss <onboarding@resend.dev>";

  const subject =
    (req.query.subject as string) ||
    (req.body && (req.body as any).subject) ||
    "TEST: Helsingbuss Portal";

  const html =
    (req.body && (req.body as any).html) ||
    `<p>Hej! Detta är ett test från API:t.<br/>
      <a href="${base}/offert/HB25007">Visa offert HB25007</a></p>`;

  const text =
    (req.body && (req.body as any).text) ||
    `Hej! Detta är ett test från API:t.\n${base}/offert/HB25007`;

  try {
    const resend = new Resend(key);
    const r: any = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
      ...(process.env.MAIL_BCC_ALL ? { bcc: process.env.MAIL_BCC_ALL } : {}),
    } as any);

    if (r?.error) {
      res.status(400).json({ ok: false, error: r.error, result: r }); return;
    }

    res.status(200).json({ ok: true, to, from, id: r?.data?.id || null, result: r }); return;
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) }); return;
  }
}

export default withCors(handler);
