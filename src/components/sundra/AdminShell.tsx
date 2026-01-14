import { Topbar } from "@/components/sundra/Topbar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        title="Sundra – Admin"
        subtitle="Backoffice"
        homeHref="/admin/sundra"
        notificationsCount={1}
        showSearch
        rightSlot={
          <button className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-[#0B2A5B] hover:bg-white/90">
            Ny avgång
          </button>
        }
      />
      <div className="p-6">{children}</div>
    </div>
  );
}
