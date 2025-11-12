import { sendOfferMail } from "./src/lib/sendMail";

(async () => {
  try {
    const r = await sendOfferMail({
      offerId: "local-test",
      offerNumber: "HB25007",
      customerEmail: "ekelof.andreas@hotmail.com",
      customerName: "Test Lokalt",
      customerPhone: "+4670",
      from: "Helsingborg",
      to: "Ullared",
      date: "2025-11-30",
      time: "07:30",
      passengers: 10,
      notes: "direkt test"
    });
    console.log("OK:", r);
  } catch (e) {
    console.error("FAIL:", e);
  }
})();
