import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────
export interface AttestationData {
  numeroAttestation: string;
  dateDelivrance: string;
  stagiaire: {
    civilite?: string;
    prenom: string;
    nom: string;
    dateNaissance?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
  };
  formation: {
    titre: string;
    duree: string;
    objectifs?: string;
    modalite: string;
  };
  session: {
    dateDebut: string;
    dateFin: string;
    lieu: string;
  };
  centre: {
    nom: string;
    adresse: string;
    codePostal: string;
    ville: string;
    telephone?: string;
    email?: string;
  };
  verificationUrl?: string;
}

// ─── Styles ───────────────────────────────────────────────
const colors = {
  navy: "#0A1628",
  blue: "#2563EB",
  darkBlue: "#1E40AF",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  border: "#E5E7EB",
  text: "#111827",
  white: "#FFFFFF",
  gold: "#D97706",
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
  attestBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  attestBadgeText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 10, letterSpacing: 1 },

  // ── Tricolore bar ──
  tricolore: { flexDirection: "row", height: 4 },
  triBlue: { flex: 1, backgroundColor: "#002395" },
  triWhite: { flex: 1, backgroundColor: colors.white },
  triRed: { flex: 1, backgroundColor: "#ED2939" },

  // ── Body ──
  body: { paddingHorizontal: 40, paddingVertical: 24 },

  // ── Title section ──
  titleSection: {
    textAlign: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: `2px solid ${colors.blue}`,
  },
  mainTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: colors.navy,
    letterSpacing: 2,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10,
    color: colors.gray,
  },

  // ── Reference bar ──
  refBar: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderLeft: `4px solid ${colors.gold}`,
  },
  refLabel: { color: colors.gray, fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  refValue: { fontFamily: "Helvetica-Bold", fontSize: 11, color: colors.navy, marginTop: 1 },

  // ── Body text ──
  bodyText: {
    fontSize: 10,
    lineHeight: 1.8,
    color: colors.text,
    marginBottom: 20,
    textAlign: "justify",
  },
  bodyTextBold: {
    fontFamily: "Helvetica-Bold",
    color: colors.navy,
  },

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

  // ── QR placeholder ──
  qrBox: {
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.lightGray,
  },
  qrText: { fontSize: 7, color: colors.gray, textAlign: "center" },
  qrInfo: { flex: 1 },
  qrInfoTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, color: colors.navy, marginBottom: 3 },
  qrInfoText: { fontSize: 7, color: colors.gray, lineHeight: 1.4 },

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
});

