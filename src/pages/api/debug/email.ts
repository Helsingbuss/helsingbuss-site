// src/pages/api/debug/email.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sendBookingMail } from "@/lib/sendBookingMail";

/**
 * Debug-endpoint för att verifiera e-postsändning i produktion.
 *
 * Användning:
 *   GET /api/debug/email?to=din@mail.se&token=HEMMALIGT
 *   (eller skicka token i headern: x-debug-token)
 *
 * Säkerhet:
 *  - Om DEBUG_EMAIL_TOKEN är satt i env måste token matcha.
 *  - Om den inte är satt tillåts endast i icke-produktionsmiljö.
 */

function httpErr(res: NextApiResponse, code: number, msg: string) {
  return res.status(code).json({ ok: false, error: msg });
}

function env(v: string | undefined, fallback = ""): string {
  return (v ?? "").trim() || fallback;
}

function generateBookingNo(): string {
  const yy = new Date().getFullYear().toString().slice(-2);
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `BK${yy}${rnd}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return httpErr(res, 405, "Method not allowed");
    }

    const tokenFromEnv = env(process.env.DEBUG_EMAIL_TOKEN, "");
    const tokenFromReq =
      (req.query.token as string) ||
      (req.headers["x-debug-token"] as string) ||
      "";

    // Gate:
    if (tokenFromEnv) {
      if (tokenFromReq !== tokenFromEnv) {
        return httpErr(res, 401, "Unauthorized (bad or missing token)");
      }
    } else {
      // Om man glömt sätta token – tillåt endast i icke-prod
      if (process.env.NODE_ENV === "production") {
        return httpErr(res, 401, "Unauthorized (DEBUG_EMAIL_TOKEN not set)");
      }
    }

    const defaultTo =
      env(process.env.SUPPORT_INBOX) ||
      env(process.env.OFFERS_INBOX) ||
      "support@helsingbuss.se";

    const to =
      (req.method === "POST" ? (req.body?.to as string) : (req.query.to as string)) ||
      defaultTo;

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return httpErr(res, 400, "Ogiltig 'to'-adress");
    }

    // Dummydata för testet – svensk publik route /bokning/[nummer] används i sendBookingMail
    const now = new Date();
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const time = `${hh}:${mm}`;

    const bookingNumber = generateBookingNo();

    await sendBookingMail({
      to,
      bookingNumber,
      mode: "created",
      passengers: 25,
      out: {
        date,
        time,
        from: "Helsingborg",
        to: "Malmö",
      },
      // valfri retur – utelämnas i debug
      freeTextHtml:
        "<p>Det här är ett <b>testmail</b> från <code>/api/debug/email</code> för att verifiera Resend + domän.</p>",
    });

    return res.status(200).json({
      ok: true,
      to,
      bookingNumber,
      info: "Testmail skickat via sendBookingMail",
    });
  } catch (e: any) {
    return httpErr(res, 500, e?.message || "Något gick fel");
  }
}
