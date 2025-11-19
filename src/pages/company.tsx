// src/pages/company.tsx
import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import Layout from "../components/Layout";
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

// Här styr du vilka e-postadresser som alltid ska räknas som superadmin
const SUPER_ADMIN_EMAILS = ["info@helsingbuss.se"];

export default function Company() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Kolla om inloggad användare är superadmin
  useEffect(() => {
    const checkAdmin = async () => {
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
      setAuthLoading(false);
    };

    checkAdmin();
  }, []);

  // Hämta företagsinfo om användaren är superadmin
  useEffect(() => {
    const fetchCompany = async () => {
      const { data, error } = await supabase
        .from("company")
        .select("*")
        .limit(1)
        .single();

      if (!error) {
        setCompany(data);
      }
      setLoading(false);
    };

    if (isSuperAdmin) {
      fetchCompany();
    }
  }, [isSuperAdmin]);

  if (authLoading) {
    return (
      <Layout active="company">
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
      <Layout active="company">
        <div className="max-w-xl mx-auto py-24">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
            <h1 className="text-lg font-semibold text-slate-900 mb-2">
              Åtkomst nekad
            </h1>
            <p className="text-sm text-slate-600">
              Den här sidan är endast tillgänglig för superadministratörer.
              Kontakta din systemadministratör om du behöver ändra
              företagsinställningar.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout active="company">
        <div className="flex items-center justify-center py-24">
          <div className="rounded-xl bg-white shadow px-6 py-4 text-sm text-slate-600">
            Laddar företagsinställningar...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout active="company">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Sidtitel */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Företagsinställningar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Hantera företagsuppgifter, logotyp och administratörer för
            Helsingbuss-portalen.
          </p>
        </div>

        {/* Företagsinfo */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-slate-100 p-2">
                <BuildingOffice2Icon className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-slate-900">
                  Företag
                </h2>
                <p className="text-xs text-slate-500">
                  Din företags- och faktureringsinformation.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 text-sm">
            <div className="space-y-2">
              <CompanyField
                label="Organisationsnummer"
                value={company?.orgnr || "XXXXXX-XXXX"}
              />
              <CompanyField
                label="Företagsnamn"
                value={company?.name || "Helsingbuss"}
              />
              <CompanyField
                label="Obligatorisk tvåstegsverifiering"
                value="Inaktiverad"
              />
            </div>
            <div className="space-y-2">
              <CompanyField
                label="Adress"
                value={company?.address || "Hofverbergsgatan 2B"}
                icon={<MapPinIcon className="h-4 w-4" />}
              />
              <CompanyField
                label="E-postadress för fakturor"
                value={company?.billing_email || "ekonomi@helsingbuss.se"}
                icon={<EnvelopeIcon className="h-4 w-4" />}
              />
              <CompanyField
                label="Er referens"
                value={company?.reference || "Andreas Ekelöf"}
              />
            </div>
          </div>
        </section>

        {/* Logotyp */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-slate-100 p-2">
              <PhotoIcon className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-slate-900">Logotyp</h2>
              <p className="text-xs text-slate-500">
                Logotypen används på offerter, fakturor och i portalen.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-col items-center justify-center gap-3">
            <p className="text-xs text-slate-600 text-center max-w-md">
              Här kan du ladda upp företagets logotyp. Använd helst en fil med
              transparent bakgrund (PNG eller SVG) för bästa resultat.
            </p>
            <label className="mt-1 inline-flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-xs text-slate-500 cursor-pointer hover:border-slate-300 hover:bg-slate-100 transition">
              <span className="font-medium">Välj fil</span>
              <span className="text-[11px] text-slate-400">
                PNG, JPG eller SVG · max 5 MB
              </span>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </div>
        </section>

        {/* Medgivanden */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-slate-100 p-2">
              <ShieldCheckIcon className="h-5 w-5 text-slate-700" />
            </div>
            <h2 className="font-semibold text-lg text-slate-900">
              Medgivanden
            </h2>
          </div>
          <p className="text-sm text-slate-600 mb-2">
            Ett medgivande innebär att du har gett tillåtelse till ett annat
            företag att hämta och använda data från ditt företag för att
            bearbeta det i ett specifikt program.
          </p>
          <p className="text-xs text-slate-500">
            Här kommer du senare kunna se och hantera alla aktiva medgivanden.
          </p>
        </section>

        {/* Administratörer */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-slate-100 p-2">
              <UserGroupIcon className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-slate-900">
                Administratörer
              </h2>
              <p className="text-xs text-slate-500">
                Administratörer kan hantera användare, fakturor och samarbeten.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-sm">
            <table className="w-full">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="p-2 text-left font-semibold">Namn</th>
                  <th className="p-2 text-left font-semibold">
                    E-postadress för fakturor
                  </th>
                  <th className="p-2 text-left font-semibold">
                    Telefonnummer
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr>
                  <td className="p-2 border-t border-slate-200">
                    Andreas Ekelöf
                  </td>
                  <td className="p-2 border-t border-slate-200">
                    ekonomi@helsingbuss.se
                  </td>
                  <td className="p-2 border-t border-slate-200">
                    +46 (0)729 42 35 37
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
}

/* Field-komponent för företagssidan */
function CompanyField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <p className="flex items-center gap-2 text-xs text-slate-700">
      {icon && (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </span>
      )}
      <span className="font-semibold">{label}:</span>
      <span className="text-slate-800">{value}</span>
    </p>
  );
}