// ─── Component ────────────────────────────────────────────
export function Attestation({ data }: { data: AttestationData }) {
  const {
    numeroAttestation,
    dateDelivrance,
    stagiaire,
    formation,
    session,
    centre,
    verificationUrl,
  } = data;

  const modaliteLabel: Record<string, string> = {
    PRESENTIEL: "Présentiel",
    DISTANCIEL: "Distanciel",
    HYBRIDE: "Hybride",
  };

  return (
    <Document
      title={`Attestation de formation — ${numeroAttestation}`}
      author="BYS Formation"
      subject={`Attestation ${formation.titre} — ${stagiaire.prenom} ${stagiaire.nom}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>BYS</Text>
            </View>
            <Text style={styles.headerTitle}>BYS Formation</Text>
            <Text style={styles.headerSub}>Plateforme de stages agrees Prefecture</Text>
          </View>
          <View style={styles.attestBadge}>
            <Text style={styles.attestBadgeText}>ATTESTATION</Text>
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
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>ATTESTATION DE FORMATION</Text>
            <Text style={styles.subtitle}>
              Document officiel delivre par {centre.nom}
            </Text>
          </View>

          {/* Reference */}
          <View style={styles.refBar}>
            <View>
              <Text style={styles.refLabel}>Numero d&apos;attestation</Text>
              <Text style={styles.refValue}>{numeroAttestation}</Text>
            </View>
            <View>
              <Text style={styles.refLabel}>Date de delivrance</Text>
              <Text style={{ ...styles.refValue, textAlign: "right" }}>{dateDelivrance}</Text>
            </View>
          </View>

          {/* Corps de l'attestation */}
          <Text style={styles.bodyText}>
            Nous certifions que{" "}
            <Text style={styles.bodyTextBold}>
              {stagiaire.civilite ? `${stagiaire.civilite} ` : ""}{stagiaire.prenom} {stagiaire.nom}
            </Text>
            {stagiaire.dateNaissance ? (
              <Text>, ne(e) le <Text style={styles.bodyTextBold}>{stagiaire.dateNaissance}</Text></Text>
            ) : null}
            {stagiaire.ville ? (
              <Text>, demeurant a <Text style={styles.bodyTextBold}>{stagiaire.adresse ? `${stagiaire.adresse}, ` : ""}{stagiaire.codePostal} {stagiaire.ville}</Text></Text>
            ) : null}
            , a suivi avec succes la formation{" "}
            <Text style={styles.bodyTextBold}>{formation.titre}</Text>{" "}
            dispensee par le centre de formation{" "}
            <Text style={styles.bodyTextBold}>{centre.nom}</Text>, situe a{" "}
            <Text style={styles.bodyTextBold}>{centre.adresse}, {centre.codePostal} {centre.ville}</Text>.
          </Text>

          {/* Grid: Formation + Session details */}
          <View style={styles.grid}>
            {/* Formation details */}
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>Details de la formation</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Formation</Text>
                <Text style={styles.rowValue}>{formation.titre}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Duree</Text>
                <Text style={styles.rowValue}>{formation.duree}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Modalite</Text>
                <Text style={styles.rowValue}>{modaliteLabel[formation.modalite] ?? formation.modalite}</Text>
              </View>
              {formation.objectifs && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Objectifs</Text>
                  <Text style={styles.rowValue}>{formation.objectifs}</Text>
                </View>
              )}
            </View>

            {/* Session details */}
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>Session suivie</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Du</Text>
                <Text style={styles.rowValue}>{session.dateDebut}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Au</Text>
                <Text style={styles.rowValue}>{session.dateFin}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Lieu</Text>
                <Text style={styles.rowValue}>{session.lieu}</Text>
              </View>
            </View>
          </View>

          {/* Grid: Stagiaire + Centre */}
          <View style={styles.grid}>
            {/* Stagiaire */}
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>Stagiaire</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Nom complet</Text>
                <Text style={styles.rowValue}>{stagiaire.civilite ? `${stagiaire.civilite} ` : ""}{stagiaire.prenom} {stagiaire.nom}</Text>
              </View>
              {stagiaire.adresse && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Adresse</Text>
                  <Text style={styles.rowValue}>{stagiaire.adresse}{"\n"}{stagiaire.codePostal} {stagiaire.ville}</Text>
                </View>
              )}
            </View>

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
                  <Text style={styles.rowLabel}>Telephone</Text>
                  <Text style={styles.rowValue}>{centre.telephone}</Text>
                </View>
              )}
            </View>
          </View>

          {/* QR Code placeholder */}
          <View style={styles.qrBox}>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>QR{"\n"}Code</Text>
            </View>
            <View style={styles.qrInfo}>
              <Text style={styles.qrInfoTitle}>Verification en ligne</Text>
              <Text style={styles.qrInfoText}>
                Scannez ce QR code ou rendez-vous a l&apos;adresse suivante pour verifier l&apos;authenticite de cette attestation :
                {"\n"}{verificationUrl ?? `https://byspermis.fr/verification/${numeroAttestation}`}
              </Text>
            </View>
          </View>

          {/* Signatures */}
          <View style={styles.signBlock}>
            <View style={styles.signBox}>
              <Text style={styles.signTitle}>Signature du formateur</Text>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>Fait a {centre.ville}, le {dateDelivrance}</Text>
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
          <Text style={styles.footerText}>Bat. 7, 9 Chaussee Jules Cesar, 95520 Osny</Text>
          <Text style={styles.footerText}>Lun-Ven : 9h-18h</Text>
        </View>
        <View style={{ backgroundColor: colors.navy, paddingHorizontal: 40, paddingBottom: 10 }}>
          <Text style={styles.footerLegal}>
            Cette attestation est delivree conformement aux dispositions du Code du travail relatives a la formation professionnelle.
            {"\n"}BYS Formation — SIRET 908 058 092 00028 — Bat. 7, 9 Chaussee Jules Cesar, 95520 Osny
          </Text>
        </View>
      </Page>
    </Document>
  );
}
