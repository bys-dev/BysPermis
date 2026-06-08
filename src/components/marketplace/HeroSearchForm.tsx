"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faLocationDot } from "@fortawesome/free-solid-svg-icons";

const popularTags = [
  "Récupération de points",
  "Stage volontaire",
  "Stage 48N",
  "Stage 48SI",
  "Permis probatoire",
];

/**
 * Formulaire de recherche du hero (client only).
 * Fond blanc opaque pour une lisibilité maximale sur la photo de fond.
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
      className="bg-white/95 backdrop-blur-md rounded-2xl ring-1 ring-black/5 shadow-2xl p-5 sm:p-7 md:p-8 max-w-4xl mx-auto text-left"
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-5">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Quel stage ?
          </label>
          <div className="relative group">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              type="text"
              placeholder="Stage 48N, récup points…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 placeholder-gray-400 text-sm sm:text-base transition-all duration-200 hover:border-gray-300"
            />
          </div>
        </div>
        <div className="sm:col-span-5">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Où ? (ville ou code postal)
          </label>
          <div className="relative group">
            <FontAwesomeIcon
              icon={faLocationDot}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors"
            />
            <input
              type="text"
              placeholder="Ville ou code postal"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 placeholder-gray-400 text-sm sm:text-base transition-all duration-200 hover:border-gray-300"
            />
          </div>
        </div>
        <div className="sm:col-span-2 flex items-end">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-red-600 text-white py-3.5 rounded-xl font-semibold hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 transition-all duration-200 active:scale-[0.98]"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
            <span>Rechercher</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-gray-100">
        <span className="text-sm text-gray-500 mr-1 font-medium">Populaires :</span>
        {popularTags.map((tag) => (
          <Link
            key={tag}
            href={`/recherche?q=${encodeURIComponent(tag)}`}
            className="px-3.5 py-1.5 bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-700 text-xs sm:text-sm rounded-full transition-all duration-200 border border-gray-200 hover:border-blue-600 hover:shadow-md hover:shadow-blue-600/20 font-medium"
          >
            {tag}
          </Link>
        ))}
      </div>
    </form>
  );
}
