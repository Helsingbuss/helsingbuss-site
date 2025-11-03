import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";

type Booking = {
  id: string;
  booking_number: string;     // t.ex. "BK259153"
  passengers: number | null;

  // kund
  contact_person: string | null;
  customer_email: string | null;
  customer_phone: string | null;

  // utresa
  departure_place: string | null;
  destination: string | null;
  departure_date: string | null; // YYYY-MM-DD
  departure_time: string | null; // HH:MM

  // övrigt
  notes: string | null;
};

function v(x: any, fallback = "—") {
  if (x === null || x === undefined || x === "") return fallback;
  return String(x);
}

export default function BookingPublicPage() {
  const router = useRouter();
  const { number } = router.query as { number?: string };

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!number) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const u = new URL("/api/bookings/by-number", window.location.origin);
        u.searchParams.set("no", String(number));
        const res = await fetch(u.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        setBooking(j?.booking ?? null);
        if (!j?.booking) setErr("Kunde inte läsa bokningen.");
      } catch (e: any) {
        setErr(e?.message || "Kunde inte läsa bokningen.");
        setBooking(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [number]);

  return (
    <div className="min-h-screen bg-[#f5f4f0] py-8">
      <div className="mx-auto w-full max-w-3xl bg-white rounded-lg shadow px-6 py-6">
        {/* Logga + titel */}
        <div className="flex items-center justify-between mb-3">
          <Image src="/mork_logo.png" alt="Helsingbuss" width={260} height={46} priority />
        </div>

        <h1 className="text-2xl font-semibold text-[#0f172a] mb-3">Bokningsbekräftelse</h1>

        {loading && (
          <div className="rounded bg-[#f8fafc] border border-[#e5e7eb] p-3 text-[#194C66]/70">
            Laddar…
          </div>
        )}

        {!loading && err && (
          <div className="rounded bg-red-50 border border-red-200 p-3 text-red-700">
            {err}
          </div>
        )}

        {!loading && !err && booking && (
          <>
            {/* Övre fyra kort – samma känsla som offert */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Order */}
              <div className="border rounded-lg p-4">
                <div className="text-sm text-[#0f172a]/60 mb-1">Order</div>
                <div className="text-[#0f172a] space-y-1">
                  <div>
                    <span className="font-semibold">Ordernummer (Boknings ID):</span>{" "}
                    {v(booking.booking_number)}
                  </div>
                  <div>
                    <span className="font-semibold">Passagerare:</span>{" "}
                    {v(booking.passengers)}
                  </div>
                </div>
              </div>

              {/* Kund */}
              <div className="border rounded-lg p-4">
                <div className="text-sm text-[#0f172a]/60 mb-1">Kund</div>
                <div className="text-[#0f172a] space-y-1">
                  <div>
                    <span className="font-semibold">Kontakt:</span>{" "}
                    {v(booking.contact_person)}
                  </div>
                  <div>
                    <span className="font-semibold">E-post:</span>{" "}
                    {v(booking.customer_email)}
                  </div>
                  <div>
                    <span className="font-semibold">Telefon:</span>{" "}
                    {v(booking.customer_phone)}
                  </div>
                </div>
              </div>

              {/* Utresa */}
              <div className="border rounded-lg p-4">
                <div className="text-sm text-[#0f172a]/60 mb-1">Utresa</div>
                <div className="text-[#0f172a] space-y-1">
                  <div>
                    <span className="font-semibold">Datum:</span>{" "}
                    {v(booking.departure_date)}
                  </div>
                  <div>
                    <span className="font-semibold">Tid:</span>{" "}
                    {v(booking.departure_time)}
                  </div>
                  <div>
                    <span className="font-semibold">Från:</span>{" "}
                    {v(booking.departure_place)}
                  </div>
                  <div>
                    <span className="font-semibold">Till:</span>{" "}
                    {v(booking.destination)}
                  </div>
                </div>
              </div>

              {/* Övrigt */}
              <div className="border rounded-lg p-4">
                <div className="text-sm text-[#0f172a]/60 mb-1">Övrigt</div>
                <div className="text-[#0f172a]">
                  {v(booking.notes, "Ingen information.")}
                </div>
              </div>
            </div>

            {/* Kontakttext nederst */}
            <div className="mt-4 rounded border p-3 text-sm text-[#0f172a]/80 bg-[#f8fafc]">
              Frågor om din resa? Ring vårt Kundteam under vardagar 8–17:{" "}
              <strong>010-405 38 38</strong>, eller besvara detta mail. Vid akuta
              trafikärenden som inträffar efter kontorstid når du vår jour på{" "}
              <strong>010-777 21 58</strong>.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
