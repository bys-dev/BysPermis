import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Embed logo PNG au build-time pour fonctionner sans NEXT_PUBLIC_APP_URL.
const logoPath = join(process.cwd(), "public", "colored-logo.png");
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoBase64}
            alt=""
            width={56}
            height={56}
            style={{ objectFit: "contain" }}
          />
        ) : (
          <span style={{ color: "#FFFFFF", fontSize: 36, fontWeight: 800 }}>BYS</span>
        )}
      </div>
    ),
    size,
  );
}
