import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────
export interface FactureData {
  numero: string; // FAC-2026-0001
  dateEmission: string;
  dateEcheance: string;
  client: {
    nom: string;
    prenom: string;
    email: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
  };
  lignes: {
    description: string;
    quantite: number;
    prixUnitaire: number;
    total: number;
  }[];
  montantHT: number;
  tva: number;
  montantTTC: number;
  paiement: {
    reference?: string;
    status: string; // "Payé" | "En attente"
    methode?: string;
  };
}

// ─── Styles ───────────────────────────────────────────────
const colors = {
  navy: "#0A1628",
  blue: "#2563EB",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  border: "#E5E7EB",
  text: "#111827",
  white: "#FFFFFF",
  green: "#059669",
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
  factureBadge: {
    backgroundColor: colors.blue,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  factureBadgeText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 11, letterSpacing: 1 },

  // ── Tricolore bar ──
  tricolore: { flexDirection: "row", height: 4 },
  triBlue: { flex: 1, backgroundColor: "#002395" },
  triWhite: { flex: 1, backgroundColor: colors.white },
  triRed: { flex: 1, backgroundColor: "#ED2939" },

  // ── Body ──
  body: { paddingHorizontal: 40, paddingVertical: 24 },

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

  // ── Table ──
  table: {
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    marginBottom: 14,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.navy,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tableHeaderCell: {
    color: colors.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottom: `1px solid ${colors.border}`,
  },
  tableCell: {
    fontSize: 9,
    color: colors.text,
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "center" },
  colPrix: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },

  // ── Totals ──
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 14,
  },
  totalsBox: {
    width: 220,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  totalLabel: { fontSize: 9, color: colors.gray },
  totalValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.text },
  totalTTCRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.blue,
  },
  totalTTCLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: colors.white },
  totalTTCValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: colors.white },

  // ── Payment info ──
  paymentBox: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    border: `1px solid ${colors.border}`,
  },
  paymentTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase", letterSpacing: 0.8, color: colors.blue, marginBottom: 8 },
  paymentRow: { flexDirection: "row", marginBottom: 4 },
  paymentLabel: { width: 140, color: colors.gray, fontSize: 9 },
  paymentValue: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: colors.text },
  statusPaid: { color: colors.green },
  statusPending: { color: "#D97706" },

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

  // ── Mentions légales ──
  legalBox: {
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  legalTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, color: colors.gray, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  legalText: { color: colors.gray, fontSize: 7, lineHeight: 1.5 },
});

// ─── Helpers ──────────────────────────────────────────────
function formatEuro(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";
}

