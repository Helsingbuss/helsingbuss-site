// src/lib/cors.ts
import type { NextApiRequest, NextApiResponse } from "next";

type CorsOptions = {
  origin?: string[] | string;
  methods?: string[];
  headers?: string[];
  maxAge?: number;
};

function headerList(v?: string[] | string): string {
  if (!v) return "";
  return Array.isArray(v) ? v.join(",") : v;
}

/**
 * Minimal CORS helper for Next.js API routes.
 * Call: await cors(req, res, { origin: ["https://login.helsingbuss.se", "http://localhost:3000"] })
 */
export async function cors(
  req: NextApiRequest,
  res: NextApiResponse,
  opts: CorsOptions = {}
) {
  const {
    origin = "*",
    methods = ["GET", "POST", "OPTIONS"],
    headers = ["Content-Type", "Authorization"],
    maxAge = 86400,
  } = opts;

  // Vary so caches behave with Origin differences
  res.setHeader("Vary", "Origin");

  // Allow origin(s)
  res.setHeader("Access-Control-Allow-Origin", headerList(origin));

  // Allow methods/headers
  res.setHeader("Access-Control-Allow-Methods", headerList(methods));
  res.setHeader("Access-Control-Allow-Headers", headerList(headers));

  // Cache preflight
  res.setHeader("Access-Control-Max-Age", String(maxAge));

  // Short-circuit preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
}
