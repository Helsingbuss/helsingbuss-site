"use client";

// src/components/sundra/Sidebar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

type Role = "admin" | "agent";

type NavItem = {
  label: string;
  href: string;
};

type NavGroup = {
  key: string;
  label: string;
  // ✅ FIX: props ska INTE vara optional, så matchar det dina Icon*-funktioner
  icon: (props: { className?: string }) => JSX.Element;
  items: NavItem[];
};

function detectRole(path: string): Role {
  return path.startsWith("/agent") ? "agent" : "admin";
}

function stripQuery(path: string) {
  return path.split("?")[0] || "/";
}

function IconChevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** --- Ikoner (huvudkategorier) --- */
function IconHome({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Resor = “map pin + route” */
function IconTrips({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M10 20s-6-4.4-6-10a6 6 0 0 1 12 0c0 5.6-6 10-6 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M14.5 17.5h2.2c1.9 0 3.3-1 3.3-2.5s-1.4-2.5-3.3-2.5h-1.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBooking({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4 8h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6 6h12a2 2 0 0 1 2 2v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCustomers({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 21a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoney({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M3 7h18v10H3V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M7 10h0M17 14h0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconOperators({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M16 11a4 4 0 1 0-8 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 21a6 6 0 0 1 12 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 14c2.76 0 5 2.24 5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMail({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function IconTemplate({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path
        d="M8 11h8M8 15h8M8 19h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSupport({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 12a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 12v5a2 2 0 0 0 2 2h2v-7H6a2 2 0 0 0-2 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M20 12v5a2 2 0 0 1-2 2h-2v-7h2a2 2 0 0 1 2 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 20h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19 12a7 7 0 0 0-.14-1.4l2.03-1.17-2-3.46-2.28 1A7 7 0 0 0 13.4 4L12.5 1h-4L7.6 4A7 7 0 0 0 4.4 6.97l-2.28-1-2 3.46 2.03 1.17A7 7 0 0 0 2 12c0 .48.05.95.14 1.4L.11 14.57l2 3.46 2.28-1A7 7 0 0 0 7.6 20l.9 3h4l.9-3a7 7 0 0 0 3.21-2.97l2.28 1 2-3.46-2.03-1.17c.09-.45.14-.92.14-1.4Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 21a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 8h4M20 6v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Sidebar() {
  const router = useRouter();
  const path = stripQuery(router.asPath || "/");
  const role = detectRole(path);
  const base = role === "agent" ? "/agent/sundra" : "/admin/sundra";

  const groups: NavGroup[] = useMemo(() => {
    // BOKNINGSAGENT
    if (role === "agent") {
      return [
        {
          key: "dashboard",
          label: "Dashboard",
          icon: IconHome,
          items: [{ label: "Dashboard", href: `${base}` }],
        },
        {
          key: "booking",
          label: "Bokning",
          icon: IconBooking,
          items: [
            { label: "Skapa bokning", href: `${base}/skapa-bokning` },
            { label: "Bokningar", href: `${base}/bokningar` },
          ],
        },
        {
          key: "customers",
          label: "Kunder",
          icon: IconCustomers,
          items: [{ label: "Kunder", href: `${base}/kunder` }],
        },
        {
          key: "economy",
          label: "Ekonomi",
          icon: IconMoney,
          items: [
            { label: "Betallänkar", href: `${base}/betallankar` },
            { label: "Fakturor", href: `${base}/fakturor` },
          ],
        },
        {
          key: "support",
          label: "Support / Chatt",
          icon: IconSupport,
          items: [{ label: "Support / Chatt", href: `${base}/support` }],
        },
      ];
    }

    // ADMIN
    return [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: IconHome,
        items: [{ label: "Dashboard", href: `${base}` }],
      },
      {
        key: "trips",
        label: "Resor",
        icon: IconTrips,
        items: [
          { label: "Skapa resa (Resmall)", href: `${base}/resor/ny` },
          { label: "Lista resor", href: `${base}/resor` },

          { label: "Hållplatser (Register)", href: `${base}/resor/hallplatser` },
          { label: "Rutter / Linjer", href: `${base}/resor/rutter` },

          { label: "Biljettyper", href: `${base}/resor/biljettyper` },
          { label: "Biljettpriser", href: `${base}/resor/biljettpriser` },

          { label: "Kampanjer", href: `${base}/kampanjer` },
          { label: "Lägg till kampanj", href: `${base}/kampanjer/ny` },

          { label: "Alla avgångar", href: `${base}/avgangar` },

          { label: "Tillval / Extra", href: `${base}/resor/tillval` },
        ],
      },
      {
        key: "booking",
        label: "Bokning",
        icon: IconBooking,
        items: [
          { label: "Bokningar", href: `${base}/bokningar` },
          { label: "Kunder", href: `${base}/kunder` },
        ],
      },
      {
        key: "economy",
        label: "Ekonomi",
        icon: IconMoney,
        items: [
          { label: "Betalningar", href: `${base}/betalningar` },
          { label: "Fakturor", href: `${base}/fakturor` },
        ],
      },
      {
        key: "operators",
        label: "Operatörer",
        icon: IconOperators,
        items: [
          { label: "Register", href: `${base}/operatorer/register` },
          { label: "Dokument", href: `${base}/operatorer/dokument` },
          { label: "Avtal", href: `${base}/operatorer/avtal` },
          { label: "Körorder", href: `${base}/operatorer/kororder` },
        ],
      },

      // Mallar (biljettdesign + e-postmallar + bra att veta + resevillkor)
      {
        key: "templates",
        label: "Mallar",
        icon: IconTemplate,
        items: [
          { label: "Biljettdesign", href: `${base}/mallar/biljettdesign` },
          { label: "E-postmallar", href: `${base}/mallar/email` },
          { label: "SMS-mallar", href: `${base}/mallar/sms` },

          { label: "Bra att veta", href: `${base}/mallar/bra-att-veta` },
          { label: "Resevillkor", href: `${base}/mallar/resevillkor` },
          { label: "Viktig information", href: `${base}/mallar/viktig-info` },
        ],
      },

      // Utskick (skickmotor)
      {
        key: "mailouts",
        label: "Utskick",
        icon: IconMail,
        items: [
          { label: "Massutskick", href: `${base}/utskick/massutskick` },
          { label: "Automatik", href: `${base}/utskick/automatik` },
        ],
      },

      {
        key: "support",
        label: "Support / Chatt",
        icon: IconSupport,
        items: [{ label: "Support / Chatt", href: `${base}/support` }],
      },

      // Inställningar + användare
      {
        key: "settings",
        label: "Inställningar",
        icon: IconSettings,
        items: [
          { label: "Översikt", href: `${base}/installningar` },
          { label: "Användare", href: `${base}/installningar/anvandare` },
          { label: "Roller & behörigheter", href: `${base}/installningar/roller` },
          { label: "Rabatt-tak", href: `${base}/installningar/rabatt-tak` },
          { label: "Betalning", href: `${base}/installningar/betalning` },
          { label: "Policies", href: `${base}/installningar/policies` },
          { label: "Fakturaregler", href: `${base}/installningar/fakturaregler` },
          { label: "Audit logg", href: `${base}/installningar/audit-logg` },
        ],
      },
    ];
  }, [role, base]);

  const initialOpen = useMemo(() => {
    const hit = groups.find((g) =>
      g.items.some((i) => path === i.href || path.startsWith(i.href + "/"))
    );
    return hit?.key ?? "dashboard";
  }, [groups, path]);

  const [openKey, setOpenKey] = useState<string>(initialOpen);

  useEffect(() => {
    setOpenKey(initialOpen);
  }, [initialOpen]);

  return (
    <aside
      className="hidden w-72 border-r bg-white md:block"
      style={{
        position: "fixed",
        left: 0,
        top: 64, // topbar: h-16
        height: "calc(100vh - 64px)",
        zIndex: 30,
      }}
    >
      <div className="h-full overflow-y-auto px-3 py-4">
        <div className="mb-3 px-2 text-xs font-semibold text-gray-500">MENY</div>

        <nav className="space-y-2">
          {groups.map((group) => {
            const isOpen = openKey === group.key;
            const hasActive = group.items.some(
              (i) => path === i.href || path.startsWith(i.href + "/")
            );
            const Icon = group.icon;

            return (
              <div
                key={group.key}
                className={[
                  "rounded-2xl border",
                  hasActive ? "border-gray-200 bg-gray-50" : "border-transparent",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? "" : group.key)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-gray-50"
                >
                  <span
                    className={[
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                      hasActive ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-gray-900">
                      {group.label}
                    </span>
                  </span>

                  <IconChevron
                    className={[
                      "h-5 w-5 text-gray-500 transition-transform",
                      isOpen ? "rotate-90" : "",
                    ].join(" ")}
                  />
                </button>

                {isOpen ? (
                  <div className="px-3 pb-3">
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const active =
                          path === item.href || path.startsWith(item.href + "/");
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={[
                              "block rounded-xl px-3 py-2 text-sm transition",
                              active
                                ? "bg-gray-900 text-white font-semibold"
                                : "text-gray-700 hover:bg-gray-100",
                            ].join(" ")}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
