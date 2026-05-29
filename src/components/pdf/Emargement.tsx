import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────
export interface EmargementStagiaire {
  civilite?: string;
  nom: string;
  prenom: string;
  numeroPermis?: string;
}

export interface EmargementData {
  formationTitre: string;
  jour1: string; // date formatée du jour 1
  jour2: string; // date formatée du jour 2
  horaires: string;
  centre: {
    nom: string;
    raisonSociale?: string;
    adresse: string;
    codePostal: string;
    ville: string;
    numAgrement?: string;
    logoUrl?: string;
  };
  stagiaires: EmargementStagiaire[];
  /** Nombre de lignes vierges supplémentaires (capacité non réservée). */
  lignesVierges: number;
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
  page: { fontFamily: "Helvetica", fontSize: 9, color: colors.text, backgroundColor: colors.white, padding: 0 },

  // ── Header ──
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 32,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoBox: { width: 40, height: 40, backgroundColor: colors.blue, borderRadius: 8, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoImage: { width: 40, height: 40, objectFit: "contain" },
  logoText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 12 },
  headerTitle: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 16 },
  headerSub: { color: "#9CA3AF", fontSize: 8, marginTop: 2 },
  badge: { backgroundColor: colors.blue, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  badgeText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 10, letterSpacing: 1 },

  // ── Tricolore ──
  tricolore: { flexDirection: "row", height: 4 },
  triBlue: { flex: 1, backgroundColor: "#002395" },
  triWhite: { flex: 1, backgroundColor: colors.white },
  triRed: { flex: 1, backgroundColor: "#ED2939" },

  body: { paddingHorizontal: 32, paddingVertical: 20 },

  // ── Meta info ──
  metaBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeft: `4px solid ${colors.blue}`,
  },
  metaItem: { width: "50%", marginBottom: 4, flexDirection: "row" },
  metaLabel: { color: colors.gray, fontSize: 8, width: 70 },
  metaValue: { fontFamily: "Helvetica-Bold", fontSize: 9, color: colors.navy, flex: 1 },

  // ── Table ──
  table: { borderTop: `1px solid ${colors.border}`, borderLeft: `1px solid ${colors.border}` },
  tableHeadRow: { flexDirection: "row", backgroundColor: colors.navy },
  tableHeadGroup: { flexDirection: "row" },
  row: { flexDirection: "row", minHeight: 34 },
  rowAlt: { backgroundColor: "#F9FAFB" },

  // Cells
  cNum: { width: 22, borderRight: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: 4, justifyContent: "center", alignItems: "center" },
  cName: { width: 150, borderRight: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: 4, justifyContent: "center" },
  cPermis: { width: 70, borderRight: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: 4, justifyContent: "center" },
  cSign: { flex: 1, borderRight: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` },

  headText: { color: colors.white, fontSize: 7.5, fontFamily: "Helvetica-Bold", textAlign: "center" },
  headSubText: { color: "#9CA3AF", fontSize: 6.5, textAlign: "center" },
  cellName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.text },
  cellSub: { fontSize: 7, color: colors.gray },
  cellNum: { fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.gray },
  cellPermis: { fontSize: 8, color: colors.text, textAlign: "center" },

  // Day group header
  dayHeadCell: { padding: 5, alignItems: "center", justifyContent: "center" },

  // ── Footer signatures ──
  formateurBlock: { marginTop: 20, flexDirection: "row", gap: 24 },
  signBox: { flex: 1, borderRadius: 8, border: `1px solid ${colors.border}`, padding: 12 },
  signRole: { fontFamily: "Helvetica-Bold", fontSize: 9, color: colors.navy, marginBottom: 8 },
  signNameLabel: { fontSize: 8, color: colors.gray, marginBottom: 20 },
  signTitle: { fontSize: 7, color: colors.gray, marginBottom: 4 },
  signLine: { borderBottom: `1px solid ${colors.border}` },

  legal: { marginTop: 16, fontSize: 7, color: colors.gray, lineHeight: 1.4 },
});

// ─── Component ────────────────────────────────────────────
export function Emargement({ data }: { data: EmargementData }) {
  const { formationTitre, jour1, jour2, horaires, centre, stagiaires, lignesVierges } = data;
  const centreDisplay = centre.raisonSociale ?? centre.nom;
  const blankRows = Array.from({ length: Math.max(0, lignesVierges) });
  const demiJournees = ["Matin", "Après-midi", "Matin", "Après-midi"];

  return (
    <Document title={`Feuille d'émargement — ${formationTitre}`} author={centreDisplay}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={styles.logoBox}>
              {centre.logoUrl ? (
                <Image src={centre.logoUrl} style={styles.logoImage} />
              ) : (
                <Text style={styles.logoText}>{centreDisplay.slice(0, 3).toUpperCase()}</Text>
              )}
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
          {/* Meta */}
          <View style={styles.metaBar}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Stage</Text>
              <Text style={styles.metaValue}>{formationTitre}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Horaires</Text>
              <Text style={styles.metaValue}>{horaires}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Jour 1</Text>
              <Text style={styles.metaValue}>{jour1}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Jour 2</Text>
              <Text style={styles.metaValue}>{jour2}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Lieu</Text>
              <Text style={styles.metaValue}>{centre.adresse}, {centre.codePostal} {centre.ville}</Text>
            </View>
            {centre.numAgrement ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>N° agrément</Text>
                <Text style={styles.metaValue}>{centre.numAgrement}</Text>
              </View>
            ) : null}
          </View>

          {/* Table */}
          <View style={styles.table}>
            {/* Day group header */}
            <View style={styles.tableHeadRow}>
              <View style={styles.cNum}><Text style={styles.headText}>#</Text></View>
              <View style={styles.cName}><Text style={styles.headText}>Nom / Prénom</Text></View>
              <View style={styles.cPermis}><Text style={styles.headText}>N° permis</Text></View>
              <View style={[styles.cSign, styles.dayHeadCell]}>
                <Text style={styles.headText}>JOUR 1</Text>
                <Text style={styles.headSubText}>{jour1}</Text>
              </View>
              <View style={[styles.cSign, styles.dayHeadCell]}>
                <Text style={styles.headText}>JOUR 2</Text>
                <Text style={styles.headSubText}>{jour2}</Text>
              </View>
            </View>
            {/* Demi-journées header */}
            <View style={[styles.tableHeadRow, { backgroundColor: "#1E2A45" }]}>
              <View style={styles.cNum}><Text style={styles.headSubText}> </Text></View>
              <View style={styles.cName}><Text style={styles.headSubText}> </Text></View>
              <View style={styles.cPermis}><Text style={styles.headSubText}> </Text></View>
              {demiJournees.map((dj, i) => (
                <View key={i} style={[styles.cSign, styles.dayHeadCell]}>
                  <Text style={styles.headSubText}>{dj}</Text>
                </View>
              ))}
            </View>

            {/* Rows — stagiaires inscrits */}
            {stagiaires.map((st, i) => (
              <View key={i} style={[styles.row, ...(i % 2 === 1 ? [styles.rowAlt] : [])]} wrap={false}>
                <View style={styles.cNum}><Text style={styles.cellNum}>{i + 1}</Text></View>
                <View style={styles.cName}>
                  <Text style={styles.cellName}>{st.nom?.toUpperCase()} {st.prenom}</Text>
                  {st.civilite ? <Text style={styles.cellSub}>{st.civilite}</Text> : null}
                </View>
                <View style={styles.cPermis}><Text style={styles.cellPermis}>{st.numeroPermis ?? "—"}</Text></View>
                <View style={styles.cSign} />
                <View style={styles.cSign} />
                <View style={styles.cSign} />
                <View style={styles.cSign} />
              </View>
            ))}

            {/* Lignes vierges */}
            {blankRows.map((_, i) => {
              const idx = stagiaires.length + i;
              return (
                <View key={`blank-${i}`} style={[styles.row, ...(idx % 2 === 1 ? [styles.rowAlt] : [])]} wrap={false}>
                  <View style={styles.cNum}><Text style={styles.cellNum}>{idx + 1}</Text></View>
                  <View style={styles.cName} />
                  <View style={styles.cPermis} />
                  <View style={styles.cSign} />
                  <View style={styles.cSign} />
                  <View style={styles.cSign} />
                  <View style={styles.cSign} />
                </View>
              );
            })}
          </View>

          {/* Signatures des animateurs (binôme obligatoire : expert + psychologue) */}
          <View style={styles.formateurBlock}>
            <View style={styles.signBox}>
              <Text style={styles.signRole}>L&apos;expert en sécurité routière (BAFM)</Text>
              <Text style={styles.signNameLabel}>Nom :</Text>
              <Text style={styles.signTitle}>Signature</Text>
              <View style={styles.signLine} />
            </View>
            <View style={styles.signBox}>
              <Text style={styles.signRole}>Le psychologue</Text>
              <Text style={styles.signNameLabel}>Nom :</Text>
              <Text style={styles.signTitle}>Signature</Text>
              <View style={styles.signLine} />
            </View>
          </View>

          <Text style={styles.legal}>
            Chaque stagiaire émarge à chaque demi-journée de présence. La feuille d&apos;émargement est un
            document officiel attestant de la présence effective sur les deux jours du stage de sensibilisation
            à la sécurité routière. Stage agréé par la Préfecture conformément au Code de la route (art. R. 223-5).
          </Text>
        </View>
      </Page>
    </Document>
  );
}
