import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────
export interface ContratData {
  numeroContrat: string; // BYS-CTR-2026-0001
  dateEmission: string;
  organisme: {
    nom: string;
    siret?: string;
    adresse: string;
    codePostal: string;
    ville: string;
    email?: string;
    telephone?: string;
    numDeclarationActivite?: string;
  };
  stagiaire: {
    civilite?: string;
    prenom: string;
    nom: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    email: string;
    telephone: string;
  };
  formation: {
    titre: string;
    objectifs?: string;
    programme?: string;
    duree: string;
    modalite: string;
    lieu: string;
  };
  session: {
    dateDebut: string;
    dateFin: string;
  };
  conditions: {
    prixTTC: number;
    tvaNote: string; // "TVA non applicable (art. 261.4.4° du CGI)" or "TVA 20%"
    modeReglement: string;
    datePaiement: string;
    refTransaction?: string;
  };
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
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.text,
    backgroundColor: colors.white,
    padding: 0,
  },

  // ── Header ──
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 40,
    paddingVertical: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: colors.blue,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 12 },
  headerTitle: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 16, marginTop: 3 },
  headerSub: { color: "#9CA3AF", fontSize: 8, marginTop: 2 },
  contratBadge: {
    backgroundColor: colors.darkBlue,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  contratBadgeText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 9, letterSpacing: 1 },

  // ── Tricolore bar ──
  tricolore: { flexDirection: "row", height: 3 },
  triBlue: { flex: 1, backgroundColor: "#002395" },
  triWhite: { flex: 1, backgroundColor: colors.white },
  triRed: { flex: 1, backgroundColor: "#ED2939" },

  // ── Body ──
  body: { paddingHorizontal: 40, paddingVertical: 18 },

  // ── Title section ──
  titleSection: {
    textAlign: "center",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: `2px solid ${colors.blue}`,
  },
  mainTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: colors.navy,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8,
    color: colors.gray,
  },

  // ── Reference bar ──
  refBar: {
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderLeft: `3px solid ${colors.blue}`,
  },
  refLabel: { color: colors.gray, fontSize: 7, textTransform: "uppercase", letterSpacing: 0.5 },
  refValue: { fontFamily: "Helvetica-Bold", fontSize: 10, color: colors.navy, marginTop: 1 },

  // ── Section title ──
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.blue,
    marginBottom: 6,
    marginTop: 10,
    paddingBottom: 4,
    borderBottom: `1px solid ${colors.border}`,
  },

  // ── Grid 2 cols ──
  grid: { flexDirection: "row", gap: 12, marginBottom: 10 },
  col: { flex: 1 },

  // ── Cards ──
  card: {
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    padding: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.blue,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: `1px solid ${colors.border}`,
  },

  // ── Rows ──
  row: { flexDirection: "row", marginBottom: 3 },
  rowLabel: { width: 100, color: colors.gray, fontSize: 8 },
  rowValue: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", color: colors.text },

  // ── Paragraphs ──
  paragraph: {
    fontSize: 8,
    lineHeight: 1.6,
    color: colors.text,
    marginBottom: 6,
    textAlign: "justify",
  },
  paragraphBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: colors.navy,
  },

  // ── Bullet list ──
  bulletRow: { flexDirection: "row", marginBottom: 2, paddingLeft: 8 },
  bullet: { color: colors.blue, fontSize: 8, marginRight: 5, width: 8 },
  bulletText: { color: colors.text, fontSize: 8, flex: 1, lineHeight: 1.5 },

  // ── Signature block ──
  signBlock: {
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  signBox: { flex: 1 },
  signTitle: { fontFamily: "Helvetica-Bold", fontSize: 7, color: colors.gray, marginBottom: 4 },
  signSubtitle: { fontSize: 7, color: colors.gray, marginBottom: 18 },
  signLine: { borderBottom: `1px solid ${colors.border}`, marginBottom: 3 },
  signLabel: { color: colors.gray, fontSize: 6 },

  // ── Footer ──
  footer: {
    backgroundColor: colors.navy,
    paddingHorizontal: 40,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { color: "#6B7280", fontSize: 7 },
  footerBrand: { color: "#9CA3AF", fontSize: 7, fontFamily: "Helvetica-Bold" },
  footerLegal: { color: "#4B5563", fontSize: 6, textAlign: "center", marginTop: 2 },
});

