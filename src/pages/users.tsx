// src/pages/users.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";
import {
  UserPlusIcon,
  UsersIcon,
  ShieldCheckIcon,
  AtSymbolIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

// Här styr du vilka e-postadresser som alltid ska räknas som superadmin
const SUPER_ADMIN_EMAILS = ["info@helsingbuss.se"];

type NewUserState = {
  email: string;
  full_name: string;
  phone: string;
  booking: boolean;
  visualplan: boolean;
  priceboard: boolean;
  crewcenter: boolean;
  reports: boolean;
  schedule: boolean;
};

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState<NewUserState>({
    email: "",
    full_name: "",
    phone: "",
    booking: false,
    visualplan: false,
    priceboard: false,
    crewcenter: false,
    reports: false,
    schedule: false,
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthLoading(false);
        return;
      }

      let isAdmin = SUPER_ADMIN_EMAILS.includes(user.email ?? "");

      // Kolla även mot profiles.is_super_admin
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

      if (!error && profile?.is_super_admin) {
        isAdmin = true;
      }

      setIsSuperAdmin(isAdmin);
      if (isAdmin) {
        fetchUsers();
      }
      setAuthLoading(false);
    };

    checkAdminAndLoad();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (!error && data) setUsers(data);
  };

  const handleCheckboxChange = (field: keyof NewUserState) => {
    setNewUser((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").insert([newUser]);
    setSaving(false);

    if (!error) {
      setNewUser({
        email: "",
        full_name: "",
        phone: "",
        booking: false,
        visualplan: false,
        priceboard: false,
        crewcenter: false,
        reports: false,
        schedule: false,
      });
      fetchUsers();
    } else {
      console.error("Fel vid tillägg av användare:", error.message);
    }
  };

  if (authLoading) {
    return (
      <Layout active="users">
        <div className="flex items-center justify-center py-24">
          <div className="rounded-xl bg-white shadow px-6 py-4 text-sm text-slate-600">
            Kontrollerar behörighet...
          </div>
        </div>
      </Layout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Layout active="users">
        <div className="max-w-xl mx-auto py-24">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
            <h1 className="text-lg font-semibold text-slate-900 mb-2">
              Åtkomst nekad
            </h1>
            <p className="text-sm text-slate-600">
              Den här sidan är endast tillgänglig för superadministratörer.
              Kontakta din systemadministratör om du behöver hantera användare
              och behörigheter.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout active="users">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Sidtitel */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Hantera användare
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lägg till nya användare och administrera behörigheter för
            Helsingbuss-portalen.
          </p>
        </div>

        {/* Lägg till användare */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-full bg-slate-100 p-2">
              <UserPlusIcon className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-900">
                Lägg till användare
              </h2>
              <p className="text-xs text-slate-500">
                Ange grunduppgifter och välj vilka moduler användaren ska ha
                tillgång till.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleAddUser}
            className="mt-2 space-y-4 rounded-xl bg-slate-50 border border-slate-200 p-4"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                  <ShieldCheckIcon className="h-4 w-4 text-slate-600" />
                </span>
                <input
                  type="text"
                  placeholder="Fullständigt namn"
                  value={newUser.full_name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, full_name: e.target.value })
                  }
                  className="flex-1 text-sm outline-none border-none bg-transparent"
                  required
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                  <AtSymbolIcon className="h-4 w-4 text-slate-600" />
                </span>
                <input
                  type="email"
                  placeholder="E-postadress"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="flex-1 text-sm outline-none border-none bg-transparent"
                  required
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                  <PhoneIcon className="h-4 w-4 text-slate-600" />
                </span>
                <input
                  type="text"
                  placeholder="Telefonnummer"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                  className="flex-1 text-sm outline-none border-none bg-transparent"
                />
              </div>
            </div>

            {/* Behörigheter */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <ShieldCheckIcon className="h-4 w-4" />
                Behörigheter
              </p>
              <div className="grid gap-2 md:grid-cols-3 text-sm">
                <PermissionToggle
                  label="Booking"
                  checked={newUser.booking}
                  onChange={() => handleCheckboxChange("booking")}
                />
                <PermissionToggle
                  label="VisualPlan"
                  checked={newUser.visualplan}
                  onChange={() => handleCheckboxChange("visualplan")}
                />
                <PermissionToggle
                  label="PriceBoard"
                  checked={newUser.priceboard}
                  onChange={() => handleCheckboxChange("priceboard")}
                />
                <PermissionToggle
                  label="CrewCenter"
                  checked={newUser.crewcenter}
                  onChange={() => handleCheckboxChange("crewcenter")}
                />
                <PermissionToggle
                  label="Reports"
                  checked={newUser.reports}
                  onChange={() => handleCheckboxChange("reports")}
                />
                <PermissionToggle
                  label="Schedule"
                  checked={newUser.schedule}
                  onChange={() => handleCheckboxChange("schedule")}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#1D2937] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving && (
                  <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                Lägg till användare
              </button>
            </div>
          </form>
        </section>

        {/* Lista användare */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-slate-100 p-2">
              <UsersIcon className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-900">
                Befintliga användare
              </h2>
              <p className="text-xs text-slate-500">
                Översikt över användare och deras behörigheter.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-sm">
            <table className="w-full">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="p-2 text-left font-semibold">Namn</th>
                  <th className="p-2 text-left font-semibold">E-post</th>
                  <th className="p-2 text-left font-semibold">Telefon</th>
                  <th className="p-2 text-left font-semibold">Behörigheter</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="p-2 border-t border-slate-200">
                      {u.full_name || "-"}
                    </td>
                    <td className="p-2 border-t border-slate-200">
                      {u.email || "-"}
                    </td>
                    <td className="p-2 border-t border-slate-200">
                      {u.phone || "-"}
                    </td>
                    <td className="p-2 border-t border-slate-200">
                      {[
                        u.booking && "Booking",
                        u.visualplan && "VisualPlan",
                        u.priceboard && "PriceBoard",
                        u.crewcenter && "CrewCenter",
                        u.reports && "Reports",
                        u.schedule && "Schedule",
                      ]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 border-t border-slate-200 text-xs text-slate-500 text-center"
                    >
                      Inga användare hittades.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
}

/* Snygg switch för behörigheter */
function PermissionToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50">
      <span className="font-medium text-slate-700">{label}</span>
      <span
        className={`inline-flex h-5 w-9 items-center rounded-full p-[2px] transition ${
          checked ? "bg-emerald-500" : "bg-slate-200"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow transform transition ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
    </label>
  );
}
