import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// 512 px : taille reelle declaree dans manifest.ts (l'icone PWA etait upscalee depuis 64).
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Embed logo PNG au build-time pour fonctionner sans NEXT_PUBLIC_APP_URL.
const logoPath = join(process.cwd(), "public", "transparent-logo.png");
const logoBase64 = (() => {
  try {
    return `data:image/png;base64,${readFileSync(logoPath).toString("base64")}`;
  } catch {
    return null;
  }
})();

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0A1628",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {logoBase64 ? (
          // La marque est bleu nuit sur transparent : on la passe en blanc pour
          // qu'elle ressorte sur le fond, comme dans opengraph-image.tsx.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoBase64}
            alt=""
            width={400}
            height={400}
            style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />
        ) : (
          <span style={{ color: "#FFFFFF", fontSize: 280, fontWeight: 800 }}>BYS</span>
        )}
      </div>
    ),
    size,
  );
}
