import { View, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  sealImage: {
    objectFit: "contain",
  },
});

type PdfCentreSealProps = {
  /** URL absolue PNG/JPEG/WebP — undefined si pas de cachet compatible PDF */
  sealUrl?: string;
  width?: number;
  height?: number;
};

/**
 * Cachet numérique du centre sur les PDF (convocation, attestation, contrat…).
 * N'affiche rien si le centre n'a pas de cachet ou si le format n'est pas compatible react-pdf.
 */
export function PdfCentreSeal({ sealUrl, width = 110, height = 50 }: PdfCentreSealProps) {
  if (!sealUrl) return null;

  return (
    <View style={{ marginBottom: 4 }}>
      <Image src={sealUrl} style={[styles.sealImage, { width, height }]} />
    </View>
  );
}
