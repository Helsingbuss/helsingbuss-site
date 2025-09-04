// src/lib/sendMail.ts
import { Resend } from "resend";

console.log("RESEND_API_KEY loaded:", !!process.env.RESEND_API_KEY);

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendOfferMail(
  to: string,
  offerId: string,
  status: "inkommen" | "besvarad" | "godkand" | "makulerad"
) {
  if (!resend) {
    console.warn("⚠️ Ingen RESEND_API_KEY hittades, kör i testläge.");
    return {
      success: true,
      test: true,
      subject: "(TEST) Skulle skickas till " + to,
      status,
    };
  }

  let subject = "";
  let html = "";

  switch (status) {
    case "inkommen":
      subject = `Tack – vi har mottagit er offertförfrågan (${offerId})`;
      html = `
        <p>Hej, Tack för er offertförfrågan!</p>
        <p>Ni kan när som helst se vad som har registrerats via länken nedan. Informationen uppdateras automatiskt i takt med att vi handlägger ärendet.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/offert/${offerId}">Visa er förfrågan (${offerId})</a></p>
        <p>När er offert har prissatts får ni ett nytt meddelande.</p>
        <p>Vänliga hälsningar,<br/>Helsingbuss Kundteam<br/>info@helsingbuss.se | +46 (0)10-405 38 38</p>
      `;
      break;

    case "besvarad":
      subject = `Er offert från Helsingbuss är klar (${offerId})`;
      html = `
        <p>Hej,</p>
        <p>Nu är er offert prissatt. Ni hittar alla detaljer via länken nedan. Länken visar alltid den senaste, aktuella informationen.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/offert/${offerId}">Visa er offert (${offerId})</a></p>
        <p>Hör gärna av er om ni vill justera något eller gå vidare med bokning.</p>
        <p>Vänliga hälsningar,<br/>Helsingbuss Kundteam<br/>info@helsingbuss.se | +46 (0)10-405 38 38</p>
      `;
      break;

    case "godkand":
      subject = `Din bokning har uppdaterats (${offerId})`;
      html = `
        <p>Hej,</p>
        <p>Din bokning har uppdaterats i vårt system. Du kan enkelt se den senaste informationen via länken nedan:</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/offert/${offerId}">Visa din bokning (${offerId})</a></p>
        <p>Vi ber dig kontrollera att uppgifterna stämmer enligt dina önskemål.</p>
        <p>Har du frågor om din resa? Vårt Kundteam finns tillgängligt vardagar 08:00–17:00 på 010-405 38 38.<br/>
        Du kan också besvara detta mejl, så återkommer vi snarast.<br/>
        För akuta trafikärenden utanför kontorstid når du vår jour på 010-777 21 58</p>
        <p>Vänliga hälsningar,<br/>Helsingbuss Kundteam<br/>info@helsingbuss.se | +46 (0)10-405 38 38</p>
      `;
      break;

    case "makulerad":
      subject = `Din offert har makulerats (${offerId})`;
      html = `
        <p>Hej,</p>
        <p>Tyvärr har er offert markerats som makulerad och är därmed inte längre giltig.</p>
        <p>Har ni frågor är ni varmt välkomna att kontakta oss.</p>
        <p>Vänliga hälsningar,<br/>Helsingbuss Kundteam<br/>info@helsingbuss.se | +46 (0)10-405 38 38</p>
      `;
      break;
  }

  // 1. Skicka till kunden
  await resend.emails.send({
    from: "Helsingbuss <info@helsingbuss.se>",
    to,
    subject,
    html,
  });

  // 2. Skicka notis till admin
  await resend.emails.send({
    from: "Helsingbuss Offertsystem <info@helsingbuss.se>",
    to: "offert@helsingbuss.se",
    subject: `📩 Ny offertförfrågan (${offerId}) från ${to}`,
    html: `
      <h2>Ny offertförfrågan har inkommit</h2>
      <p>En ny offert (${offerId}) har precis skickats in via hemsidan.</p>
      <p><strong>Kundens e-post:</strong> ${to}</p>
      <p>👉 Klicka på knappen nedan för att se detaljerna:</p>
      <p>
        <a href="https://login.helsingbuss.se" 
           style="display:inline-block;padding:10px 20px;background:#194C66;color:#fff;text-decoration:none;border-radius:6px;">
          Öppna Admin
        </a>
      </p>
      <p>— Helsingbuss Offertsystem</p>
    `,
  });

  return { success: true };
}
