import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { PdfCentreLogo } from "@/components/pdf/PdfCentreLogo";

// ─── Types ────────────────────────────────────────────────
export interface BonAccordData {
  titre: string;
  contenu: string; // texte du bon d'accord
  reservationNumero: string;
  stagiaire: { prenom: string; nom: string };
  acceptation: {
    nom: string;
    dateHeure: string; // formaté
    ip: string;
  };
  centre: {
    nom: string;
    raisonSociale?: string;
    adresse: string;
    codePostal: string;
    ville: string;
    logoUrl?: string;
  };
}

const colors = {
  navy: "#0A1628",
  blue: "#2563EB",
  green: "#16A34A",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  border: "#D1D5DB",
  text: "#111827",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: colors.text, backgroundColor: colors.white, padding: 0, lineHeight: 1.5 },

  header: { backgroundColor: colors.navy, paddingHorizontal: 36, paddingVertical: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoBox: { width: 42, height: 42, backgroundColor: colors.blue, borderRadius: 8, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoImage: { width: 42, height: 42, objectFit: "contain" },
  logoText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 12 },
  headerTitle: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 16 },
  headerSub: { color: "#9CA3AF", fontSize: 8, marginTop: 2 },
  badge: { backgroundColor: colors.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  badgeText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 9, letterSpacing: 0.5 },

  tricolore: { flexDirection: "row", height: 4 },
  triBlue: { flex: 1, backgroundColor: "#002395" },
  triWhite: { flex: 1, backgroundColor: colors.white },
  triRed: { flex: 1, backgroundColor: "#ED2939" },

  body: { paddingHorizontal: 36, paddingVertical: 24 },
  docTitle: { fontFamily: "Helvetica-Bold", fontSize: 14, color: colors.navy, marginBottom: 12 },
  contenu: { fontSize: 10, color: colors.text, marginBottom: 20 },

  ackBox: { backgroundColor: "#ECFDF5", border: `1px solid ${colors.green}`, borderRadius: 8, padding: 16, marginBottom: 16 },
  ackTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, color: "#065F46", marginBottom: 8 },
  ackRow: { flexDirection: "row", marginBottom: 4 },
  ackLabel: { width: 130, color: "#047857", fontSize: 9 },
  ackValue: { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 9, color: "#064E3B" },

  refBar: { backgroundColor: colors.lightGray, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  refLabel: { color: colors.gray, fontSize: 8 },
  refValue: { fontFamily: "Helvetica-Bold", fontSize: 9, color: colors.navy },

  legal: { marginTop: 8, fontSize: 7.5, color: colors.gray, lineHeight: 1.4 },
});

export function BonAccord({ data }: { data: BonAccordData }) {
  const { titre, contenu, reservationNumero, stagiaire, acceptation, centre } = data;
  const centreDisplay = centre.raisonSociale ?? centre.nom;

  return (
    <Document title={`Bon d'accord — ${stagiaire.nom} ${stagiaire.prenom}`} author={centreDisplay}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <PdfCentreLogo logoUrl={centre.logoUrl} displayName={centreDisplay} size={42} />
            <View>
              <Text style={styles.headerTitle}>{centreDisplay}</Text>
              <Text style={styles.headerSub}>{centre.adresse}, {centre.codePostal} {centre.ville}</Text>
            </View>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>LU ET ACCEPTÉ</Text>
          </View>
        </View>
        <View style={styles.tricolore}>
          <View style={styles.triBlue} />
          <View style={styles.triWhite} />
          <View style={styles.triRed} />
        </View>

        <View style={styles.body}>
          <View style={styles.refBar}>
            <Text style={styles.refLabel}>Réservation</Text>
            <Text style={styles.refValue}>{reservationNumero}</Text>
          </View>

          <Text style={styles.docTitle}>{titre}</Text>
          <Text style={styles.contenu}>{contenu}</Text>

          <View style={styles.ackBox}>
            <Text style={styles.ackTitle}>Acceptation électronique</Text>
            <View style={styles.ackRow}>
              <Text style={styles.ackLabel}>Accepté par</Text>
              <Text style={styles.ackValue}>{acceptation.nom}</Text>
            </View>
            <View style={styles.ackRow}>
              <Text style={styles.ackLabel}>Date et heure</Text>
              <Text style={styles.ackValue}>{acceptation.dateHeure}</Text>
            </View>
            <View style={styles.ackRow}>
              <Text style={styles.ackLabel}>Adresse IP</Text>
              <Text style={styles.ackValue}>{acceptation.ip}</Text>
            </View>
          </View>

          <Text style={styles.legal}>
            Le présent document a été lu et accepté électroniquement par le stagiaire. L&apos;horodatage et
            l&apos;adresse IP enregistrés au moment de l&apos;acceptation constituent une preuve de consentement.
            Ce document fait foi entre les parties (art. 1366 et 1367 du Code civil — l&apos;écrit électronique a
            la même force probante que l&apos;écrit papier).
          </Text>
        </View>
      </Page>
    </Document>
  );
}
