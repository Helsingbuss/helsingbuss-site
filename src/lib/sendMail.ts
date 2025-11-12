import { Resend } from "resend";

export type SendOfferParams = {
  offerId: string;
  offerNumber: string;
  customerEmail: string;

  customerName?: string | null;
  customerPhone?: string | null;

  from?: string | null;
  to?: string | null;
  date?: string | null;
  time?: string | null;
  passengers?: number | null;
  via?: string | null;
  onboardContact?: string | null;

  return_from?: string | null;
  return_to?: string | null;
  return_date?: string | null;
  return_time?: string | null;

  notes?: string | null;
};

const env = (v?: string | null) => (v ?? "").toString().trim();

const RESEND_KEY   = env(process.env.RESEND_API_KEY);
const FROM         = env(process.env.MAIL_FROM) || env(process.env.EMAIL_FROM) || "Helsingbuss <onboarding@resend.dev>";
const REPLY_TO     = env(process.env.EMAIL_REPLY_TO);
const ADMIN        = env(process.env.ADMIN_ALERT_EMAIL);
const OFFERS_INBOX = env(process.env.OFFERS_INBOX);
const FORCE_TO     = env(process.env.MAIL_FORCE_TO); // testsäkring – skicka ALLT hit

function safe(v?: string | null) { return (v ?? "").trim() || "—"; }

function tripBlock(p: SendOfferParams) {
  const first =
    `<b>Från:</b> ${safe(p.from)}<br/>` +
    `<b>Till:</b> ${safe(p.to)}<br/>` +
    `<b>Datum:</b> ${safe(p.date)}<br/>` +
    `<b>Tid:</b> ${safe(p.time)}<br/>` +
    `<b>Passagerare:</b> ${p.passengers ?? "—"}<br/>` +
    (p.via ? `<b>Via:</b> ${p.via}<br/>` : "") +
    (p.onboardContact ? `<b>Kontakt ombord:</b> ${p.onboardContact}<br/>` : "");
  const ret =
    p.return_from || p.return_to || p.return_date || p.return_time
      ? `<hr style="border:none;border-top:1px solid #eee;margin:12px 0" />
         <div style="font-weight:600;margin-bottom:4px">Retur</div>
         <b>Från:</b> ${safe(p.return_from)}<br/>
         <b>Till:</b> ${safe(p.return_to)}<br/>
         <b>Datum:</b> ${safe(p.return_date)}<br/>
         <b>Tid:</b> ${safe(p.return_time)}<br/>`
      : "";
  return `<div>${first}</div>${ret}`;
}

function renderAdminHtml(p: SendOfferParams) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111">
    <h2 style="margin:0 0 8px 0">Ny offertförfrågan</h2>
    <div><b>Offert-ID:</b> ${safe(p.offerNumber)}</div>
    <div><b>Beställare:</b> ${safe(p.customerName)}</div>
    <div><b>E-post:</b> ${safe(p.customerEmail)}</div>
    <div><b>Telefon:</b> ${safe(p.customerPhone)}</div>

    <hr style="border:none;border-top:1px solid #eee;margin:12px 0" />
    <div style="font-weight:600;margin-bottom:4px">Reseinformation</div>
    ${tripBlock(p)}

    ${p.notes ? `<hr style="border:none;border-top:1px solid #eee;margin:12px 0" />
                 <div style="font-weight:600;margin-bottom:4px">Övrigt</div>
                 <div>${safe(p.notes)}</div>` : ""}

    <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
    <div style="color:#6b7280;font-size:12px">
      Denna notifiering skickades automatiskt från Helsingbuss Portal.
    </div>
  </div>`;
}
function renderCustomerHtml(p: SendOfferParams) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111">
    <h2 style="margin:0 0 8px 0">Tack! Vi har mottagit din offertförfrågan</h2>
    <div><b>Ärendenummer:</b> ${safe(p.offerNumber)}</div>
    <p>Vi återkommer så snart vi har gått igenom uppgifterna.</p>
    <div style="font-weight:600;margin:12px 0 4px">Sammanfattning</div>
    ${tripBlock(p)}
    ${p.notes ? `<div style="margin-top:8px"><b>Övrig information:</b><br/>${safe(p.notes)}</div>` : ""}
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
    <div style="color:#6b7280;font-size:12px">
      Helsingbuss • Detta är ett automatiskt bekräftelsemejl – svara gärna om du vill komplettera något.
    </div>
  </div>`;
}
function renderText(p: SendOfferParams) {
  const lines = [
    `Offert: ${p.offerNumber}`,
    `Beställare: ${p.customerName || "-"}`,
    `E-post: ${p.customerEmail}`,
    `Telefon: ${p.customerPhone || "-"}`,
    "",
    "Reseinformation",
    `Från: ${p.from || "-"}`,
    `Till: ${p.to || "-"}`,
    `Datum: ${p.date || "-"}`,
    `Tid: ${p.time || "-"}`,
    `Passagerare: ${p.passengers ?? "-"}`,
  ];
  if (p.via) lines.push(`Via: ${p.via}`);
  if (p.onboardContact) lines.push(`Kontakt ombord: ${p.onboardContact}`);
  if (p.return_from || p.return_to || p.return_date || p.return_time) {
    lines.push("", "Retur",
      `Från: ${p.return_from || "-"}`,
      `Till: ${p.return_to || "-"}`,
      `Datum: ${p.return_date || "-"}`,
      `Tid: ${p.return_time || "-"}`
    );
  }
  if (p.notes) lines.push("", "Övrigt", p.notes);
  return lines.join("\n");
}