// ─── Component ────────────────────────────────────────────
export function Facture({ data }: { data: FactureData }) {
  const { numero, dateEmission, dateEcheance, client, lignes, montantHT, tva, montantTTC, paiement } = data;
  const isPaid = paiement.status === "Payé";

  return (
    <Document
      title={`Facture ${numero} — BYS Formation`}
      author="BYS Formation"
      subject={`Facture ${numero}`}
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
          <View style={styles.factureBadge}>
            <Text style={styles.factureBadgeText}>FACTURE</Text>
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
          {/* Reference bar */}
          <View style={styles.refBar}>
            <View>
              <Text style={styles.refLabel}>Numéro de facture</Text>
              <Text style={styles.refValue}>{numero}</Text>
            </View>
            <View>
              <Text style={styles.refLabel}>Date d&apos;émission</Text>
              <Text style={{ ...styles.refValue, textAlign: "right" }}>{dateEmission}</Text>
            </View>
            <View>
              <Text style={styles.refLabel}>Date d&apos;échéance</Text>
              <Text style={{ ...styles.refValue, textAlign: "right" }}>{dateEcheance}</Text>
            </View>
          </View>

          {/* Grid: Émetteur + Client */}
          <View style={styles.grid}>
            {/* Émetteur */}
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>Émetteur</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Raison sociale</Text>
                <Text style={styles.rowValue}>BYS Formation</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Adresse</Text>
                <Text style={styles.rowValue}>Bât. 7, 9 Chaussée Jules César{"\n"}95520 Osny</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>SIRET</Text>
                <Text style={styles.rowValue}>908 058 092 00028</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>N° TVA</Text>
                <Text style={styles.rowValue}>FR 32 908058092</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>bysforma95@gmail.com</Text>
              </View>
            </View>

            {/* Client */}
            <View style={[styles.card, styles.col]}>
              <Text style={styles.cardTitle}>Client</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Nom</Text>
                <Text style={styles.rowValue}>{client.prenom} {client.nom}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{client.email}</Text>
              </View>
              {client.adresse && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Adresse</Text>
                  <Text style={styles.rowValue}>
                    {client.adresse}
                    {client.codePostal || client.ville
                      ? `\n${client.codePostal ?? ""} ${client.ville ?? ""}`
                      : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Table des prestations */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrix]}>Prix unitaire HT</Text>
              <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total HT</Text>
            </View>
            {lignes.map((ligne, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colDesc]}>{ligne.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{ligne.quantite}</Text>
                <Text style={[styles.tableCell, styles.colPrix]}>{formatEuro(ligne.prixUnitaire)}</Text>
                <Text style={[styles.tableCell, styles.colTotal]}>{formatEuro(ligne.total)}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sous-total HT</Text>
                <Text style={styles.totalValue}>{formatEuro(montantHT)}</Text>
              </View>
              <View style={[styles.totalRow, { borderBottom: `1px solid ${colors.border}` }]}>
                <Text style={styles.totalLabel}>TVA (20%)</Text>
                <Text style={styles.totalValue}>{formatEuro(tva)}</Text>
              </View>
              <View style={styles.totalTTCRow}>
                <Text style={styles.totalTTCLabel}>Total TTC</Text>
                <Text style={styles.totalTTCValue}>{formatEuro(montantTTC)}</Text>
              </View>
            </View>
          </View>

          {/* Payment info */}
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTitle}>Informations de paiement</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Statut</Text>
              <Text style={[styles.paymentValue, isPaid ? styles.statusPaid : styles.statusPending]}>
                {paiement.status}
              </Text>
            </View>
            {paiement.reference && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Référence Stripe</Text>
                <Text style={styles.paymentValue}>{paiement.reference}</Text>
              </View>
            )}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Méthode de paiement</Text>
              <Text style={styles.paymentValue}>{paiement.methode ?? "Carte bancaire (Stripe)"}</Text>
            </View>
          </View>

          {/* Mentions légales */}
          <View style={styles.legalBox}>
            <Text style={styles.legalTitle}>Mentions légales</Text>
            <Text style={styles.legalText}>
              En cas de retard de paiement, une pénalité de 3 fois le taux d&apos;intérêt légal sera appliquée, conformément à l&apos;article L.441-10 du Code de commerce.
              {"\n"}Une indemnité forfaitaire de 40 € pour frais de recouvrement sera due en cas de retard de paiement (art. D.441-5 du Code de commerce).
              {"\n"}Pas d&apos;escompte pour paiement anticipé.
              {"\n"}Conditions de paiement : paiement à réception par carte bancaire via Stripe.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>BYS Formation — bysforma95@gmail.com</Text>
          <Text style={styles.footerText}>Bât. 7, 9 Chaussée Jules César, 95520 Osny</Text>
          <Text style={styles.footerText}>SIRET : 908 058 092 00028</Text>
        </View>
        <View style={{ backgroundColor: colors.navy, paddingHorizontal: 40, paddingBottom: 10 }}>
          <Text style={styles.footerLegal}>
            BYS Formation — SIRET 908 058 092 00028 — TVA FR 32 908058092
            {"\n"}Organisme de formation enregistré — Bât. 7, 9 Chaussée Jules César, 95520 Osny
          </Text>
        </View>
      </Page>
    </Document>
  );
}
