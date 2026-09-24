"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  icon: IconDefinition;
  items: FaqItem[];
}

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border rounded-xl overflow-hidden bg-white transition-all duration-200 ${
        open
          ? "border-blue-200 shadow-md shadow-blue-900/5 border-l-4 border-l-blue-600"
          : "border-brand-border hover:border-blue-200"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-blue-50/40 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-brand-text pr-4">{item.question}</span>
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
            open ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
          }`}
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-xs transition-transform duration-200 motion-reduce:transition-none ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-blue-100 pt-4">
          {item.answer}
        </div>
      )}
    </div>
  );
}

/**
 * Bloc interactif de la FAQ : recherche + accordéon par catégorie.
 * Le hero, le JSON-LD et la sidebar contact sont rendus en SSR par la page.
 */
export default function FaqContent({ categories }: { categories: FaqCategory[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
        );
      }),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <>
      {/* Search bar */}
      <div className="max-w-xl mx-auto relative z-10 -mt-7 px-4 sm:px-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher une question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3.5 pl-12 rounded-xl bg-white text-brand-text border border-blue-100 shadow-xl shadow-blue-900/10 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"
          />
        </div>
      </div>

      {/* Category nav */}
      <section className="border-b border-blue-100 bg-white/95 backdrop-blur sticky top-0 z-30 mt-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-3 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.title}
                onClick={() => {
                  setActiveCategory(activeCategory === cat.title ? null : cat.title);
                  setSearchQuery("");
                  const el = document.getElementById(cat.title);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat.title
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <FontAwesomeIcon icon={cat.icon} className="mr-1.5" />
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        {filteredCategories.length > 0 ? (
          <div className="space-y-12">
            {filteredCategories.map((cat) => (
              <div key={cat.title} id={cat.title}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="icon-tile w-11 h-11 rounded-xl">
                    <FontAwesomeIcon icon={cat.icon} />
                  </div>
                  <h2 className="font-display font-bold text-xl text-brand-text">{cat.title}</h2>
                </div>
                <div className="space-y-3">
                  {cat.items.map((item) => (
                    <AccordionItem key={item.question} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="text-4xl text-gray-300 mb-4"
            />
            <h3 className="font-display font-semibold text-xl text-brand-text mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-gray-500 mb-6">
              Essayez avec d&apos;autres mots-clés ou consultez toutes les catégories.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="btn-secondary text-sm px-6 py-2.5 rounded-lg"
            >
              Voir toutes les questions
            </button>
          </div>
        )}
      </section>
    </>
  );
}
