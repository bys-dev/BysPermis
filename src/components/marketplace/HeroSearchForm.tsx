"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faLocationDot } from "@fortawesome/free-solid-svg-icons";

const popularTags = [
  "Récupération de points",
  "Stage 48N",
  "Permis B accéléré",
  "FIMO",
  "Sécurité routière",
];

/**
 * Formulaire de recherche du hero (client only).
 * Le reste du hero (titre, fond, badge, etc.) est servi en SSR.
 */
export default function HeroSearchForm() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [ville, setVille] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search.trim()) params.set("q", search.trim());
        if (ville.trim()) params.set("ville", ville.trim());
        router.push(`/recherche?${params.toString()}`);
      }}
      className="bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/10 p-4 sm:p-6 md:p-8 max-w-4xl mx-auto"
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-5">
          <label className="block text-sm font-medium text-gray-300 mb-2 text-left">
            Quel stage ?
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Récupération de points, FIMO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
            />
          </div>
        </div>
        <div className="sm:col-span-5">
          <label className="block text-sm font-medium text-gray-300 mb-2 text-left">
            Où ? (ville ou code postal)
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={faLocationDot}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Paris, 95000, Lyon..."
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
            />
          </div>
        </div>
        <div className="sm:col-span-2 flex items-end">
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-3.5 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 text-center shadow-lg shadow-red-600/25"
          >
            Rechercher
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-white/10">
        <span className="text-sm text-gray-500 mr-1">Populaires :</span>
        {popularTags.map((tag) => (
          <Link
            key={tag}
            href={`/recherche?q=${encodeURIComponent(tag)}`}
            className="px-3 py-1.5 bg-white/5 hover:bg-blue-600/20 hover:text-blue-300 text-gray-400 text-sm rounded-full transition-all duration-200 border border-white/10"
          >
            {tag}
          </Link>
        ))}
      </div>
    </form>
  );
}
