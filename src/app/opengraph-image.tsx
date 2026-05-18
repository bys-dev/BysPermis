import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const alt = "BYS Formation — Stages agréés de récupération de points";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Embed logo PNG au build-time pour OG image fiable hors NEXT_PUBLIC_APP_URL.
const logoBase64 = (() => {
  try {
    const p = join(process.cwd(), "public", "transparent-logo.png");
    return `data:image/png;base64,${readFileSync(p).toString("base64")}`;
  } catch {
    return null;
  }
})();

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #0A1628 0%, #1E3A8A 60%, #2563EB 100%)",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 28,
            fontWeight: 600,
            color: "#93C5FD",
            letterSpacing: 1,
          }}
        >
          {logoBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoBase64}
              alt=""
              height={72}
              style={{ height: 72, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                background: "#FFFFFF",
                color: "#0A1628",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 900,
              }}
            >
              BYS
            </div>
          )}
          BYS FORMATION
        </div>

        <div
          style={{
            marginTop: 64,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Récupérez 4 points</span>
          <span style={{ color: "#FBBF24" }}>en 2 jours</span>
        </div>

        <div
          style={{
            marginTop: 32,
            fontSize: 28,
            color: "#CBD5E1",
            maxWidth: 900,
          }}
        >
          Stages agréés Ministère de l&apos;Intérieur · 150+ centres partenaires
          · Convocation immédiate
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 24,
            color: "#94A3B8",
          }}
        >
          byspermis.fr
        </div>
      </div>
    ),
    size,
  );
}
