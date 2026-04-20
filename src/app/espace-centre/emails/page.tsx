"use client";

import { useState, useEffect, useCallback } from "react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

// ─── Types ───────────────────────────────────────────────

interface EmailTemplate {
  id: string;
  slug: string;
  nom: string;
  sujet: string;
  contenu: string;
  variables: string[];
  isActive: boolean;
  isOverride: boolean;
  centreId: string | null;
}

const TEMPLATE_META: Record<string, { label: string; description: string }> = {
  convocation: {
    label: "Convocation",
    description: "Envoyée automatiquement lors de la confirmation d'une réservation",
  },
  confirmation_reservation: {
    label: "Confirmation de réservation",
    description: "Email de confirmation après paiement",
  },
  rappel_session: {
    label: "Rappel de session",
    description: "Envoyé 48h avant le début de la session",
  },
  bienvenue: {
    label: "Bienvenue",
    description: "Email de bienvenue pour les nouveaux inscrits",
  },
  centre_notification: {
    label: "Notification centre",
    description: "Notification envoyée au centre lors d'une nouvelle réservation",
  },
};

const SAMPLE_DATA: Record<string, string> = {
  prenom: "Marie",
  nom: "Dupont",
  email: "marie.dupont@example.com",
  formation: "Stage de récupération de points",
  centre: "BYS Formation Osny",
  dateDebut: "15 avril 2026",
  dateFin: "16 avril 2026",
  lieu: "Bât. 7, 9 Chaussée Jules César, 95520 Osny",
  prix: "250 €",
  numero: "BYS-2026-00042",
  lienConvocation: "https://byspermis.fr/api/convocation/example",
};

// ─── Component ───────────────────────────────────────────

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/centre/email-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch {
      console.error("Erreur chargement templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const selectedTemplate = templates.find((t) => t.slug === selectedSlug);

  function selectTemplate(slug: string) {
    const tpl = templates.find((t) => t.slug === slug);
    if (tpl) {
      setSelectedSlug(slug);
      setEditSubject(tpl.sujet);
      setEditBody(tpl.contenu);
      setMessage(null);
    }
  }

  function insertVariable(variable: string) {
    setEditBody((prev) => prev + `{{${variable}}}`);
  }

  function renderPreview(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      return SAMPLE_DATA[key] ?? `{{${key}}}`;
    });
  }

  async function handleSave() {
    if (!selectedSlug) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/centre/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          sujet: editSubject,
          contenu: editBody,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Template sauvegardé avec succès" });
        await fetchTemplates();
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error ?? "Erreur lors de la sauvegarde" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!selectedSlug) return;
    if (!confirm("Réinitialiser ce template ? Votre personnalisation sera supprimée.")) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/centre/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selectedSlug, reset: true }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Template réinitialisé" });
        await fetchTemplates();
        // Re-select to load default values
        const updated = templates.find((t) => t.slug === selectedSlug);
        if (updated) {
          setEditSubject(updated.sujet);
          setEditBody(updated.contenu);
        }
      } else {
        setMessage({ type: "error", text: "Erreur lors de la réinitialisation" });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Chargement des templates...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Templates d&apos;emails</h1>
        <p className="text-gray-400 mt-1">
          Personnalisez les emails envoyés automatiquement par la plateforme
        </p>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar: template list */}
        <div className="w-full lg:w-72 shrink-0 space-y-2">
          {Object.entries(TEMPLATE_META).map(([slug, meta]) => {
            const tpl = templates.find((t) => t.slug === slug);
            const isSelected = selectedSlug === slug;

            return (
              <button
                key={slug}
                onClick={() => selectTemplate(slug)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isSelected ? "text-blue-400" : "text-white"}`}>
                    {meta.label}
                  </span>
                  {tpl?.isOverride && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                      Personnalisé
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{meta.description}</p>
              </button>
            );
          })}
        </div>

        {/* Editor */}
        <div className="flex-1 min-w-0">
          {!selectedSlug ? (
            <div
              className="flex items-center justify-center rounded-lg border border-white/10 min-h-[400px]"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <p className="text-gray-500">Sélectionnez un template pour le modifier</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Message */}
              {message && (
                <div
                  className={`px-4 py-3 rounded-lg text-sm font-medium ${
                    message.type === "success"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Sujet de l&apos;email
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="Sujet de l'email..."
                />
              </div>

              {/* Variables */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Variables disponibles
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedTemplate?.variables ?? Object.keys(SAMPLE_DATA)).map((v) => (
                    <button
                      key={v}
                      onClick={() => insertVariable(v)}
                      className="px-2.5 py-1 rounded-md text-xs font-mono bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
                      title={`Insérer {{${v}}}`}
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body editor */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Contenu de l&apos;email
                </label>
                <RichTextEditor
                  value={editBody}
                  onChange={(html) => setEditBody(html)}
                  placeholder="Tapez le contenu de l'email — utilisez les boutons { variables } ci-dessus pour insérer des champs dynamiques…"
                  minHeight={340}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                {selectedTemplate?.isOverride && (
                  <button
                    onClick={handleReset}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Réinitialiser par défaut
                  </button>
                )}
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Aperçu
                </label>
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <div className="px-4 py-2 border-b border-white/10 bg-white/5">
                    <p className="text-xs text-gray-400">
                      <span className="font-medium">Sujet :</span>{" "}
                      <span className="text-white">{renderPreview(editSubject)}</span>
                    </p>
                  </div>
                  <div
                    className="p-4 bg-white text-black text-sm"
                    dangerouslySetInnerHTML={{ __html: renderPreview(editBody) }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
