import Head from "next/head";
import type { FormEvent } from "react";

export default function InvestorLoginPage() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TODO: Koppla till riktig inloggning (Supabase / API)
    // Just nu: fejkar inloggning och skickar vidare till invest-dashboard.
    if (typeof window !== "undefined") {
      window.location.href = "/invest/app";
    }
  };

  return (
    <>
      <Head>
        <title>Investerarportal  inloggning | Helsingbuss</title>
        <meta
          name="description"
          content="Logga in till Helsingbuss investerarportal."
        />
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-[#f5f4f0] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-md border border-slate-200 px-6 py-8">
          <div className="mb-6 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#194C66]/80 uppercase">
              Helsingbuss Investerare
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#0f172a]">
              Logga in som investerare
            </h1>
            <p className="mt-2 text-sm text-[#4b5563]">
              Ange dina uppgifter för att se affärsplan, nyckeltal och
              uppdateringar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#0f172a]"
              >
                E-postadress
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#194C66] focus:border-[#194C66] bg-white"
                placeholder="namn@exempel.se"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#0f172a]"
              >
                Lösenord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#194C66] focus:border-[#194C66] bg-white"
                placeholder=""
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-[#194C66] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#153a4d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#194C66]"
            >
              Logga in
            </button>
          </form>

          <p className="mt-4 text-xs text-center text-gray-500">
            Saknar du inloggning? Kontakta{" "}
            <a
              href="mailto:invest@helsingbuss.se"
              className="underline text-[#194C66]"
            >
              invest@helsingbuss.se
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}
