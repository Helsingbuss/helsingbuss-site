// src/pages/dashboard.tsx
import {
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  UsersIcon,
  ChartBarIcon,
  TicketIcon,
} from "@heroicons/react/24/solid";
import Layout from "../components/Layout";

export default function Dashboard() {
  return (
    <Layout active="dashboard">
      {/* Titel + liten beskrivning */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Hem</h1>
        <p className="mt-1 text-sm text-slate-500">
          Översikt över dina Helsingbuss-verktyg och moduler.
        </p>
      </div>

      {/* Huvudcontainer (vit box) – nu full bredd som innan */}
      <div className="w-full bg-white/90 rounded-2xl shadow-sm ring-1 ring-slate-100 p-6 md:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Vänster sida – stora kort + ett mindre under */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stora kort överst */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Helsingbuss Booking – klickbar till login.helsingbuss.se/Start */}
              <a
                href="https://login.helsingbuss.se/start"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="relative h-[220px] md:h-[230px] rounded-2xl bg-gradient-to-b from-pink-200 via-rose-100 to-purple-200 shadow-md px-6 py-5 flex items-center justify-between overflow-hidden transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg">
                  <div className="max-w-[60%]">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-rose-600 mb-1 block">
                      Huvudportal
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Helsingbuss Booking
                    </h2>
                    <p className="text-sm text-slate-700">
                      Order, offerter &amp; bokning på ett ställe.
                    </p>
                  </div>

                  <div className="hidden md:flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-white/70 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ClipboardDocumentListIcon className="h-10 w-10 text-rose-500" />
                    </div>
                  </div>
                </div>
              </a>

              {/* Helsingbuss VisualPlan */}
              <div className="relative h-[220px] md:h-[230px] rounded-2xl bg-gradient-to-b from-purple-200 via-indigo-100 to-pink-200 shadow-md px-6 py-5 flex items-center justify-between overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="max-w-[60%]">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 mb-1 block">
                    Planering
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    Helsingbuss VisualPlan
                  </h2>
                  <p className="text-sm text-slate-700">
                    Grafisk bussplanering &amp; chaufförsplanering.
                  </p>
                </div>

                <div className="hidden md:flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-white/70 shadow-md flex items-center justify-center hover:scale-105 transition-transform">
                    <CalendarDaysIcon className="h-10 w-10 text-indigo-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mindre rad under – Paketresor */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 flex items-center gap-3 transition hover:bg-slate-100">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100">
                <TicketIcon className="h-5 w-5 text-rose-500" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Helsingbuss Paketresor
                </h3>
                <p className="text-xs text-slate-500">
                  Biljetter och biljettpriser till paketresor.
                </p>
              </div>
            </div>
          </div>

          {/* Höger sida – Modullista */}
          <aside className="lg:col-span-1 lg:border-l lg:border-slate-100 lg:pl-6">
            <h2 className="text-sm font-semibold text-slate-500 mb-3">
              Moduler &amp; appar
            </h2>

            <div className="space-y-3">
              {/* CrewCenter */}
              <button
                type="button"
                className="w-full text-left flex items-start justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 hover:bg-slate-50 hover:shadow-sm transition"
              >
                <div className="flex gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-50">
                    <UsersIcon className="h-5 w-5 text-rose-500" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Helsingbuss CrewCenter
                    </div>
                    <p className="text-xs text-slate-500">
                      Chaufförregister &amp; bokningsagenter.
                    </p>
                  </div>
                </div>
              </button>

              {/* PriceBoard */}
              <button
                type="button"
                className="w-full text-left flex items-start justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 hover:bg-slate-50 hover:shadow-sm transition"
              >
                <div className="flex gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                    <BanknotesIcon className="h-5 w-5 text-emerald-500" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Helsingbuss PriceBoard
                    </div>
                    <p className="text-xs text-slate-500">
                      Hantera dina priser och prislistor.
                    </p>
                  </div>
                </div>
              </button>

              {/* Lejmodul */}
              <button
                type="button"
                className="w-full text-left flex items-start justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 hover:bg-slate-50 hover:shadow-sm transition"
              >
                <div className="flex gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-50">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-orange-500" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Helsingbuss Lejmodul
                    </div>
                    <p className="text-xs text-slate-500">
                      Ta emot offerter från samarbetspartners.
                    </p>
                  </div>
                </div>
              </button>

              {/* Trafivo Reports */}
              <button
                type="button"
                className="w-full text-left flex items-start justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 hover:bg-slate-50 hover:shadow-sm transition"
              >
                <div className="flex gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50">
                    <ChartBarIcon className="h-5 w-5 text-indigo-500" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Trafivo Reports
                    </div>
                    <p className="text-xs text-slate-500">
                      Journalföring &amp; rapporter.
                    </p>
                  </div>
                </div>
              </button>

              {/* Schedule */}
              <button
                type="button"
                className="w-full text-left flex items-start justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 hover:bg-slate-50 hover:shadow-sm transition"
              >
                <div className="flex gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-purple-50">
                    <CalendarDaysIcon className="h-5 w-5 text-purple-500" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Helsingbuss Schedule
                    </div>
                    <p className="text-xs text-slate-500">
                      Linjebussmodul &amp; schema.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
