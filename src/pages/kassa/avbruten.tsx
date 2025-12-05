// src/pages/kassa/avbruten.tsx
import Head from "next/head";
import { useEffect } from "react";

const REDIRECT_URL = "https://www.helsingbuss.se";

export default function KassaAvbrutenPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = REDIRECT_URL;
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>Betalning avbruten – Helsingbuss</title>
      </Head>

      <div className="min-h-screen bg-white py-10 px-4">
        <div className="max-w-xl mx-auto">
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#194C66]/70">
              Helsingbuss
            </div>
            <h1 className="text-xl font-semibold text-[#0f172a]">
              Betalningen avbröts
            </h1>
            <p className="text-sm text-slate-600">
              Din bokning har inte slutförts. Du kan när som helst gå tillbaka
              till vår webbplats och försöka igen.
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-800 shadow-sm">
            <p className="font-semibold mb-1">
              Ingen betalning genomfördes den här gången.
            </p>
            <p>
              Du skickas automatiskt vidare till{" "}
              <span className="font-semibold">helsingbuss.se</span> inom några
              sekunder, eller klicka på knappen nedan.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <a
              href={REDIRECT_URL}
              className="inline-flex items-center px-5 py-2 rounded-full bg-[#194C66] text-white text-sm font-semibold shadow-sm hover:bg-[#163b4d]"
            >
              Till helsingbuss.se
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
