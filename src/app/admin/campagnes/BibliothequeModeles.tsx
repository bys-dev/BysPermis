"use client";

/**
 * Sélecteur de modèle affiché en tête de l'éditeur de campagne.
 *
 * Charger un modèle remplit l'objet, le corps et le ciblage conseillé, puis
 * s'efface : la campagne devient un texte indépendant. C'est ce qui permet de
 * retoucher un modèle sans jamais toucher aux campagnes déjà rédigées.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faLayerGroup,
  faChevronDown,
  faChevronUp,
  faSliders,
} from "@fortawesome/free-solid-svg-icons";
import type { Modele } from "./types";

export default function BibliothequeModeles({
  onChoisir,
  ouvertParDefaut = false,
}: {
  onChoisir: (modele: Modele) => void;
  ouvertParDefaut?: boolean;
}) {
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [chargement, setChargement] = useState(true);
  const [ouvert, setOuvert] = useState(ouvertParDefaut);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/prospects/modeles")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setModeles(d.modeles ?? []))
      .catch(() => setErreur("Bibliothèque de modèles indisponible."))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02]">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          className="flex items-center gap-2 text-white text-sm font-semibold hover:text-blue-300 transition-colors"
        >
          <FontAwesomeIcon icon={faLayerGroup} className="text-blue-400" />
          Partir d&apos;un modèle
          <span className="text-gray-500 font-normal text-xs">
            ({chargement ? "…" : modeles.length})
          </span>
          <FontAwesomeIcon icon={ouvert ? faChevronUp : faChevronDown} className="text-gray-500 text-xs" />
        </button>
        <Link
          href="/admin/campagnes/modeles"
          className="ml-auto text-gray-400 text-xs hover:text-white transition-colors inline-flex items-center gap-1.5"
        >
          <FontAwesomeIcon icon={faSliders} /> Gérer les modèles
        </Link>
      </div>

      {ouvert && (
        <div className="px-4 pb-4">
          {chargement ? (
            <div className="py-6 text-center">
              <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400" />
            </div>
          ) : erreur ? (
            <p className="text-orange-300 text-xs py-3">{erreur}</p>
          ) : modeles.length === 0 ? (
            <p className="text-gray-500 text-xs py-3">
              Aucun modèle enregistré.{" "}
              <Link href="/admin/campagnes/modeles" className="text-blue-400 hover:underline">
                Créer le premier
              </Link>
              .
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {modeles.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChoisir(m)}
                  className="text-left rounded-lg border border-white/10 bg-white/[0.03] p-3 hover:border-blue-500 hover:bg-blue-500/5 transition-colors group"
                >
                  <p className="text-white text-xs font-semibold group-hover:text-blue-200">{m.nom}</p>
                  {m.moment && <p className="text-gray-500 text-[11px] mt-0.5">{m.moment}</p>}
                  {m.objectif && (
                    <p className="text-gray-400 text-[11px] mt-1.5 line-clamp-2">{m.objectif}</p>
                  )}
                  <p className="text-gray-600 text-[11px] mt-2 truncate" title={m.sujet}>
                    Objet : {m.sujet}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
