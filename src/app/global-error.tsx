"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A1628",
          color: "#FFFFFF",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "16px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div
            style={{
              fontSize: 120,
              fontWeight: 800,
              lineHeight: 1,
              opacity: 0.2,
              marginBottom: 24,
            }}
          >
            500
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 16px" }}>
            Une erreur critique est survenue
          </h1>
          <p style={{ color: "#94A3B8", marginBottom: 32, lineHeight: 1.6 }}>
            Nos équipes sont automatiquement notifiées. Vous pouvez réessayer ou
            revenir à l&apos;accueil.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                background: "#DC2626",
                color: "#FFFFFF",
                padding: "12px 24px",
                borderRadius: 8,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Réessayer
            </button>
            <a
              href="/"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#FFFFFF",
                padding: "12px 24px",
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 16,
              }}
            >
              Retour à l&apos;accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
