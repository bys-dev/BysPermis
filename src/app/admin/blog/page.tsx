"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import {
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faEyeSlash,
  faSpinner,
  faNewspaper,
  faXmark,
  faSave,
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
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  author: { id: string; prenom: string; nom: string };
}

const EMPTY_FORM = {
  titre: "",
  slug: "",
  extrait: "",
  contenu: "",
  image: "",
  categorie: "",
  tags: "",
  isPublished: false,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function AdminBlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function fetchArticles() {
    setLoading(true);
    fetch("/api/articles?admin=1")
      .then((r) => r.json())
      .then((data) => setArticles(data.articles ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchArticles();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingSlug(null);
    setShowForm(true);
    setError("");
  }

  function openEdit(article: Article) {
    setForm({
      titre: article.titre,
      slug: article.slug,
      extrait: article.extrait,
      contenu: article.contenu,
      image: article.image ?? "",
      categorie: article.categorie ?? "",
      tags: article.tags.join(", "),
      isPublished: article.isPublished,
    });
    setEditingSlug(article.slug);
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      titre: form.titre,
      slug: form.slug || slugify(form.titre),
      extrait: form.extrait,
      contenu: form.contenu,
      image: form.image || null,
      categorie: form.categorie || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isPublished: form.isPublished,
    };

    try {
      const url = editingSlug
        ? `/api/articles/${editingSlug}`
        : "/api/articles";
      const method = editingSlug ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      setShowForm(false);
      fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(article: Article) {
    try {
      await fetch(`/api/articles/${article.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !article.isPublished }),
      });
      fetchArticles();
    } catch {
      // silent
    }
  }

  async function deleteArticle(slug: string) {
    if (!confirm("Supprimer cet article ?")) return;
    try {
      await fetch(`/api/articles/${slug}`, { method: "DELETE" });
      fetchArticles();
    } catch {
      // silent
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FontAwesomeIcon icon={faNewspaper} className="text-red-400" />
            Blog
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerez les articles du blog
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          Nouvel article
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-[#0D1D3A] rounded-xl border border-white/10 w-full max-w-3xl mx-4 mb-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">
                {editingSlug ? "Modifier l'article" : "Nouvel article"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={form.titre}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        titre: e.target.value,
                        slug: editingSlug ? form.slug : slugify(e.target.value),
                      });
                    }}
                    required
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    required
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Extrait
                </label>
                <textarea
                  value={form.extrait}
                  onChange={(e) => setForm({ ...form, extrait: e.target.value })}
                  required
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Contenu de l&apos;article
                </label>
                <RichTextEditor
                  value={form.contenu}
                  onChange={(html) => setForm({ ...form, contenu: html })}
                  placeholder="Rédigez votre article — utilisez la barre d'outils pour formater le texte…"
                  minHeight={320}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Categorie
                  </label>
                  <select
                    value={form.categorie}
                    onChange={(e) =>
                      setForm({ ...form, categorie: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
                  >
                    <option value="">-- Aucune --</option>
                    <option value="actualites">Actualites</option>
                    <option value="conseils">Conseils</option>
                    <option value="reglementation">Reglementation</option>
                    <option value="partenaires">Partenaires</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Tags (virgules)
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) =>
                      setForm({ ...form, tags: e.target.value })
                    }
                    placeholder="permis, points, ..."
                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm({ ...form, isPublished: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-gray-300">
                  Publier immediatement
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="w-3.5 h-3.5 animate-spin"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faSave} className="w-3.5 h-3.5" />
                  )}
                  {editingSlug ? "Mettre a jour" : "Creer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Articles table */}
      {loading ? (
        <div className="text-center py-20">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-red-400 text-xl animate-spin"
          />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-white/3 rounded-xl border border-white/8">
          <FontAwesomeIcon
            icon={faNewspaper}
            className="text-gray-600 text-3xl mb-4"
          />
          <p className="text-gray-500">Aucun article</p>
          <button
            onClick={openCreate}
            className="mt-4 text-red-400 hover:text-red-300 text-sm font-medium"
          >
            Creer le premier article
          </button>
        </div>
      ) : (
        <div className="bg-white/3 rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Article</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">
                  Categorie
                </th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">
                  Auteur
                </th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="hover:bg-white/3 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="text-white text-sm font-medium truncate max-w-xs">
                      {article.titre}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      /{article.slug}
                    </p>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    {article.categorie ? (
                      <span className="text-xs font-medium bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full capitalize">
                        {article.categorie}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">--</span>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-gray-400 text-sm">
                      {article.author.prenom} {article.author.nom}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => togglePublish(article)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        article.isPublished
                          ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={article.isPublished ? faEye : faEyeSlash}
                        className="w-3 h-3"
                      />
                      {article.isPublished ? "Publie" : "Brouillon"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(article)}
                        className="p-2 text-gray-500 hover:text-blue-400 transition-colors"
                        title="Modifier"
                      >
                        <FontAwesomeIcon icon={faEdit} className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteArticle(article.slug)}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="w-3.5 h-3.5"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
