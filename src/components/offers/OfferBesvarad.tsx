// src/components/offers/OfferBesvarad.tsx
import StatusBadge from "@/components/StatusBadge";
import Image from "next/image";
import { Bus } from "lucide-react";

export default function OfferBesvarad({ offer }: any) {
  const roundTrip = offer?.round_trip || false;
  const withinSweden = offer?.trip_type !== "utrikes";

  const trips = [
    {
      title: roundTrip ? "Utresa" : "Bussresa",
      date: offer?.departure_date,
      time: offer?.departure_time,
      from: offer?.departure_place,
      to: offer?.destination,
    },
    ...(roundTrip
      ? [
          {
            title: "Återresa",
            date: offer?.return_date,
            time: offer?.return_time,
            from: offer?.destination,
            to: offer?.departure_place,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f4f0]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#194C66] h-[60px] flex items-center px-6 shadow z-50">
        <Image
          src="/vit_logo.png"
          alt="Helsingbuss"
          width={222}
          height={40}
          priority
        />
      </header>

      <main className="flex-1 pt-[60px]">
        {/* Omslagsbild */}
        <div className="max-w-5xl mx-auto px-6 mt-6">
          <div className="relative w-full h-[280px] rounded-lg overflow-hidden shadow">
            <Image
              src="/innebild.png"
              alt="Omslagsbild"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
          {/* Titel */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#0f172a]">
              Offert ({offer?.offer_number})
            </h1>
            <p className="text-blue-700 font-medium">Status: Besvarad</p>
          </div>

          <h2 className="text-lg font-semibold text-center text-[#194C66]">
            Vi har rattat ihop ditt erbjudande – dags att titta på färdplanen.
          </h2>

          {/* Offert- & kundinformation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Offertinformation */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-semibold text-lg mb-4">Offertinformation</h2>
              <p><strong>Offertnummer:</strong> {offer?.offer_number}</p>
              <p><strong>Offertdatum:</strong> {offer?.offer_date}</p>
              <p><strong>Er referens:</strong> {offer?.customer_reference}</p>
              <p><strong>Vår referens:</strong> {offer?.internal_reference}</p>
              <p><strong>Fakturareferens:</strong> {offer?.invoice_reference || "-"}</p>
              <p>
                <strong>Betalningsvillkor:</strong>{" "}
                {offer?.payment_terms || "-"}
              </p>
            </div>

            {/* Kundinformation */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-semibold text-lg mb-4">Kundinformation</h2>
              <p><strong>Kundnummer:</strong> {offer?.customer_id}</p>
              <p><strong>Kund:</strong> {offer?.contact_person}</p>
              <p><strong>Telefon:</strong> {offer?.contact_phone}</p>
              <p><strong>Adress:</strong> {offer?.customer_address || "-"}</p>
            </div>
          </div>

          {/* Reseinformation */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Bus className="w-5 h-5 text-[#194C66]" />
              Din reseinformation –{" "}
              {withinSweden ? "Bussresa inom Sverige" : "Bussresa utomlands"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trips.map((trip, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold">{trip.title}</h3>
                  <p><strong>Avresa:</strong> {trip.date} kl {trip.time}</p>
                  <p><strong>Från:</strong> {trip.from}</p>
                  <p><strong>Till:</strong> {trip.to}</p>
                  <p><strong>Antal passagerare:</strong> {offer?.passengers}</p>
                </div>
              ))}
            </div>

            {/* Övrig information */}
            <div className="mt-6 border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold">Övrig information</h3>
              <p>{offer?.notes || "Ingen information angiven."}</p>
            </div>
          </div>

          {/* Resans kostnad */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold text-lg mb-4">Resans kostnad</h2>
            <p>1 st á: {offer?.price_per_unit || "X XXX"} kr</p>
            <p>Pris exkl. moms: {offer?.price_ex_vat || "X XXX"} kr</p>
            <p>Moms: {offer?.vat || "X XXX"} kr</p>
            <p className="font-bold mt-2">Totalt: {offer?.price_total || "X XXX"} kr</p>
          </div>

          {/* Call to actions */}
          <div className="flex flex-col md:flex-row justify-center gap-4 mt-8">
            <button className="bg-[#194C66] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#163b4d]">
              Boka
            </button>
            <button className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-600">
              Ändra din offert
            </button>
            <button className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700">
              Avböj
            </button>
          </div>

          {/* Footer */}
          <div className="text-center space-y-6 mt-10">
            <div className="flex flex-col items-center">
              <Image src="/print_icon.png" alt="Skriv ut" width={40} height={40} />
              <p className="mt-2 text-sm text-gray-700">Visa i utskriftsformat</p>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Genom att acceptera denna offert bekräftar ni samtidigt att ni
              tagit del av våra resevillkor, som ni hittar här. Observera att vi
              reserverar oss för att det aktuella datumet kan vara fullbokat.
              Slutlig kapacitet kontrolleras vid bokningstillfället och bekräftas
              först genom en skriftlig bokningsbekräftelse från oss. Vill du boka
              resan eller har du frågor och synpunkter? Då är du alltid välkommen
              att kontakta oss – vi hjälper dig gärna. Våra ordinarie öppettider
              är vardagar kl. 08:00–17:00. För akuta bokningar med kortare varsel
              än två arbetsdagar ber vi dig ringa vårt journummer: 010-777 21 58.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
