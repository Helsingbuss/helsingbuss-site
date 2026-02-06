import Image from "next/image";

type InvestorTopBarProps = {
  title?: string;
  subtitle?: string;
};

export default function InvestorTopBar({
  title = "Investerarportal",
  subtitle = "Insyn i Helsingbuss utveckling",
}: InvestorTopBarProps) {
  return (
    <header className="h-16 w-full border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Image
            src="/mork_logo.png"
            alt="Helsingbuss"
            width={150}
            height={32}
            priority
          />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-xs font-semibold tracking-[0.18em] uppercase text-[#194C66]">
            Investerare
          </span>
          <span className="text-sm text-slate-600">
            {subtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs text-slate-500">Frågor?</span>
          <a
            href="mailto:invest@helsingbuss.se"
            className="text-xs font-medium text-[#194C66] underline"
          >
            invest@helsingbuss.se
          </a>
        </div>
        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-[#194C66]/5 text-xs font-semibold text-[#194C66]">
          INV
        </div>
      </div>
    </header>
  );
}
