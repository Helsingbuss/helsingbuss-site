import jwt from "jsonwebtoken";

const SECRET = process.env.OFFER_JWT_SECRET || "";
const DEBUG_FALLBACK = process.env.DEBUG_EMAIL_TOKEN || "";

type OfferTokenPayload = {
  sub: string;        // offerId
  no: string;         // offerNumber
  role: "customer" | "admin";
};

export function createOfferToken(payload: OfferTokenPayload, expiresIn: string = "14d"): string {
  if (SECRET) {
    return jwt.sign(payload, SECRET, { expiresIn });
  }
  // Fallback för lokal test om man inte satt secret
  return DEBUG_FALLBACK || "debug-token";
}
