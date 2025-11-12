import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { withCors } from "@/lib/cors";

async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const key  = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.MAIL_FROM || "onboarding@resend.dev";
  const to   = process.env.TEST_MAIL_TO || process.env.ADMIN_ALERT_EMAIL || "andreas@helsingbuss.se";

  if (!key) { res.status(500).json({ error: "Missing RESEND_API_KEY" }); return; }

  const resend = new Resend(key);
  const base =
    process.env.NEXT_PUBLIC_LOGIN_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const r: any = await resend.emails.send({
    from,
    to,
    subject: "TEST: Helsingbuss Portal",
    html: `<p>Hej! Detta är ett test från API:t.<br/><a href="${base}/offert/HB25007">Visa offert HB25007</a></p>`,
    text: `Hej! Detta är ett test från API:t.\n${base}/offert/HB25007`,
  } as any);

  if (r?.error) { res.status(400).json({ error: r.error?.message || "Resend error" }); return; }

  res.status(200).json({ ok: true, id: r?.data?.id || null });
  return;
}

export default withCors(handler);
