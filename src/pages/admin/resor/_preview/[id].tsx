import React, { useEffect } from "react";
import { useRouter } from "next/router";

export default function AdminPreviewRedirectPage() {
  const router = useRouter();
  const idRaw = router.query.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;

  useEffect(() => {
    if (!router.isReady || !id) return;

    // Om du vill peka om till din "riktiga" preview-route:
    router.replace(`/admin/sundra/resor/_preview/${id}`);
  }, [router.isReady, id]);

  return null;
}
