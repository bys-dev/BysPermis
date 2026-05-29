import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────
export interface EmargementIndividuelData {
  reservationNumero: string;
  dateEmission: string;
  stagiaire: {
    civilite?: string;
    nom: string;
    prenom: string;
    numeroPermis?: string;
  };
  formationTitre: string;
  jour1: string;
  jour2: string;
  horaires: string;
  formateurResponsable?: string;
  centre: {
    nom: string;
    raisonSociale?: string;
    adresse: string;
    codePostal: string;
    ville: string;
    numAgrement?: string;
    logoUrl?: string;
    signatureUrl?: string;
  };
}

const colors = {
  navy: "#0A1628",
  blue: "#2563EB",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  border: "#D1D5DB",
  text: "#111827",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: colors.text, backgroundColor: colors.white, padding: 0 },

  header: { backgroundColor: colors.navy, paddingHorizontal: 36, paddingVertical: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoBox: { width: 42, height: 42, backgroundColor: colors.blue, borderRadius: 8, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoImage: { width: 42, height: 42, objectFit: "contain" },
  logoText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 12 },
  headerTitle: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 16 },
  headerSub: { color: "#9CA3AF", fontSize: 8, marginTop: 2 },
  badge: { backgroundColor: colors.blue, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  badgeText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 9, letterSpacing: 0.5 },

  tricolore: { flexDirection: "row", height: 4 },
  triBlue: { flex: 1, backgroundColor: "#002395" },
  triWhite: { flex: 1, backgroundColor: colors.white },
  triRed: { flex: 1, backgroundColor: "#ED2939" },

  body: { paddingHorizontal: 36, paddingVertical: 24 },

  refBar: { backgroundColor: colors.lightGray, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", marginBottom: 18, borderLeft: `4px solid ${colors.blue}` },
  refLabel: { color: colors.gray, fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  refValue: { fontFamily: "Helvetica-Bold", fontSize: 11, color: colors.navy, marginTop: 1 },

  grid: { flexDirection: "row", gap: 14, marginBottom: 14 },
  card: { flex: 1, borderRadius: 8, border: `1px solid ${colors.border}`, padding: 14 },
  cardTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase", letterSpacing: 0.8, color: colors.blue, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${colors.border}` },
  row: { flexDirection: "row", marginBottom: 5 },
  rowLabel: { width: 110, color: colors.gray, fontSize: 9 },
  rowValue: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.text },

  // Tableau émargement (4 demi-journées)
  table: { borderTop: `1px solid ${colors.border}`, borderLeft: `1px solid ${colors.border}`, marginTop: 4, marginBottom: 18 },
  tHeadRow: { flexDirection: "row", backgroundColor: colors.navy },
  tHeadCell: { flex: 1, borderRight: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: 6, alignItems: "center", justifyContent: "center" },
  tHeadText: { color: colors.white, fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "center" },
  tHeadSub: { color: "#9CA3AF", fontSize: 6.5, textAlign: "center" },
  tCell: { flex: 1, borderRight: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, height: 46 },

  signBlock: { flexDirection: "row", gap: 20, marginTop: 4 },
  signBox: { flex: 1, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 14 },
  signTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, color: colors.gray, marginBottom: 28 },
  signImage: { width: 110, height: 46, objectFit: "contain", marginBottom: 4 },
  signLine: { borderBottom: `1px solid ${colors.border}` },
  signLabel: { color: colors.gray, fontSize: 7, marginTop: 4 },

  legal: { marginTop: 16, fontSize: 7, color: colors.gray, lineHeight: 1.4 },
});

