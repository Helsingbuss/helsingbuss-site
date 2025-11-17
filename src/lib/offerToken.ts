// src/lib/offerToken.ts
import jwt, { type Secret, type JwtPayload } from "jsonwebtoken";

export type OfferTokenPayload = {
  id: string;          // offert-id
  no?: string;         // offertnummer, t.ex. HB25009
  role?: "customer" | "admin";
};

const SECRET = process.env.OFFER_JWT_SECRET || "";
const DEBUG_TOKEN = "debug-token";

export const CUSTOMER_BASE_URL =
  process.env.NEXT_PUBLIC_CUSTOMER_BASE_URL ||
  process.env.CUSTOMER_BASE_URL ||
  "https://kund.helsingbuss.se";

export const LOGIN_BASE_URL =
  process.env.NEXT_PUBLIC_LOGIN_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://login.helsingbuss.se";

// Skapar JWT för offertlänkar
export function createOfferToken(
  payload: OfferTokenPayload,
  exp: string | number = "14d"
): string {
  if (!SECRET) return DEBUG_TOKEN;
  // casts för att undvika TS-bråk mellan @types/jsonwebtoken-versioner
  const opts: any = { expiresIn: exp, algorithm: "HS256" };
  return jwt.sign(payload as any, SECRET as Secret, opts);
}

export function verifyOfferToken(token: string): OfferTokenPayload | null {
  try {
    if (!SECRET) return null;
    const decoded = jwt.verify(token, SECRET as Secret) as JwtPayload & OfferTokenPayload;
    return {
      id: (decoded as any).id,
      no: (decoded as any).no,
      role: (decoded as any).role,
    };
  } catch {
    return null;
  }
}

export function buildOfferPublicLink(offerId: string, offerNumber: string) {
  const base = CUSTOMER_BASE_URL.replace(/\/+$/, "");
  const t = createOfferToken({ id: offerId, no: offerNumber, role: "customer" }, "14d");
  // behåll både token & t för kompabilitet
  return `${base}/offert/${encodeURIComponent(
    offerNumber
  )}?view=inkommen&token=${encodeURIComponent(t)}&t=${encodeURIComponent(t)}`;
}

export function buildAdminOfferLink(offerId: string, offerNumber: string) {
  const base = LOGIN_BASE_URL.replace(/\/+$/, "");
  const t = createOfferToken({ id: offerId, no: offerNumber, role: "admin" }, "14d");
  return `${base}/admin/offers/${encodeURIComponent(
    offerId
  )}?t=${encodeURIComponent(t)}&no=${encodeURIComponent(offerNumber)}`;
}
