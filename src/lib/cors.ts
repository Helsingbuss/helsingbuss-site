import type { NextApiRequest, NextApiResponse } from "next";

function parseOrigins(raw?: string) {
  return (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * allowCors – legacy-stöd (returnerar true om handler ska fortsätta; svarar själv på OPTIONS).
 * Användning i route: if (!allowCors(req, res)) return;
 */
export function allowCors(req: NextApiRequest, res: NextApiResponse): boolean {
  const allowList = parseOrigins(process.env.ALLOWED_ORIGINS);
  const origin = req.headers.origin || "";
  const allowed = !origin || allowList.length === 0 || allowList.includes(origin);

  // CORS headers
  if (origin && allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight
  if (req.method === "OPTIONS") {
    if (!allowed && origin) {
      res.status(403).end();
      return false;
    }
    res.status(200).end();
    return false;
  }

  if (origin && !allowed) {
    res.status(403).json({ ok: false as any, error: "CORS: Origin not allowed" } as any);
    return false;
  }

  return true;
}

/**
 * withCors – rekommenderad wrapper för pages/api.
 * Användning: export default withCors(handler)
 */
export function withCors<T>(
  handler: (req: NextApiRequest, res: NextApiResponse<T>) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    if (!allowCors(req, res)) return;
    return handler(req, res);
  };
}
