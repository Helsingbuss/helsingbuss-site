import type { ReactNode } from "react";
import InvestorTopBar from "./InvestorTopBar";
import InvestorSideNav from "./InvestorSideNav";

type InvestorLayoutProps = {
  children: ReactNode;
};

export default function InvestorLayout({ children }: InvestorLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col">
      <InvestorTopBar />

      <div className="flex-1 px-4 py-4 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-4 lg:gap-6 items-stretch">
          <aside className="lg:h-full">
            <InvestorSideNav />
          </aside>

          <main className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 lg:p-6 flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
