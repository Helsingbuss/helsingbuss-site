// src/pages/kassa/tack.tsx
import Head from "next/head";
import { useEffect } from "react";

const REDIRECT_URL = "https://www.helsingbuss.se";

export default function KassaTackPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = REDIRECT_URL;
    }, 8000); // 8 sekunder

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>Tack för din bokning – Helsingbuss</title>
      </Head>

      <div className="min-h-screen bg-white py-10 px-4">
        <div className="max-w-xl mx-auto">
          {/* Rubrik i samma stil som kassan */}
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#194C66]/70">
              Helsingbuss
            </div>
            <h1 className="text-xl font-semibold text-[#0f172a]">
              Tack för din bokning!
            </h1>
            <p className="text-sm text-slate-600">
              Din betalning är genomförd. Vi behandlar nu din bokning och
              skickar bekräftelse samt biljett via e-post.
            </p>
          </div>

          {/* Info-ruta */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-800 shadow-sm">
            <p className="font-semibold mb-1">
              Bokningen är klar och betalningen mottagen.
            </p>
            <p>
              Du skickas automatiskt vidare till{" "}
              <span className="font-semibold">helsingbuss.se</span> inom några
              sekunder. Om inget händer, klicka på knappen nedan.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <a
              href={REDIRECT_URL}
              className="inline-flex items-center px-5 py-2 rounded-full bg-[#194C66] text-white text-sm font-semibold shadow-sm hover:bg-[#163b4d]"
            >
              Gå till helsingbuss.se nu
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
