import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { centreInitials } from "@/lib/pdf-branding";

const styles = StyleSheet.create({
  logoImageBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 4,
  },
  logoImage: {
    objectFit: "contain",
  },
  logoFallbackBox: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: {
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
});

type PdfCentreLogoProps = {
  /** URL absolue PNG/JPEG/WebP — undefined si pas de logo compatible PDF */
  logoUrl?: string;
  /** Nom du centre (pour les initiales de repli) */
  displayName: string;
  size?: number;
};

/**
 * Logo du centre organisateur sur les PDF (convocation, attestation, etc.).
 * Fond blanc + objectFit contain pour les PNG transparents carrés.
 */
export function PdfCentreLogo({ logoUrl, displayName, size = 52 }: PdfCentreLogoProps) {
  const initials = centreInitials(displayName);

  if (logoUrl) {
    const inner = size - 8;
    return (
      <View style={[styles.logoImageBox, { width: size, height: size }]}>
        <Image src={logoUrl} style={[styles.logoImage, { width: inner, height: inner }]} />
      </View>
    );
  }

  return (
    <View style={[styles.logoFallbackBox, { width: size, height: size }]}>
      <Text style={styles.logoFallbackText}>{initials}</Text>
    </View>
  );
}
