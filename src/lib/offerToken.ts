// src/lib/offerToken.ts
import jwt, { type SignOptions, type Secret, type JwtPayload } from "jsonwebtoken";

const SECRET = process.env.OFFER_JWT_SECRET || "";

/**
 * Signera en offert-token (JWT) med default giltighet 14 dagar.
 * Används i API och mail-länkar.
 */
export function signOfferToken(
  payload: Record<string, any>,
  exp: string | number = "14d"
): string {
  // En del versioner av @types/jsonwebtoken bråkar om typen på expiresIn.
  // Casta säkert så vi slipper TS-fel oavsett versionsmismatch.
  const opts: SignOptions = { expiresIn: exp as any, algorithm: "HS256" as any };

  if (!SECRET) {
    // Om hemligheten saknas returnerar vi tom sträng så att appen fortfarande kan bygga.
    // (I produktion MÅSTE OFFER_JWT_SECRET vara satt)
    return "";
  }

  return jwt.sign(payload as any, SECRET as Secret, opts);
}

/**
 * Alias för bakåtkompatibilitet — vissa filer importerar createOfferToken.
 */
export const createOfferToken = signOfferToken;

/**
 * Verifiera token; returnerar payload eller null om ogiltig/utgången.
 */
export function verifyOfferToken(token: string): JwtPayload | null {
  if (!SECRET) return null;
  try {
    return jwt.verify(token, SECRET as Secret) as JwtPayload;
  } catch {
    return null;
  }
}
