"use client";

/**
 * Suit les changements de route App Router pour déclencher un page_view
 * sur chaque navigation (Next.js ne le fait pas automatiquement).
 *
 * À placer une fois dans le layout racine, après <Analytics />.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView, hasAnyTracking } from "@/lib/analytics";

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!hasAnyTracking()) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    trackPageView(url, document.title);
  }, [pathname, searchParams]);

  return null;
}
