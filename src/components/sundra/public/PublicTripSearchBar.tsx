// src/components/sundra/public/PublicTripSearchBar.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

export type TabKey = "DAY" | "MULTI" | "FUN" | "WINTER" | "CRUISE";

export type PickupOption = { id: string; label: string };

export type PublicSearchValues = {
  tab: TabKey;
  pickupId: string;
  date: string;
  adults: number;
  children: number;
  rooms?: number;
};

export type PublicTripSearchBarProps = {
  title?: string;

  // Dessa props används av PublicHeader
  fullWidth?: boolean; // ✅ accepterad för att TS ska vara glad (designen är redan fullbredd i din komponent)
  defaultTab?: TabKey;
  pickupOptions?: PickupOption[];
  defaultPickupId?: string;

  defaultDate?: string;
  defaultAdults?: number;
  defaultChildren?: number;
  defaultRooms?: number;

  onSearch?: (values: PublicSearchValues) => void;
};

const BAR_H = 56;
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function PublicTripSearchBar({
  title = "Sök din resa här",
  // tas emot (så PublicHeader inte kraschar), men din design är redan fullbredd → vi ändrar inget visuellt
  fullWidth: _fullWidth,

  defaultTab,
  pickupOptions: pickupOptionsProp,
  defaultPickupId,

  defaultDate,
  defaultAdults,
  defaultChildren,
  defaultRooms,

  onSearch,
}: PublicTripSearchBarProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [contentH, setContentH] = useState(0);

  // ✅ Behåll dina demo-upphämtningar som fallback (exakt som innan)
  const fallbackPickupOptions = useMemo<PickupOption[]>(
    () => [
      { id: "hb", label: "Helsingborg C" },
      { id: "ag", label: "Ängelholm Station" },
      { id: "la", label: "Landskrona Station" },
      { id: "ma", label: "Malmö C" },
    ],
    []
  );

  // ✅ Om PublicHeader skickar pickupOptions, använd dem. Annars fallback.
  const pickupOptions = (pickupOptionsProp && pickupOptionsProp.length > 0)
    ? pickupOptionsProp
    : fallbackPickupOptions;

  // Form-state (behåller din logik)
  const [tab, setTab] = useState<TabKey>(defaultTab ?? "DAY");
  const [pickupId, setPickupId] = useState<string>(
    defaultPickupId ?? pickupOptions[0]?.id ?? ""
  );
  const [date, setDate] = useState<string>(defaultDate ?? "");
  const [adults, setAdults] = useState<number>(typeof defaultAdults === "number" ? defaultAdults : 2);
  const [children, setChildren] = useState<number>(typeof defaultChildren === "number" ? defaultChildren : 0);
  const [rooms, setRooms] = useState<number>(typeof defaultRooms === "number" ? defaultRooms : 1);

  // ✅ Håll sync om defaults ändras (shallow route updates etc) – utan att ändra UI
  useEffect(() => {
    if (defaultTab) setTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (defaultPickupId) setPickupId(defaultPickupId);
  }, [defaultPickupId]);

  useEffect(() => {
    if (typeof defaultDate === "string") setDate(defaultDate);
  }, [defaultDate]);

  useEffect(() => {
    if (typeof defaultAdults === "number") setAdults(defaultAdults);
  }, [defaultAdults]);

  useEffect(() => {
    if (typeof defaultChildren === "number") setChildren(defaultChildren);
  }, [defaultChildren]);

  useEffect(() => {
    if (typeof defaultRooms === "number") setRooms(defaultRooms);
  }, [defaultRooms]);

  // Mätning (som innan)
  const measure = () => {
    const el = contentRef.current;
    if (!el) return;
    setContentH(el.scrollHeight);
  };

  useIsoLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggle = () => {
    measure();
    requestAnimationFrame(() => setOpen((v) => !v));
  };

  const close = () => setOpen(false);

  const dropdownH = BAR_H + (open ? contentH : 0);

  const topStyle = "var(--public-nav-offset, 0px)";
  const overlayTop = `calc(${topStyle} + ${BAR_H}px)`;

  const isMulti = tab === "MULTI" || tab === "CRUISE";

  function doSearch() {
    const values: PublicSearchValues = {
      tab,
      pickupId,
      date: date || "",
      adults,
      children,
      rooms: isMulti ? rooms : undefined,
    };

    // ✅ Om parent skickar onSearch → använd den
    if (onSearch) {
      onSearch(values);
      close();
      return;
    }

    // ✅ Annars: exakt din gamla router.push (inte ändrat beteende)
    const q: Record<string, string> = {
      p: pickupId,
      d: date || "",
      a: String(adults),
      c: String(children),
      t: tab,
    };
    if (isMulti) q.r = String(rooms);

    router.push({ pathname: "/resor", query: q }, undefined, { shallow: true });
    close();
  }

  return (
    <div className="relative w-full">
      {/* Spacer så innehåll aldrig hamnar bakom menyn + ribban */}
      <div
        style={{
          height: `calc(var(--public-nav-offset, 0px) + ${BAR_H}px)`,
          transition: "height 220ms ease",
        }}
      />

      {/* Overlay */}
      <div
        onClick={close}
        className={[
          "fixed left-0 right-0 bottom-0 z-[80] bg-black/25 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        style={{ top: overlayTop }}
      />

      {/* Dropdown + ribba (FAST, kant till kant) */}
      <div
        className="fixed left-0 right-0 z-[90] overflow-hidden"
        style={{
          top: topStyle as any,
          height: dropdownH,
          transitionProperty: "height, top",
          transitionDuration: "220ms",
          transitionTimingFunction: "ease-out",
          willChange: "height, top",
          transform: "translateZ(0)",
        }}
      >
        {/* ✅ GRÅ bakgrund här igen */}
        <div className="relative h-full w-full" style={{ background: "var(--hb-search-bg)" }}>
          {/* Innehåll (rullgardin) */}
          <div
            className={[
              "transition-all duration-200",
              open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
            ].join(" ")}
            style={{
              pointerEvents: open ? "auto" : "none",
              backfaceVisibility: "hidden",
              transform: open ? "translateZ(0)" : "translate3d(0,-4px,0)",
            }}
            aria-hidden={!open}
          >
            <div ref={contentRef} className="mx-auto max-w-[1400px] px-4 py-5">
              <div className="mb-4 flex flex-wrap gap-2">
                <TabButton active={tab === "DAY"} onClick={() => setTab("DAY")}>
                  Dagsresor
                </TabButton>
                <TabButton active={tab === "MULTI"} onClick={() => setTab("MULTI")}>
                  Flerdagsresor
                </TabButton>
                <TabButton active={tab === "FUN"} onClick={() => setTab("FUN")}>
                  Nöjesresor
                </TabButton>

                <TabButton active={tab === "WINTER"} onClick={() => setTab("WINTER")}>
                  Vinter/jul
                </TabButton>
                <TabButton active={tab === "CRUISE"} onClick={() => setTab("CRUISE")}>
                  Kryssningar
                </TabButton>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="grid grid-cols-12 items-end gap-3">
                  <div className="col-span-12 md:col-span-4">
                    <Label>Upphämtning</Label>
                    <Select value={pickupId} onChange={(e) => setPickupId(e.target.value)}>
                      {pickupOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <Label>Avresedatum</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>

                  {isMulti ? (
                    <div className="col-span-6 md:col-span-2">
                      <Label>Antal rum</Label>
                      <Select value={rooms} onChange={(e) => setRooms(Number(e.target.value))}>
                        {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n} rum
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : null}

                  <div className="col-span-6 md:col-span-1">
                    <Label>Vuxna</Label>
                    <Select value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} vuxna
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="col-span-6 md:col-span-1">
                    <Label>Barn</Label>
                    <Select value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                      {Array.from({ length: 10 }, (_, i) => i).map((n) => (
                        <option key={n} value={n}>
                          {n} barn
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="col-span-12 md:col-span-1">
                    <button
                      type="button"
                      onClick={doSearch}
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold text-white hover:opacity-95"
                      style={{ background: "var(--hb-primary)" }}
                    >
                      Sök
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full px-6 py-2 text-sm font-semibold text-white hover:opacity-95"
                  style={{ background: "var(--hb-accent)" }}
                >
                  Stäng
                </button>
              </div>
            </div>
          </div>

          {/* ✅ RIBBAN GRÖN (som ni vill ha) */}
          <div
            className="absolute left-0 right-0 bottom-0 border-t shadow-sm"
            style={{ background: "var(--hb-accent)" }}
          >
            <div className="mx-auto max-w-[1400px] px-4">
              <button
                type="button"
                onClick={toggle}
                className="flex h-14 w-full items-center justify-center gap-2 text-sm font-semibold text-white"
                aria-expanded={open}
              >
                {title}
                <svg
                  viewBox="0 0 24 24"
                  className={`h-5 w-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
      style={{ background: active ? "var(--hb-primary)" : "var(--hb-tab)" }}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-xs font-semibold text-gray-700">{children}</div>;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-black/10"
    />
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-black/10"
    />
  );
}
