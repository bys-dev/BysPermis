"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";

interface FavoriteButtonProps {
  formationId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Heart button to toggle favorites.
 * Self-contained: checks auth and current state, handles add/remove.
 */
export default function FavoriteButton({
  formationId,
  className = "",
  size = "md",
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const sizeClasses = {
    sm: "w-7 h-7 text-sm",
    md: "w-9 h-9 text-base",
    lg: "w-11 h-11 text-lg",
  };

  // Check auth + current favorite status
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) return;
        if (cancelled) return;
        setIsAuthenticated(true);

        const favRes = await fetch("/api/favorites");
        if (!favRes.ok) return;
        const favorites = await favRes.json();
        if (cancelled) return;

        if (Array.isArray(favorites)) {
          const found = favorites.some(
            (f: { formation: { id: string } }) => f.formation.id === formationId
          );
          setIsFavorite(found);
        }
      } catch {
        // not authenticated or error — button stays inactive
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [formationId]);

  const toggle = useCallback(async () => {
    if (loading) return;

    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = "/connexion";
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        await fetch(`/api/favorites?formationId=${formationId}`, {
          method: "DELETE",
        });
        setIsFavorite(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formationId }),
        });
        setIsFavorite(true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [formationId, isFavorite, isAuthenticated, loading]);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
        isFavorite
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white"
      } ${loading ? "opacity-50" : ""} ${className}`}
      title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <FontAwesomeIcon
        icon={isFavorite ? faHeartSolid : faHeartRegular}
        className={loading ? "animate-pulse" : ""}
      />
    </button>
  );
}