async function sendViaResend(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  bcc?: string[];
}) {
  if (!RESEND_KEY) throw new Error("RESEND_API_KEY saknas");
  const resend = new Resend(RESEND_KEY);

  const payload: any = {
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  };
  if (REPLY_TO) payload.reply_to = REPLY_TO;
  if (args.bcc?.length) payload.bcc = args.bcc;

  try {
    const r = await resend.emails.send(payload);
    console.log("[sendMail] Resend primary OK:", r);
    return r;
  } catch (e: any) {
    const status = e?.statusCode || e?.response?.statusCode || e?.code || "unknown";
    const name   = e?.name || "Error";
    const msg    = e?.message || e?.response?.body || e;

    console.warn("[sendMail] Resend primary FAIL:", { status, name, msg });

    // Fångar vanliga block: 403/422 + “verify domain”/testing-only
    const looksLikeDomainBlock =
      String(status).startsWith("4") ||
      /verify a domain/i.test(String(msg)) ||
      /testing emails/i.test(String(msg));

    if (looksLikeDomainBlock) {
      const fallbackTo = FORCE_TO || ADMIN || args.to;
      const fallback = {
        from: "Helsingbuss <onboarding@resend.dev>",
        to: fallbackTo,
        subject: args.subject,
        html: args.html,
        text: args.text,
      };
      console.warn("[sendMail] Using fallback onboarding@resend.dev →", fallbackTo);
      const r2 = await resend.emails.send(fallback);
      console.log("[sendMail] Resend fallback OK:", r2);
      return r2;
    }

    throw e;
  }
}

/** Skicka admin-notis + kundbekräftelse. Respekterar MAIL_FORCE_TO. */
export async function sendOfferMail(p: SendOfferParams) {
  const adminSubject    = `Ny offertförfrågan ${p.offerNumber}`;
  const customerSubject = `Tack! Vi har mottagit din offertförfrågan (${p.offerNumber})`;

  const htmlAdmin    = renderAdminHtml(p);
  const htmlCustomer = renderCustomerHtml(p);
  const text         = renderText(p);

  // 1) ADMIN
  const toAdmin = FORCE_TO || ADMIN;
  if (toAdmin) {
    await sendViaResend({
      to: toAdmin,
      subject: adminSubject,
      html: htmlAdmin,
      text,
    });
  } else {
    console.warn("[sendMail] ADMIN_ALERT_EMAIL saknas – hoppar över admin-notis");
  }

  // 2) KUND
  const emailRegex = /\S+@\S+\.\S+/;
  const toCustomer = FORCE_TO || p.customerEmail;
  if (toCustomer && emailRegex.test(toCustomer)) {
    await sendViaResend({
      to: toCustomer,
      subject: customerSubject,
      html: htmlCustomer,
      text,
      bcc: FORCE_TO ? undefined : (OFFERS_INBOX ? [OFFERS_INBOX] : undefined),
    });
  } else {
    console.warn("[sendMail] Ogiltig kundadress – hoppar över kundmejl:", toCustomer);
  }

  return { ok: true as const, forced: !!FORCE_TO };
}
