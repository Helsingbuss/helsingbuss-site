// src/pages/mina-sidor/min-profil-demo.tsx
import Head from "next/head";
import Link from "next/link";

const accountNav = [
  { href: "/mina-sidor/demo", label: "Översikt (demo)" },
  { href: "/mina-sidor/min-profil-demo", label: "Min profil (demo)", active: true },
  { href: "/mina-sidor/mina-biljetter-demo", label: "Mina biljetter (demo)" },
  { href: "/mina-sidor/kommande-resor-demo", label: "Kommande resor (demo)" },
  { href: "/mina-sidor/intjanad-poang-demo", label: "Intjänad poäng (demo)" },
  { href: "/mina-sidor/quiz-tavlingar-demo", label: "Quiz & tävlingar (demo)" },
  { href: "#", label: "Logga ut", variant: "ghost" },
];

export default function MinProfilDemoPage() {
  return (
    <>
      <Head>
        <title>Mina sidor – Min profil (demo) | Helsingbuss</title>
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* Top-nav – samma stil som övriga demo-sidor */}
        <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
                HB
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">
                  Helsingbuss
                </div>
                <div className="text-xs text-slate-500">
                  Demo – Mina sidor
                </div>
              </div>
            </div>

            <nav className="hidden gap-6 text-xs font-medium text-slate-600 md:flex">
              <span className="cursor-default hover:text-slate-900">
                Tidtabeller
              </span>
              <span className="cursor-default hover:text-slate-900">
                Destinationer
              </span>
              <span className="cursor-default hover:text-slate-900">
                Vanliga frågor
              </span>
              <span className="cursor-default hover:text-slate-900">
                Kundservice
              </span>
              <span className="cursor-default hover:text-slate-900">
                Boka buss
              </span>
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden text-right text-xs leading-tight sm:block">
                <div className="text-slate-400">Inloggad som</div>
                <div className="font-semibold text-slate-900">
                  Demo Resenär
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                D
              </div>
            </div>
          </div>
        </header>

        {/* Content wrapper – kant till kant men med maxbredd */}
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
          {/* Brödsmula */}
          <div className="mb-4 text-xs text-slate-500">
            Helsingbuss &gt; Mina sidor &gt; Min profil (demo)
          </div>

          <div className="grid gap-8 lg:grid-cols-[220px,minmax(0,1fr)]">
            {/* Vänster meny – samma som på övriga sidor */}
            <aside className="self-start rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Mina sidor
              </div>
              <nav className="space-y-1">
                {accountNav.map((item) => {
                  const isActive = item.active;
                  const baseClasses =
                    "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition";
                  const activeClasses =
                    "bg-emerald-50 text-emerald-800 font-semibold";
                  const inactiveClasses =
                    "text-slate-700 hover:bg-slate-50";

                  if (item.variant === "ghost") {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Logga ut (demo)
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        baseClasses +
                        " " +
                        (isActive ? activeClasses : inactiveClasses)
                      }
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          Aktiv
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Huvudinnehåll – Min profil */}
            <section className="space-y-6">
              {/* Demo-rad */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                    Min profil – demo
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">
                    Här visar vi hur dina personuppgifter, kontaktuppgifter
                    och inloggningsinställningar kan se ut. I skarpt läge
                    kan du uppdatera dina uppgifter direkt här.
                  </p>
                </div>

                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                  Demo-version – inga riktiga kunduppgifter
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
                {/* Personuppgifter / kontakt */}
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        Personuppgifter &amp; kontakt
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Dessa uppgifter använder vi för bokningsbekräftelser,
                        e-biljetter och viktig information inför din resa.
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                      Medlemskap: Silvermedlem · sedan 2025
                    </div>
                  </div>

                  <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Förnamn
                      </dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        Demo
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Efternamn
                      </dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        Resenär
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Resenärsnummer
                      </dt>
                      <dd className="mt-1 font-mono text-xs text-slate-900">
                        HB-DEMO-001
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Kundklubb
                      </dt>
                      <dd className="mt-1 text-sm text-slate-900">
                        Silvermedlem
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 h-px bg-slate-100" />

                  <div className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        E-postadress
                      </dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        demo@helsingbuss.se
                      </dd>
                      <p className="mt-1 text-xs text-slate-500">
                        Hit skickar vi bokningsbekräftelser och e-biljetter.
                      </p>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Mobilnummer
                      </dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        +46 70 123 45 67
                      </dd>
                      <p className="mt-1 text-xs text-slate-500">
                        Används för SMS-biljetter och viktiga reseuppdateringar.
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Adress
                      </dt>
                      <dd className="mt-1 text-sm text-slate-400">
                        Lägger vi till i skarpt läge.
                      </dd>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      className="inline-flex cursor-not-allowed items-center justify-center rounded-full bg-slate-900/5 px-4 py-2 text-xs font-semibold text-slate-500"
                    >
                      Spara ändringar (demo)
                    </button>
                    <p className="text-[11px] text-slate-400">
                      I skarpt läge kan du uppdatera dina uppgifter och spara med ett klick.
                    </p>
                  </div>
                </div>

                {/* Inloggning & säkerhet */}
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Inloggning &amp; säkerhet
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Här hanterar kunden sitt lösenord och säkerhetsinställningar.
                      I skarpt läge lägger vi till tvåfaktorsinloggning, verifierad
                      e-post och en logg över senaste inloggningar.
                    </p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Inloggningsadress
                      </div>
                      <div className="mt-1 font-medium text-slate-900">
                        demo@helsingbuss.se
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Lösenord
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <span className="font-mono text-sm tracking-[0.25em] text-slate-700">
                          ••••••••
                        </span>
                        <button
                          type="button"
                          className="inline-flex cursor-not-allowed items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                        >
                          Byt lösenord (demo)
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">
                        Säkerhet
                      </div>
                      <ul className="mt-1 space-y-1 list-disc pl-4">
                        <li>All inloggning sker via säker anslutning (HTTPS).</li>
                        <li>All kunddata lagras i EU-baserade datacenter.</li>
                        <li>
                          I skarpt läge kan du logga ut alla enheter med ett klick.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Kommunikation & samtycken – span över båda kolumnerna */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        Kommunikation &amp; samtycken
                      </h2>
                      <p className="mt-1 max-w-2xl text-xs text-slate-500">
                        I skarpt läge väljer kunden vilka typer av information som ska
                        skickas – t.ex. endast viktig reseinformation eller även
                        nyheter, erbjudanden och PrideXpress-kampanjer.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Reseinformation */}
                    <label className="flex cursor-default items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="mt-1 h-4 w-4 rounded border-emerald-400 text-emerald-600"
                      />
                      <div>
                        <div className="font-semibold text-emerald-900">
                          Reseinformation
                        </div>
                        <p className="mt-1 text-xs text-emerald-900/80">
                          Bekräftelser, e-biljetter och viktig information om avgångar,
                          tider och ändringar. Alltid aktiverat.
                        </p>
                      </div>
                    </label>

                    {/* Nyheter & inspiration */}
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">
                          Nyheter &amp; inspiration
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          Tips på nya resor, kampanjer och upplevelser med Helsingbuss.
                        </p>
                      </div>
                    </label>

                    {/* PrideXpress & specialkampanjer */}
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">
                          PrideXpress &amp; specialkampanjer
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          Extra utskick kopplade till PrideXpress, quiz och tävlingar –
                          avmarkeras om kunden inte vill ha dem.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
