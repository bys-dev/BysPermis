import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import BlogCategoryFilter from "@/components/blog/BlogCategoryFilter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faNewspaper,
  faCalendar,
  faUser,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — Actualités sécurité routière & permis de conduire",
  description:
    "Retrouvez nos articles sur la sécurité routière, la réglementation du permis de conduire et les actualités de la formation professionnelle.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog BYS Formation",
    description:
      "Actualités, conseils et réglementation pour les conducteurs et les centres de formation.",
    url: "/blog",
    type: "website",
    locale: "fr_FR",
    siteName: "BYS Formation",
  },
};

interface ArticleSummary {
  id: string;
  titre: string;
  slug: string;
  extrait: string;
  image: string | null;
  categorie: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  author: { prenom: string | null; nom: string | null };
}

async function fetchArticles(categorie?: string): Promise<ArticleSummary[]> {
  try {
    const where: {
      isPublished: boolean;
      categorie?: string;
    } = { isPublished: true };
    if (categorie) where.categorie = categorie;

    const articles = await prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: {
        id: true,
        titre: true,
        slug: true,
        extrait: true,
        image: true,
        categorie: true,
        publishedAt: true,
        createdAt: true,
        author: { select: { prenom: true, nom: true } },
      },
    });
    return articles as ArticleSummary[];
  } catch {
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ categorie?: string }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const categorie = sp.categorie?.trim() || undefined;
  const articles = await fetchArticles(categorie);
  const total = articles.length;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm mb-6">
            <FontAwesomeIcon icon={faNewspaper} className="w-4 h-4" />
            Blog BYS Formation
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Actualites &amp; Conseils
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg">
            Retrouvez nos articles sur la securite routiere, la reglementation du permis de conduire
            et l&apos;actualite des stages de recuperation de points.
          </p>
        </div>
      </section>

      {/* Category filter pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-6">
        <Suspense fallback={<div className="h-12" />}>
          <BlogCategoryFilter />
        </Suspense>
      </div>

      {/* Articles grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        {articles.length === 0 ? (
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
                      <Image
                        src={article.image}
                        alt={article.titre}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faNewspaper} className="text-blue-300 text-3xl" />
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
                    <p className="text-gray-500 text-sm line-clamp-3 mb-4">{article.extrait}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
                          {article.author?.prenom ?? ""} {article.author?.nom ?? ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendar} className="w-3 h-3" />
                          {new Date(article.publishedAt ?? article.createdAt).toLocaleDateString(
                            "fr-FR",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
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
      <Footer />
    </>
  );
}
