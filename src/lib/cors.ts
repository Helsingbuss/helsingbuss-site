// src/lib/cors.ts
import type { NextApiRequest, NextApiResponse } from "next";

const split = (v?: string) =>
  (v || "").split(",").map(s => s.trim()).filter(Boolean);

const ALLOWED = split(process.env.ALLOWED_ORIGINS);
// Ex: "https://helsingbuss.se,https://www.helsingbuss.se,https://kund.helsingbuss.se,https://login.helsingbuss.se"

export function applyCors(req: NextApiRequest, res: NextApiResponse) {
  const origin = (req.headers.origin as string) || "";

  const allow =
    ALLOWED.length === 0
      ? origin // om ej satt -> tillåt current origin (för enkel felsökning)
      : (ALLOWED.includes(origin) ? origin : ALLOWED[0]); // välj första godkända om mismatch

  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true; // preflight avslutad
  }
  return false;
}
