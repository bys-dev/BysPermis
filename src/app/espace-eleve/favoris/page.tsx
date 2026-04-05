"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faHeartCrack,
  faSpinner,
  faMapMarkerAlt,
  faCalendar,
  faUsers,
  faArrowRight,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

interface FavoriteItem {
  id: string;
  createdAt: string;
  formation: {
    id: string;
    titre: string;
    slug: string;
    description: string;
    prix: number;
    duree: string;
    image: string | null;
    isQualiopi: boolean;
    isCPF: boolean;
    centre: {
      id: string;
      nom: string;
      slug: string;
      ville: string;
    };
    sessions: Array<{
      id: string;
      dateDebut: string;
      placesRestantes: number;
      formation: { prix: number };
    }>;
  };
}

export default function FavorisPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  function fetchFavorites() {
    setLoading(true);
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFavorites(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function removeFavorite(formationId: string) {
    setRemovingId(formationId);
    try {
      await fetch(`/api/favorites?formationId=${formationId}`, {
        method: "DELETE",
      });
      setFavorites((prev) =>
        prev.filter((f) => f.formation.id !== formationId)
      );
    } catch {
      // silent
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
        <FontAwesomeIcon icon={faHeart} className="text-red-400" />
        Mes favoris
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Retrouvez les formations que vous avez mises en favori.
      </p>

      {loading ? (
        <div className="text-center py-20">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-blue-400 text-xl animate-spin"
          />
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}>
          <FontAwesomeIcon
            icon={faHeartCrack}
            className="text-gray-600 text-3xl mb-4"
          />
          <p className="text-gray-400 text-lg font-medium mb-2">
            Aucun favori
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Explorez les formations et ajoutez-les a vos favoris !
          </p>
          <Link
            href="/recherche"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Voir les formations
            <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((fav) => {
            const nextSession = fav.formation.sessions[0];
            return (
              <div
                key={fav.id}
                className="rounded-xl border overflow-hidden transition-all hover:border-white/15"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                {/* Image */}
                <div className="aspect-[16/9] bg-gradient-to-br from-blue-900/30 to-blue-800/10 relative">
                  {fav.formation.image ? (
                    <img
                      src={fav.formation.image}
                      alt={fav.formation.titre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl text-blue-600/30 font-display font-bold">
                        BYS
                      </span>
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => removeFavorite(fav.formation.id)}
                    disabled={removingId === fav.formation.id}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-red-600 hover:text-white transition-all"
                    title="Retirer des favoris"
                  >
                    {removingId === fav.formation.id ? (
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="w-3.5 h-3.5 animate-spin"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="w-3.5 h-3.5"
                      />
                    )}
                  </button>

                  {/* Badges */}
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {fav.formation.isQualiopi && (
                      <span className="bg-green-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Qualiopi
                      </span>
                    )}
                    {fav.formation.isCPF && (
                      <span className="bg-blue-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        CPF
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <Link
                    href={`/formations/${fav.formation.slug}`}
                    className="block"
                  >
                    <h3 className="text-white font-semibold text-sm hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                      {fav.formation.titre}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="w-3 h-3"
                    />
                    <Link
                      href={`/centres/${fav.formation.centre.slug}`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {fav.formation.centre.nom} - {fav.formation.centre.ville}
                    </Link>
                  </div>

                  {/* Next session */}
                  {nextSession ? (
                    <div className="flex items-center justify-between text-xs mb-4">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <FontAwesomeIcon
                          icon={faCalendar}
                          className="w-3 h-3"
                        />
                        {new Date(nextSession.dateDebut).toLocaleDateString(
                          "fr-FR",
                          { day: "numeric", month: "short" }
                        )}
                      </span>
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <FontAwesomeIcon
                          icon={faUsers}
                          className="w-3 h-3"
                        />
                        {nextSession.placesRestantes} place
                        {nextSession.placesRestantes > 1 ? "s" : ""}
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-xs mb-4">
                      Aucune session disponible
                    </p>
                  )}

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between">
                    <p className="text-blue-400 font-bold text-lg">
                      {fav.formation.prix.toFixed(0)}
                      <span className="text-xs font-normal text-gray-500 ml-0.5">
                        EUR
                      </span>
                    </p>
                    <Link
                      href={`/formations/${fav.formation.slug}`}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                      Voir
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className="w-3 h-3"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
