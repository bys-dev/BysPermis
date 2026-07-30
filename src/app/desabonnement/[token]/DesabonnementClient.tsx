"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faSpinner, faEnvelopeOpenText, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

type Etat = "chargement" | "pret" | "envoi" | "termine" | "invalide" | "erreur";

/**
 * Page de désinscription.
 *
 * La désinscription se fait sur un POST déclenché par un clic, jamais au
 * chargement : les antivirus de messagerie et les proxys de prévisualisation
 * suivent les liens des emails, et désabonneraient les prospects à leur place.
 */
export default function DesabonnementClient({ token }: { token: string }) {
  const [etat, setEtat] = useState<Etat>("chargement");
  const [nom, setNom] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const res = await fetch(`/api/desabonnement/${encodeURIComponent(token)}`);
        const data = await res.json();
        if (annule) return;
        if (!data.valide) {
          setEtat("invalide");
          return;
        }
        setNom(data.nom ?? null);
        setEmail(data.email ?? null);
        setEtat(data.deja ? "termine" : "pret");
      } catch {
        if (!annule) setEtat("erreur");
      }
    })();
    return () => {
      annule = true;
    };
  }, [token]);

  const confirmer = async () => {
    setEtat("envoi");
    try {
      const res = await fetch(`/api/desabonnement/${encodeURIComponent(token)}`, { method: "POST" });
      setEtat(res.ok ? "termine" : "erreur");
    } catch {
      setEtat("erreur");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-sm p-8 lg:p-10 text-center">
        {etat === "chargement" && (
          <>
            <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 text-3xl mb-4" />
            <p className="text-gray-500 text-sm">Vérification du lien…</p>
          </>
        )}

        {etat === "pret" && (
          <>
            <div className="w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon={faEnvelopeOpenText} className="text-blue-500 text-2xl" />
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900 mb-3">
              Ne plus recevoir nos emails
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              {nom ? (
                <>
                  Confirmez la désinscription de <strong className="text-gray-700">{nom}</strong>
                  {email ? (
                    <>
                      {" "}
                      (<span className="text-gray-600">{email}</span>)
                    </>
                  ) : null}
                  . Vous ne recevrez plus aucun message de prospection de notre part.
                </>
              ) : (
                "Confirmez votre désinscription. Vous ne recevrez plus aucun message de prospection de notre part."
              )}
            </p>
            <button
              onClick={confirmer}
              className="w-full px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Confirmer ma désinscription
            </button>
            <p className="text-gray-400 text-xs mt-4">
              Cette action est immédiate et définitive.
            </p>
          </>
        )}

        {etat === "envoi" && (
          <>
            <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 text-3xl mb-4" />
            <p className="text-gray-500 text-sm">Enregistrement…</p>
          </>
        )}

        {etat === "termine" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-2xl" />
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900 mb-3">
              C&apos;est enregistré
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Vous ne recevrez plus d&apos;emails de prospection de BYS Permis. Si vous changez
              d&apos;avis, vous pouvez toujours nous contacter directement.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              Retour à l&apos;accueil
            </Link>
          </>
        )}

        {(etat === "invalide" || etat === "erreur") && (
          <>
            <div className="w-16 h-16 rounded-full bg-orange-50 border-4 border-orange-100 flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-orange-500 text-2xl" />
            </div>
            <h1 className="font-display font-bold text-2xl text-gray-900 mb-3">
              {etat === "invalide" ? "Lien introuvable" : "Une erreur est survenue"}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              {etat === "invalide"
                ? "Ce lien de désinscription n'est plus valide. Il a peut-être déjà été utilisé."
                : "Nous n'avons pas pu enregistrer votre demande. Réessayez dans un instant."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {etat === "erreur" && (
                <button
                  onClick={confirmer}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  Réessayer
                </button>
              )}
              <Link
                href="/contact"
                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:border-blue-500 hover:text-blue-600 transition-all"
              >
                Nous contacter
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
