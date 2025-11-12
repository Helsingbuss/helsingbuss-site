// src/lib/cors.ts
import type { NextApiRequest, NextApiResponse } from "next";

const DEFAULT_ORIGINS = [
  "https://login.helsingbuss.se",
  "https://kund.helsingbuss.se",
  "https://helsingbuss.se",
  "https://www.helsingbuss.se",
];

function norm(u: string) {
  return u.trim().toLowerCase().replace(/\/+$/, "");
}

const fromEnv = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(norm)
  .filter(Boolean);

const ALLOWED = (fromEnv.length ? fromEnv : DEFAULT_ORIGINS);
const ALLOWED_HOSTS = ALLOWED.map(u => {
  try { return new URL(u).host.toLowerCase(); } catch { return ""; }
}).filter(Boolean);

export function allowCors(req: NextApiRequest, res: NextApiResponse) {
  const origin = norm(String(req.headers.origin || ""));
  const host   = String(req.headers.host || "").toLowerCase();

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // sätt bara ACAO när vi faktiskt har en origin att spegla

  // Preflight
  if (req.method === "OPTIONS") {
    if (!origin || ALLOWED.includes(origin) || (host && ALLOWED_HOSTS.includes(host))) {
      if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
      res.status(200).end();
      return false;
    }
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  // Vanliga requests:
  // Tillåt server-to-server (ingen Origin)
  if (!origin) return true;

  // Tillåt om origin vitlistad ELLER host matchar
  if (ALLOWED.includes(origin) || (host && ALLOWED_HOSTS.includes(host))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    return true;
  }

  res.status(401).json({ error: "Unauthorized" });
  return false;
}
