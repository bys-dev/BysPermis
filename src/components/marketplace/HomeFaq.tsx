"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Accordéon FAQ home page (client-only pour le toggle).
 * Les items sont passés en props depuis le composant serveur.
 */
export default function HomeFaq({ items }: { items: FaqEntry[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {items.map((item, index) => (
        <div
          key={item.question}
          className="bg-gray-50 rounded-2xl border border-brand-border overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between text-left hover:bg-gray-100 transition-colors duration-200"
            aria-expanded={openIndex === index}
          >
            <span className="font-semibold text-base sm:text-lg text-brand-text pr-4">
              {item.question}
            </span>
            <FontAwesomeIcon
              icon={openIndex === index ? faChevronUp : faChevronDown}
              className="text-gray-400 flex-shrink-0"
            />
          </button>
          {openIndex === index && (
            <div className="px-4 sm:px-8 pb-4 sm:pb-6">
              <p className="text-gray-500 leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
