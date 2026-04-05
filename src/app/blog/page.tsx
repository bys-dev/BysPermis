"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faNewspaper,
  faCalendar,
  faUser,
  faArrowRight,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

interface Article {
  id: string;
  titre: string;
  slug: string;
  extrait: string;
  image: string | null;
  categorie: string | null;
  tags: string[];
  publishedAt: string;
  author: { prenom: string; nom: string };
}

const CATEGORIES = [
  { value: "", label: "Tous les articles" },
  { value: "actualites", label: "Actualites" },
  { value: "conseils", label: "Conseils" },
  { value: "reglementation", label: "Reglementation" },
  { value: "partenaires", label: "Partenaires" },
];

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorie, setCategorie] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const url = categorie
      ? `/api/articles?categorie=${encodeURIComponent(categorie)}`
      : "/api/articles";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [categorie]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm mb-6">
            <FontAwesomeIcon icon={faNewspaper} className="w-4 h-4" />
            Blog BYS Formation
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Actualites & Conseils
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg">
            Retrouvez nos articles sur la securite routiere, la reglementation du permis de conduire
            et les actualites de la formation professionnelle.
          </p>
        </div>
      </section>

      {/* Category filter pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategorie(cat.value)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                categorie === cat.value
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        {loading ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="text-blue-600 text-2xl animate-spin" />
            <p className="text-gray-500 mt-4">Chargement des articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faNewspaper} className="text-gray-300 text-4xl mb-4" />
            <p className="text-gray-500 text-lg">Aucun article pour le moment</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-8">
              {total} article{total > 1 ? "s" : ""} trouve{total > 1 ? "s" : ""}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] bg-gradient-to-br from-blue-100 to-blue-50 relative overflow-hidden">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.titre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faNewspaper}
                          className="text-blue-300 text-3xl"
                        />
                      </div>
                    )}
                    {article.categorie && (
                      <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">
                        {article.categorie}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2 className="font-display text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                      {article.titre}
                    </h2>
                    <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                      {article.extrait}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
                          {article.author.prenom} {article.author.nom}
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendar} className="w-3 h-3" />
                          {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
