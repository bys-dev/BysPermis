import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import JsonLd from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendar,
  faUser,
  faTag,
} from "@fortawesome/free-solid-svg-icons";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchArticle(slug: string) {
  try {
    return await prisma.article.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
        titre: true,
        slug: true,
        extrait: true,
        contenu: true,
        image: true,
        categorie: true,
        tags: true,
        publishedAt: true,
        createdAt: true,
        author: { select: { prenom: true, nom: true } },
      },
    });
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      select: { slug: true },
      take: 100,
    });
    return articles.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    return { title: "Article introuvable" };
  }
  const description = article.extrait.slice(0, 155);
  return {
    title: `${article.titre} | BYS Formation`,
    description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.titre,
      description,
      url: `/blog/${article.slug}`,
      type: "article",
      locale: "fr_FR",
      siteName: "BYS Formation",
      images: article.image ? [{ url: article.image }] : undefined,
      publishedTime: (article.publishedAt ?? article.createdAt).toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: article.titre,
      description,
      images: article.image ? [article.image] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();

  const publishedAtISO = (article.publishedAt ?? article.createdAt).toISOString();
  const description = article.extrait.slice(0, 155);

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd
        id={`ld-article-${article.slug}`}
        data={[
          breadcrumbJsonLd([
            { name: "Accueil", url: "/" },
            { name: "Blog", url: "/blog" },
            { name: article.titre, url: `/blog/${article.slug}` },
          ]),
          articleJsonLd({
            title: article.titre,
            slug: article.slug,
            description,
            image: article.image,
            publishedAtISO,
          }),
        ]}
      />
      {article.image && (
        <div className="w-full h-64 sm:h-80 lg:h-96 bg-gray-200 relative">
          <Image
            src={article.image}
            alt={article.titre}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
          Retour au blog
        </Link>

        {article.categorie && (
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full capitalize mb-4">
            {article.categorie}
          </span>
        )}

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          {article.titre}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-200">
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5" />
            BYS Formation
          </span>
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5" />
            {new Date(article.publishedAt ?? article.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <div
          className="prose prose-lg prose-blue max-w-none"
          dangerouslySetInnerHTML={{ __html: article.contenu }}
        />

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
