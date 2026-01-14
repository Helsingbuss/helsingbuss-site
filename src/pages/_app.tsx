// src/pages/_app.tsx
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const path = router.asPath || "";

  const isSundra =
    path.startsWith("/admin/sundra") ||
    path.startsWith("/agent/sundra") ||
    path.startsWith("/sundra");

  const faviconHref = isSundra
    ? "/sundra_logo_icon_farg.svg"
    : "/favicon.ico"; // Helsingbuss (behåll som du har)

  return (
    <>
      <Head>
        {/* Sundra kan ha eget namn – det är href som styr */}
        <link rel="icon" href={faviconHref} type="image/svg+xml" />
        <link rel="icon" href={faviconHref} sizes="any" />
      </Head>

      <Component {...pageProps} />
    </>
  );
}
