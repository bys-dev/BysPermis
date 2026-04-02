"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmargementRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/espace-centre/mes-sessions");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
      Redirection vers Mes sessions…
    </div>
  );
}
