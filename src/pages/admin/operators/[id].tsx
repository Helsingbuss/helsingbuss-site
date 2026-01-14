import { useRouter } from "next/router";
import { useEffect } from "react";

export default function AdminOperatorsIdRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace("/admin/sundra/operatorer/register");
  }, [router.isReady]);

  return null;
}
