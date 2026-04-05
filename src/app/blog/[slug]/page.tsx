"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendar,
  faUser,
  faTag,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

interface Article {
  id: string;
  titre: string;
  slug: string;
  extrait: string;
  contenu: string;
  image: string | null;
  categorie: string | null;
  tags: string[];
  publishedAt: string;
  createdAt: string;
  author: { prenom: string; nom: string };
}

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/articles/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setArticle(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="text-blue-600 text-2xl animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-lg">Article introuvable</p>
        <Link href="/blog" className="text-blue-600 hover:underline flex items-center gap-2">
          <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
          Retour au blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero image */}
      {article.image && (
        <div className="w-full h-64 sm:h-80 lg:h-96 bg-gray-200 relative">
          <img
            src={article.image}
            alt={article.titre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
          Retour au blog
        </Link>

        {/* Category */}
        {article.categorie && (
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full capitalize mb-4">
            {article.categorie}
          </span>
        )}

        {/* Title */}
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          {article.titre}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5" />
            {article.author.prenom} {article.author.nom}
          </span>
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5" />
            {new Date(article.publishedAt || article.createdAt).toLocaleDateString(
              "fr-FR",
              { day: "numeric", month: "long", year: "numeric" }
            )}
          </span>
        </div>

        {/* Content */}
        <div
          className="prose prose-lg prose-blue max-w-none"
          dangerouslySetInnerHTML={{ __html: article.contenu }}
        />

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="flex items-center gap-2 flex-wrap">
              <FontAwesomeIcon icon={faTag} className="w-4 h-4 text-gray-400" />
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-blue-50 border border-blue-100 rounded-xl p-6 sm:p-8 text-center">
          <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
            Besoin de recuperer des points ?
          </h3>
          <p className="text-gray-600 mb-4">
            Trouvez un stage de recuperation de points pres de chez vous.
          </p>
          <Link
            href="/recherche"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Trouver un stage
          </Link>
        </div>
      </div>
    </div>
  );
}
