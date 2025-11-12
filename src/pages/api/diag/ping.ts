// src/pages/api/diag/ping.ts
import type { NextApiRequest, NextApiResponse } from "next";

export const config = { runtime: "nodejs" }; // OBS: ren statisk sträng

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Öppen CORS för diag
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.status(200).json({
    ok: true,
    via: "pages",
    method: req.method,
    time: new Date().toISOString(),
  });
}
