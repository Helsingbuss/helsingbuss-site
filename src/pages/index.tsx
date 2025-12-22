// File: src/pages/index.tsx
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Logo from "../components/Logo";
import { supabase } from "../lib/supabaseClient";

function mapSupabaseError(message: string): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid email") || m.includes("email not confirmed"))
    return "Fel e-post eller lösenord.";
  if (m.includes("too many requests")) return "För många försök. Vänta en stund och försök igen.";
  if (m.includes("network")) return "Nätverksfel. Kontrollera din anslutning.";
  return "Något gick fel. Försök igen.";
}
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hb_email");
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (rememberMe && isValidEmail(email)) {
        localStorage.setItem("hb_email", email.trim().toLowerCase());
      } else {
        localStorage.removeItem("hb_email");
      }
    } catch {}
  }, [rememberMe, email]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError("Ange en giltig e-postadress.");
      emailRef.current?.focus();
      return;
    }
    if (!password) {
      setError("Lösenord krävs.");
      passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (authError || !data?.user) {
        setError(mapSupabaseError(authError?.message ?? ""));
        passwordRef.current?.focus();
        return;
      }
      await router.push("/dashboard");
    } catch (err: any) {
      setError(mapSupabaseError(err?.message ?? ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Helsingbuss – Logga in</title>
        <meta name="description" content="Logga in på Helsingbuss portal." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="relative flex min-h-[100dvh] flex-col justify-between bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:py-8">
          <section
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:max-w-md sm:rounded-2xl sm:p-8"
            role="dialog"
            aria-labelledby="login-title"
          >
            {/* Logo – större, bibehållen proportion */}
            <div className="mb-5 flex items-center justify-center sm:mb-6">
              <Logo className="h-12 sm:h-14 md:h-16 w-auto max-w-[320px] shrink-0" />
            </div>

            <h1 id="login-title" className="mb-1 text-center text-lg font-bold sm:text-xl">Logga in</h1>
            <p className="mb-5 text-center text-sm text-slate-600 dark:text-slate-300 sm:mb-6">Välkommen tillbaka.</p>

            {error && (
              <div role="alert" aria-live="assertive" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/40 dark:bg-red-900/40 dark:text-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">E-postadress</label>
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error && !isValidEmail(email) ? "true" : "false"}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none ring-offset-2 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-blue-500 dark:focus:ring-blue-900"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium">Lösenord</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-pressed={showPassword}
                    className="-mr-1 rounded px-3 py-1 text-sm font-medium text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-blue-400"
                    title="Visa/dölj lösenord"
                  >
                    {showPassword ? "Dölj" : "Visa"}
                  </button>
                </div>
                <input
                  id="password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error && !password ? "true" : "false"}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none ring-offset-2 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-blue-500 dark:focus:ring-blue-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="group relative w-full rounded-lg bg-blue-900 py-3 text-base font-semibold text-white shadow transition hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-75 sm:text-lg"
              >
                {loading ? "Loggar in…" : "Logga in"}
              </button>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                  />
                  <span>Spara min e-postadress</span>
                </label>

                <Link href="/inloggning/glomt-losenord" className="text-blue-700 hover:underline dark:text-blue-400">
                  Glömt ditt lösenord?
                </Link>
              </div>
            </form>
          </section>
        </div>

        <footer className="relative z-10 bg-transparent pb-[env(safe-area-inset-bottom)] py-4 text-center text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
          © Helsingbuss • <Link href="/cookies" className="underline hover:no-underline">Om cookies</Link> • <span aria-label="Svenska">🇸🇪 Svenska</span>
        </footer>
      </div>
    </>
  );
}
