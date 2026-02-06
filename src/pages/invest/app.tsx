import Head from "next/head";
import type { NextPage } from "next";
import InvestorLayout from "@/components/investors/InvestorLayout";

const InvestorAppPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Investerarportal – översikt | Helsingbuss</title>
        <meta
          name="description"
          content="Översikt för investerare i Helsingbuss – affärsplan, nyckeltal och rapporter."
        />
        <meta name="robots" content="noindex" />
      </Head>

      <InvestorLayout>
        <div className="flex flex-col gap-6">
          <section>
            <h1 className="text-2xl font-semibold text-[#0f172a]">
              Investeraröversikt
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Här samlar vi affärsplan, ekonomiska nyckeltal, godkända offerter
              och uppdateringar om Helsingbuss utveckling. Allt du ser här
              kommer stegvis kopplas direkt mot våra tabeller i databasen.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#194C66]">
                Affärsplan
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Här kommer vi lägga en interaktiv affärsplan som hämtar
                nyckeltal och prognoser direkt från databasen.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#194C66]">
                Nyckeltal
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Dashboards med intäkter, kostnader, godkända offerter och
                lönsamhet per linje/produkt.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#194C66]">
                Dokument & avtal
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Här samlar vi investeraravtal, sekretessavtal och annan
                dokumentation för dina investeringar.
              </p>
            </div>
          </section>

          <section className="mt-2">
            <h2 className="text-sm font-semibold text-[#0f172a]">
              Nästa steg i utvecklingen
            </h2>
            <ul className="mt-2 text-sm text-slate-600 list-disc pl-5 space-y-1">
              <li>Koppla sidan mot Supabase-auth (riktig inloggning).</li>
              <li>
                Länka affärsplan/nyckeltal direkt mot tabeller (offers,
                kostnader, intäkter m.m.).
              </li>
              <li>
                Lägg till veckovisa mail/notiser med sammanfattning till
                investerare.
              </li>
            </ul>
          </section>
        </div>
      </InvestorLayout>
    </>
  );
};

export default InvestorAppPage;
