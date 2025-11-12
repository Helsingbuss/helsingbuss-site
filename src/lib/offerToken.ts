// src/lib/offerToken.ts
import jwt from "jsonwebtoken";

const SECRET = process.env.OFFER_JWT_SECRET || "";
const DEBUG_FALLBACK = process.env.DEBUG_EMAIL_TOKEN || "debug-token";

/**
 * Signera en JWT för offert-länkar
 * Exp: "14d" fungerar.
 * TS fel är om typningen inte tvingas → därför "as jwt.Secret"
 */
export function createOfferToken(
  payload: { sub: string; no: string; role: "customer" | "admin" },
  expiresIn: string = "14d"
): string {
  if (SECRET.trim().length > 0) {
    return jwt.sign(
      payload,
      SECRET as jwt.Secret,               // <-- FIX 1
      { expiresIn } as jwt.SignOptions    // <-- FIX 2
    );
  }

  // fallback för lokal utveckling
  return DEBUG_FALLBACK;
}
