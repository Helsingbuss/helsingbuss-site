// src/lib/formTicket.ts
import crypto from "crypto";

const SECRET = (process.env.FORM_TICKET_SECRET || "").trim();

export type TicketPayload = {
  iss: "offert";
  iat: number;         // issued at (s)
  exp: number;         // expires at (s)
  ua: string;          // user-agent hash
  o?: string | null;   // origin (svagt binda mot)
};

function b64(s: Buffer | string) {
  return Buffer.from(s).toString("base64url");
}

export function signTicket(p: TicketPayload) {
  if (!SECRET) throw new Error("FORM_TICKET_SECRET missing");
  const body = b64(JSON.stringify(p));
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyTicket(token: string, ua: string, origin?: string | null) {
  if (!SECRET) throw new Error("FORM_TICKET_SECRET missing");
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expect = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return false;

  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TicketPayload;
  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== "offert") return false;
  if (payload.exp < now) return false;

  const uaHash = crypto.createHash("sha256").update(ua || "").digest("hex");
  if (payload.ua !== uaHash) return false;
  if (payload.o && origin && payload.o !== origin) return false;

  return true;
}
