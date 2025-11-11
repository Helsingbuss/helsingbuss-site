// src/lib/cors.ts
import type { NextApiRequest, NextApiResponse } from "next";

type CorsOpts = {
  allowOrigins?: string[]; // fulla origin, t.ex. https://kund.helsingbuss.se
  allowMethods?: string[];
  allowHeaders?: string[];
  allowCredentials?: boolean;
};

const env = (v?: string | null) => (v ?? "").trim();

function matchOrigin(reqOrigin: string | undefined, allow: string[]): string | null {
  if (!reqOrigin) return null;
  const o = reqOrigin.trim().toLowerCase();
  for (const a of allow) {
    if (a.trim().toLowerCase() === o) return a;
  }
  return null;
}

/**
 * Default export: CORS-middleware för Next API routes.
 * Användning:
 *   await cors(req, res, { allowOrigins: ["https://kund.helsingbuss.se", "http://localhost:3000"] });
 */
export default async function cors(
  req: NextApiRequest,
  res: NextApiResponse,
  opts: CorsOpts = {}
) {
  const allowOrigins = opts.allowOrigins ?? [
    env(process.env.NEXT_PUBLIC_CUSTOMER_BASE_URL),
    env(process.env.CUSTOMER_BASE_URL),
    env(process.env.NEXT_PUBLIC_BASE_URL),
    env(process.env.NEXT_PUBLIC_LOGIN_BASE_URL),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean);

  const allowMethods = opts.allowMethods ?? ["POST", "GET", "OPTIONS"];
  const allowHeaders = opts.allowHeaders ?? [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ];
  const allowCredentials = opts.allowCredentials ?? false;

  const reqOrigin = (req.headers.origin as string | undefined) || "";
  const matched = matchOrigin(reqOrigin, allowOrigins);

  if (matched) {
    res.setHeader("Access-Control-Allow-Origin", matched);
    if (allowCredentials) res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", allowMethods.join(", "));
  res.setHeader("Access-Control-Allow-Headers", allowHeaders.join(", "));

  // Preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return false; // signalera till anroparen att vi redan har svarat
  }

  return true;
}
