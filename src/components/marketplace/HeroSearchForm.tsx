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
      className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-8 max-w-4xl mx-auto text-left shadow-none"
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-5">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Quel stage ?
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Stage 48N, récup points…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm sm:text-base transition-all duration-200"
            />
          </div>
        </div>
        <div className="sm:col-span-5">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Où ? (ville ou code postal)
          </label>
          <div className="relative">
            <FontAwesomeIcon
              icon={faLocationDot}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Ville ou code postal"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm sm:text-base transition-all duration-200"
            />
          </div>
        </div>
        <div className="sm:col-span-2 flex items-end">
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-3.5 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 text-center"
          >
            Rechercher
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-gray-100">
        <span className="text-sm text-gray-600 mr-1">Populaires :</span>
        {popularTags.map((tag) => (
          <Link
            key={tag}
            href={`/recherche?q=${encodeURIComponent(tag)}`}
            className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-sm rounded-full transition-colors duration-200 border border-gray-200"
          >
            {tag}
          </Link>
        ))}
      </div>
    </form>
  );
}
