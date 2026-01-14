// src/modules/sundra/shared/nav.ts

export type NavItem = {
  label: string;
  href: string;
};

export type NavGroup = {
  key: string;
  label: string;
  items: NavItem[];
};

// Agent (valfritt – inte aktivt använd just nu)
export const SUNDRa_AGENT_NAV: NavGroup[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    items: [{ label: "Dashboard", href: "/agent/sundra" }],
  },
  {
    key: "booking",
    label: "Bokning",
    items: [
      { label: "Skapa bokning", href: "/agent/sundra/skapa-bokning" },
      { label: "Bokningar", href: "/agent/sundra/bokningar" },
    ],
  },
  {
    key: "customers",
    label: "Kunder",
    items: [{ label: "Kunder", href: "/agent/sundra/kunder" }],
  },
];
