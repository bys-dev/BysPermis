"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { value: "", label: "Tous les articles" },
  { value: "actualites", label: "Actualites" },
  { value: "conseils", label: "Conseils" },
  { value: "reglementation", label: "Reglementation" },
  { value: "partenaires", label: "Partenaires" },
];

/**
 * Pills de filtre par catégorie blog. Met à jour l'URL (?categorie=...)
 * pour que le RSC parent puisse re-fetch via les searchParams.
 */
export default function BlogCategoryFilter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("categorie") ?? "";

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {CATEGORIES.map((cat) => {
        const params = new URLSearchParams();
        if (cat.value) params.set("categorie", cat.value);
        const href = params.toString() ? `${pathname}?${params}` : pathname;
        const active = current === cat.value;
        return (
          <Link
            key={cat.value}
            href={href}
            scroll={false}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
              active
                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {cat.label}
          </Link>
        );
      })}
    </div>
  );
}
