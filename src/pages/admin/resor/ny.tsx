import { useEffect } from "react";
import { useRouter } from "next/router";
export default function RedirectNy() {
  const r = useRouter();
  useEffect(() => {
    r.replace("/admin/sundra/resor/ny");
  }, [r]);
  return null;
}
