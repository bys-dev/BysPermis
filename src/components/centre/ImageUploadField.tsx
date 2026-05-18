"use client";

import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faUpload,
  faImage,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

export type ImageUploadKind = "logo" | "signature" | "bannerImage";

interface ImageUploadFieldProps {
  kind: ImageUploadKind;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  label: string;
  hint?: string;
  accept?: string;
  previewClassName?: string;
}

interface UploadResponse {
  url?: string;
  error?: string;
}

export function ImageUploadField({
  kind,
  currentUrl,
  onUploaded,
  label,
  hint,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  previewClassName = "h-32",
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);

      const res = await fetch("/api/centre/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await res.json().catch(() => ({}));

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Echec de l'upload");
      }

      onUploaded(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-500">{label}</label>

      <div
        className={`rounded-lg overflow-hidden border ${previewClassName} bg-white/5 flex items-center justify-center`}
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt={label}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <FontAwesomeIcon icon={faImage} className="text-2xl" />
            <span className="text-xs">Aucune image</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
        >
          {uploading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />
              Envoi...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faUpload} className="w-3 h-3" />
              Choisir un fichier
            </>
          )}
        </button>
        {hint && <span className="text-[11px] text-gray-600">{hint}</span>}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <FontAwesomeIcon icon={faTriangleExclamation} className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
}