export function EmargementIndividuel({ data }: { data: EmargementIndividuelData }) {
  const { reservationNumero, dateEmission, stagiaire, formationTitre, jour1, jour2, horaires, formateurResponsable, centre } = data;
  const centreDisplay = centre.raisonSociale ?? centre.nom;
  const lieu = `${centre.adresse}, ${centre.codePostal} ${centre.ville}`;
  const demiJournees = ["J1 — Matin", "J1 — Après-midi", "J2 — Matin", "J2 — Après-midi"];

  return (
    <Document title={`Feuille d'émargement — ${stagiaire.nom} ${stagiaire.prenom}`} author={centreDisplay}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={styles.logoBox}>
              {centre.logoUrl ? <Image src={centre.logoUrl} style={styles.logoImage} /> : <Text style={styles.logoText}>{centreDisplay.slice(0, 3).toUpperCase()}</Text>}
            </View>
            <View>
              <Text style={styles.headerTitle}>{centreDisplay}</Text>
              <Text style={styles.headerSub}>Stage de sensibilisation à la sécurité routière</Text>
            </View>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FEUILLE D&apos;ÉMARGEMENT</Text>
          </View>
        </View>
        <View style={styles.tricolore}>
          <View style={styles.triBlue} />
          <View style={styles.triWhite} />
          <View style={styles.triRed} />
        </View>

        <View style={styles.body}>
          <View style={styles.refBar}>
            <View>
              <Text style={styles.refLabel}>Référence</Text>
              <Text style={styles.refValue}>{reservationNumero}</Text>
            </View>
            <View>
              <Text style={styles.refLabel}>Date d&apos;émission</Text>
              <Text style={{ ...styles.refValue, textAlign: "right" }}>{dateEmission}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Stagiaire</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Nom complet</Text>
                <Text style={styles.rowValue}>{stagiaire.civilite ?? ""} {stagiaire.prenom} {stagiaire.nom}</Text>
              </View>
              {stagiaire.numeroPermis ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>N° de permis</Text>
                  <Text style={styles.rowValue}>{stagiaire.numeroPermis}</Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Formation</Text>
                <Text style={styles.rowValue}>{formationTitre}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Stage</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Jour 1</Text>
                <Text style={styles.rowValue}>{jour1}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Jour 2</Text>
                <Text style={styles.rowValue}>{jour2}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Horaires</Text>
                <Text style={styles.rowValue}>{horaires}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Lieu</Text>
                <Text style={styles.rowValue}>{lieu}</Text>
              </View>
              {centre.numAgrement ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>N° agrément</Text>
                  <Text style={{ ...styles.rowValue, color: colors.blue }}>{centre.numAgrement}</Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Animateur resp.</Text>
                <Text style={styles.rowValue}>{formateurResponsable ?? "—"}</Text>
              </View>
            </View>
          </View>

          {/* Émargement par demi-journée */}
          <View style={styles.table}>
            <View style={styles.tHeadRow}>
              {demiJournees.map((dj) => (
                <View key={dj} style={styles.tHeadCell}>
                  <Text style={styles.tHeadText}>{dj.split(" — ")[0]}</Text>
                  <Text style={styles.tHeadSub}>{dj.split(" — ")[1]}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row" }}>
              {demiJournees.map((dj) => (
                <View key={`cell-${dj}`} style={styles.tCell} />
              ))}
            </View>
          </View>

          {/* Signatures */}
          <View style={styles.signBlock}>
            <View style={styles.signBox}>
              <Text style={styles.signTitle}>Signature du stagiaire</Text>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>{stagiaire.prenom} {stagiaire.nom}</Text>
            </View>
            <View style={styles.signBox}>
              <Text style={styles.signTitle}>Animateur / cachet du centre</Text>
              {centre.signatureUrl ? <Image src={centre.signatureUrl} style={styles.signImage} /> : null}
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>{formateurResponsable ?? centreDisplay}</Text>
            </View>
          </View>

          <Text style={styles.legal}>
            Le stagiaire émarge à chaque demi-journée de présence effective. Ce document atteste la présence
            sur les deux jours du stage de sensibilisation à la sécurité routière. Stage agréé par la Préfecture
            conformément au Code de la route (art. R. 223-5). En cas d&apos;absence à une demi-journée, le stage
            n&apos;est pas validé et les points ne sont pas récupérés.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