// ─── Helpers ──────────────────────────────────────────────
function formatEuro(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";
}

// ─── Component ────────────────────────────────────────────
export function Contrat({ data }: { data: ContratData }) {
  const {
    numeroContrat,
    dateEmission,
    organisme,
    stagiaire,
    formation,
    session,
    conditions,
  } = data;

  const modaliteLabel: Record<string, string> = {
    PRESENTIEL: "Presentiel",
    DISTANCIEL: "Distanciel",
    HYBRIDE: "Hybride",
  };

  return (
    <Document
      title={`Contrat de formation ${numeroContrat} — BYS Formation`}
      author="BYS Formation"
      subject={`Contrat ${formation.titre} — ${stagiaire.prenom} ${stagiaire.nom}`}
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
          <View style={styles.contratBadge}>
            <Text style={styles.contratBadgeText}>CONTRAT</Text>
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
            <Text style={styles.mainTitle}>CONTRAT DE FORMATION PROFESSIONNELLE</Text>
            <Text style={styles.subtitle}>
              (Article L.6353-3 du Code du Travail)
            </Text>
          </View>

          {/* Reference */}
          <View style={styles.refBar}>
            <View>
              <Text style={styles.refLabel}>Numero de contrat</Text>
              <Text style={styles.refValue}>{numeroContrat}</Text>
            </View>
            <View>
              <Text style={styles.refLabel}>Date d&apos;etablissement</Text>
              <Text style={{ ...styles.refValue, textAlign: "right" }}>{dateEmission}</Text>
            </View>
          </View>

          {/* ── ENTRE LES PARTIES ── */}
          <Text style={styles.sectionTitle}>Entre les parties</Text>

          <View style={styles.grid}>
            {/* Organisme */}
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>L&apos;organisme de formation</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Raison sociale</Text>
                <Text style={styles.rowValue}>{organisme.nom}</Text>
              </View>
              {organisme.siret && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>SIRET</Text>
                  <Text style={styles.rowValue}>{organisme.siret}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Adresse</Text>
                <Text style={styles.rowValue}>{organisme.adresse}{"\n"}{organisme.codePostal} {organisme.ville}</Text>
              </View>
              {organisme.numDeclarationActivite && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>N. declaration</Text>
                  <Text style={styles.rowValue}>{organisme.numDeclarationActivite}</Text>
                </View>
              )}
              {organisme.email && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Email</Text>
                  <Text style={styles.rowValue}>{organisme.email}</Text>
                </View>
              )}
              {organisme.telephone && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Telephone</Text>
                  <Text style={styles.rowValue}>{organisme.telephone}</Text>
                </View>
              )}
            </View>

            {/* Stagiaire */}
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>Le stagiaire</Text>
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
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{stagiaire.email}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Telephone</Text>
                <Text style={styles.rowValue}>{stagiaire.telephone}</Text>
              </View>
            </View>
          </View>

          {/* ── OBJET DE LA FORMATION ── */}
          <Text style={styles.sectionTitle}>Objet de la formation</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Intitule</Text>
              <Text style={styles.rowValue}>{formation.titre}</Text>
            </View>
            {formation.objectifs && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Objectifs</Text>
                <Text style={styles.rowValue}>{formation.objectifs}</Text>
              </View>
            )}
            {formation.programme && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Programme</Text>
                <Text style={styles.rowValue}>{formation.programme}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Duree totale</Text>
              <Text style={styles.rowValue}>{formation.duree}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Dates</Text>
              <Text style={styles.rowValue}>Du {session.dateDebut} au {session.dateFin}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Lieu</Text>
              <Text style={styles.rowValue}>{formation.lieu}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Modalite</Text>
              <Text style={styles.rowValue}>{modaliteLabel[formation.modalite] ?? formation.modalite}</Text>
            </View>
          </View>

          {/* ── CONDITIONS FINANCIERES ── */}
          <Text style={styles.sectionTitle}>Conditions financieres</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Prix total TTC</Text>
              <Text style={{ ...styles.rowValue, color: colors.blue }}>{formatEuro(conditions.prixTTC)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>TVA</Text>
              <Text style={styles.rowValue}>{conditions.tvaNote}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Mode de reglement</Text>
              <Text style={styles.rowValue}>{conditions.modeReglement}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date de paiement</Text>
              <Text style={styles.rowValue}>{conditions.datePaiement}</Text>
            </View>
            {conditions.refTransaction && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Ref. transaction</Text>
                <Text style={styles.rowValue}>{conditions.refTransaction}</Text>
              </View>
            )}
          </View>

          {/* ── CONDITIONS D'ANNULATION ── */}
          <Text style={styles.sectionTitle}>Conditions d&apos;annulation et de retractation</Text>

          <View style={{ marginBottom: 6 }}>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>{"\u2022"}</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.paragraphBold}>Droit de retractation :</Text> Le stagiaire dispose d&apos;un delai de 14 jours calendaires a compter de la signature du present contrat pour exercer son droit de retractation, sans penalite et sans motif.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>{"\u2022"}</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.paragraphBold}>Annulation apres 14 jours :</Text> Toute annulation intervenant apres le delai de retractation sera soumise aux conditions generales du centre de formation. Une retenue pourra etre appliquee.
              </Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>{"\u2022"}</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.paragraphBold}>Force majeure :</Text> En cas de force majeure (maladie, accident, etc.), un report de la formation pourra etre propose sous reserve de justificatif.
              </Text>
            </View>
          </View>

          {/* ── ENGAGEMENTS DES PARTIES ── */}
          <Text style={styles.sectionTitle}>Engagements des parties</Text>

          <View style={styles.grid}>
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>L&apos;organisme s&apos;engage a</Text>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{"\u2022"}</Text>
                <Text style={styles.bulletText}>Dispenser la formation conformement au programme prevu</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{"\u2022"}</Text>
                <Text style={styles.bulletText}>Fournir les moyens pedagogiques et le materiel necessaires</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{"\u2022"}</Text>
                <Text style={styles.bulletText}>Delivrer une attestation de fin de formation</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{"\u2022"}</Text>
                <Text style={styles.bulletText}>Informer le stagiaire en cas de modification du programme</Text>
              </View>
            </View>

            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>Le stagiaire s&apos;engage a</Text>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{"\u2022"}</Text>
                <Text style={styles.bulletText}>Suivre la formation avec assiduite pendant toute sa duree</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{"\u2022"}</Text>
                <Text style={styles.bulletText}>Respecter le reglement interieur du centre de formation</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{"\u2022"}</Text>
                <Text style={styles.bulletText}>Se presenter a l&apos;heure aux sessions prevues</Text>
              </View>
              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>{"\u2022"}</Text>
                <Text style={styles.bulletText}>Fournir les documents necessaires le jour de la formation</Text>
              </View>
            </View>
          </View>

          {/* ── SIGNATURES ── */}
          <View style={styles.signBlock}>
            <View style={styles.signBox}>
              <Text style={styles.signTitle}>Pour l&apos;organisme de formation</Text>
              <Text style={styles.signSubtitle}>Cachet et signature</Text>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>Fait a {organisme.ville}, le {dateEmission}</Text>
            </View>
            <View style={styles.signBox}>
              <Text style={styles.signTitle}>Le stagiaire</Text>
              <Text style={styles.signSubtitle}>Mention &quot;Lu et approuve&quot; + signature</Text>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>{stagiaire.prenom} {stagiaire.nom}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>BYS Formation — bysforma95@gmail.com</Text>
          <Text style={styles.footerText}>Bat. 7, 9 Chaussee Jules Cesar, 95520 Osny</Text>
          <Text style={styles.footerText}>SIRET : 908 058 092 00028</Text>
        </View>
        <View style={{ backgroundColor: colors.navy, paddingHorizontal: 40, paddingBottom: 8 }}>
          <Text style={styles.footerLegal}>
            Contrat de formation professionnelle etabli conformement aux articles L.6353-1 et suivants du Code du travail.
            {"\n"}BYS Formation — SIRET 908 058 092 00028 — Bat. 7, 9 Chaussee Jules Cesar, 95520 Osny
            {"\n"}N. de contrat : {numeroContrat} — Genere le {dateEmission}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
