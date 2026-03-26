import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────
export interface ConvocationData {
  reservationNumero: string;
  stagiaire: {
    civilite: string;
    prenom: string;
    nom: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    numeroPermis?: string;
  };
  formation: {
    titre: string;
    type: string;
    duree: string;
    isQualiopi: boolean;
  };
  session: {
    dateDebut: string;
    dateFin: string;
    horaires?: string;
  };
  centre: {
    nom: string;
    adresse: string;
    codePostal: string;
    ville: string;
    telephone?: string;
    email?: string;
    numAgrement?: string;
  };
  montant: number;
  dateEmission: string;
}

// ─── Styles ───────────────────────────────────────────────
const colors = {
  navy: "#0A1628",
  blue: "#2563EB",
  red: "#DC2626",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  border: "#E5E7EB",
  text: "#111827",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.text,
    backgroundColor: colors.white,
    padding: 0,
  },

  // ── Header ──
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 40,
    paddingVertical: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoBox: {
    width: 44,
    height: 44,
    backgroundColor: colors.blue,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 13 },
  headerTitle: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 18, marginTop: 4 },
  headerSub: { color: "#9CA3AF", fontSize: 9, marginTop: 2 },
  convocBadge: {
    backgroundColor: colors.red,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  convocBadgeText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 11, letterSpacing: 1 },

  // ── Tricolore bar ──
  tricolore: { flexDirection: "row", height: 4 },
  triBlue: { flex: 1, backgroundColor: "#002395" },
  triWhite: { flex: 1, backgroundColor: colors.white },
  triRed: { flex: 1, backgroundColor: "#ED2939" },

  // ── Body ──
  body: { paddingHorizontal: 40, paddingVertical: 24 },

  // ── Reference ──
  refBar: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderLeft: `4px solid ${colors.blue}`,
  },
  refLabel: { color: colors.gray, fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  refValue: { fontFamily: "Helvetica-Bold", fontSize: 12, color: colors.navy, marginTop: 1 },

  // ── Grid 2 cols ──
  grid: { flexDirection: "row", gap: 14, marginBottom: 14 },
  col: { flex: 1 },

  // ── Cards ──
  card: {
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.blue,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: `1px solid ${colors.border}`,
  },

  // ── Rows ──
  row: { flexDirection: "row", marginBottom: 5 },
  rowLabel: { width: 110, color: colors.gray, fontSize: 9 },
  rowValue: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.text },

  // ── Avertissement ──
  warningBox: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    border: `1px solid #F59E0B`,
  },
  warningTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#92400E", marginBottom: 6 },
  warningRow: { flexDirection: "row", marginBottom: 3 },
  warningBullet: { color: "#B45309", fontSize: 9, marginRight: 5 },
  warningText: { color: "#78350F", fontSize: 9, flex: 1 },

  // ── Footer ──
  footer: {
    backgroundColor: colors.navy,
    paddingHorizontal: 40,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { color: "#6B7280", fontSize: 8 },
  footerBrand: { color: "#9CA3AF", fontSize: 8, fontFamily: "Helvetica-Bold" },
  footerLegal: { color: "#4B5563", fontSize: 7, textAlign: "center", marginTop: 2 },

  // ── Signature block ──
  signBlock: {
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    gap: 20,
  },
  signBox: { flex: 1 },
  signTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, color: colors.gray, marginBottom: 24 },
  signLine: { borderBottom: `1px solid ${colors.border}`, marginBottom: 4 },
  signLabel: { color: colors.gray, fontSize: 7 },
});

