import Link from "next/link";
import { useRouter } from "next/router";

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Översikt", href: "/invest" },
  { label: "Affärsplan", href: "/invest/affarsplan" },
  { label: "Nyckeltal & tabeller", href: "/invest/nyckeltal" },
  { label: "Offertläge", href: "/invest/offerter" },
  { label: "Dokument & avtal", href: "/invest/dokument" },
];

export default function InvestorSideNav() {
  const router = useRouter();
  const path = router.pathname || "";

  return (
    <nav className="h-full rounded-2xl bg-white border border-slate-200 shadow-sm px-3 py-4 flex flex-col">
      <div className="px-2 pb-3 border-b border-slate-100 mb-3">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#194C66]">
          Helsingbuss
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Investerarvy
        </p>
      </div>

      <ul className="space-y-1 text-sm flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/invest"
              ? path === "/invest"
              : path.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "flex items-center justify-between rounded-xl px-3 py-2 transition-colors",
                  isActive
                    ? "bg-[#194C66]/10 text-[#194C66] font-semibold"
                    : "text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="text-[10px] uppercase tracking-wide">
                    aktiv
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        <p>Senast uppdaterad rapport visas automatiskt.</p>
      </div>
    </nav>
  );
}
