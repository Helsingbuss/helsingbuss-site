// src/lib/turnstile.ts
export async function verifyTurnstile(token: string, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return false;

  const body = new URLSearchParams();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);

  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });

  const data = await r.json().catch(() => ({}));
  return !!data.success;
}