// ─── Component ────────────────────────────────────────────
export function Convocation({ data }: { data: ConvocationData }) {
  const { reservationNumero, stagiaire, formation, session, centre, montant, dateEmission } = data;

  return (
    <Document
      title={`Convocation BYS Formation — ${reservationNumero}`}
      author="BYS Formation"
      subject={`${formation.titre} — ${session.dateDebut}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>BYS</Text>
            </View>
            <Text style={styles.headerTitle}>BYS Formation</Text>
            <Text style={styles.headerSub}>Plateforme de stages agréés Préfecture</Text>
          </View>
          <View style={styles.convocBadge}>
            <Text style={styles.convocBadgeText}>CONVOCATION</Text>
          </View>
        </View>

        {/* Tricolore */}
        <View style={styles.tricolore}>
          <View style={styles.triBlue} />
          <View style={styles.triWhite} />
          <View style={styles.triRed} />
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Référence */}
          <View style={styles.refBar}>
            <View>
              <Text style={styles.refLabel}>Référence de réservation</Text>
              <Text style={styles.refValue}>{reservationNumero}</Text>
            </View>
            <View>
              <Text style={styles.refLabel}>Date d&apos;émission</Text>
              <Text style={{ ...styles.refValue, textAlign: "right" }}>{dateEmission}</Text>
            </View>
            <View>
              <Text style={styles.refLabel}>Montant réglé</Text>
              <Text style={{ ...styles.refValue, color: colors.blue, textAlign: "right" }}>{montant} €</Text>
            </View>
          </View>

          {/* Grid: Stagiaire + Stage */}
          <View style={styles.grid}>
            {/* Stagiaire */}
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>Informations du stagiaire</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Nom complet</Text>
                <Text style={styles.rowValue}>{stagiaire.civilite} {stagiaire.prenom} {stagiaire.nom}</Text>
              </View>
              {stagiaire.adresse && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Adresse</Text>
                  <Text style={styles.rowValue}>{stagiaire.adresse}, {stagiaire.codePostal} {stagiaire.ville}</Text>
                </View>
              )}
              {stagiaire.numeroPermis && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>N° de permis</Text>
                  <Text style={styles.rowValue}>{stagiaire.numeroPermis}</Text>
                </View>
              )}
            </View>

            {/* Stage */}
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>Stage</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Formation</Text>
                <Text style={styles.rowValue}>{formation.titre}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Durée</Text>
                <Text style={styles.rowValue}>{formation.duree}</Text>
              </View>
              {formation.isQualiopi && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Certification</Text>
                  <Text style={{ ...styles.rowValue, color: colors.blue }}>Qualiopi ✓</Text>
                </View>
              )}
            </View>
          </View>

          {/* Grid: Centre + Dates */}
          <View style={styles.grid}>
            {/* Centre */}
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>Centre de formation</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Nom</Text>
                <Text style={styles.rowValue}>{centre.nom}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Adresse</Text>
                <Text style={styles.rowValue}>{centre.adresse}{"\n"}{centre.codePostal} {centre.ville}</Text>
              </View>
              {centre.telephone && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Téléphone</Text>
                  <Text style={styles.rowValue}>{centre.telephone}</Text>
                </View>
              )}
              {centre.numAgrement && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>N° agrément</Text>
                  <Text style={{ ...styles.rowValue, color: colors.blue }}>{centre.numAgrement}</Text>
                </View>
              )}
            </View>

            {/* Dates */}
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>Dates & horaires</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Du</Text>
                <Text style={styles.rowValue}>{session.dateDebut}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Au</Text>
                <Text style={styles.rowValue}>{session.dateFin}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Horaires</Text>
                <Text style={styles.rowValue}>{session.horaires ?? "9h00 – 17h30"}</Text>
              </View>
            </View>
          </View>

          {/* Documents à apporter */}
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Documents obligatoires à apporter le jour du stage</Text>
            {[
              "Pièce d'identité en cours de validité (CNI ou passeport)",
              "Permis de conduire original",
              "Cette convocation imprimée ou sur votre smartphone",
            ].map((doc) => (
              <View key={doc} style={styles.warningRow}>
                <Text style={styles.warningBullet}>•</Text>
                <Text style={styles.warningText}>{doc}</Text>
              </View>
            ))}
          </View>

          {/* Signatures */}
          <View style={styles.signBlock}>
            <View style={styles.signBox}>
              <Text style={styles.signTitle}>Signature du stagiaire</Text>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>{stagiaire.prenom} {stagiaire.nom}</Text>
            </View>
            <View style={styles.signBox}>
              <Text style={styles.signTitle}>Cachet & signature du centre</Text>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>{centre.nom}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>BYS Formation — bysforma95@gmail.com</Text>
          <Text style={styles.footerText}>Bât. 7, 9 Chaussée Jules César, 95520 Osny</Text>
          <Text style={styles.footerText}>Lun-Ven : 9h-18h</Text>
        </View>
        <View style={{ backgroundColor: colors.navy, paddingHorizontal: 40, paddingBottom: 10 }}>
          <Text style={styles.footerLegal}>
            Ce document constitue une convocation officielle délivrée par BYS Formation. En cas d&apos;absence non justifiée, aucun remboursement ne sera effectué.
            Stage agréé par la Préfecture conformément au Code de la route (art. R. 223-5).
          </Text>
        </View>
      </Page>
    </Document>
  );
}
