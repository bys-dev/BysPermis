import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ─── Styles ───────────────────────────────────────────────
const colors = {
  navy: "#0A1628",
  blue: "#2563EB",
  blueLight: "#EFF6FF",
  gray: "#6B7280",
  lightGray: "#F9FAFB",
  border: "#E5E7EB",
  text: "#111827",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: colors.text, backgroundColor: colors.white },

  // ── Header ──
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 40,
    paddingVertical: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoBox: {
    width: 38,
    height: 38,
    backgroundColor: colors.blue,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 13 },
  brandName: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 15 },
  brandTagline: { color: "#9CA3AF", fontSize: 8, marginTop: 1 },

  tricolore: { flexDirection: "row", height: 4 },
  triBlue: { flex: 1, backgroundColor: "#002395" },
  triWhite: { flex: 1, backgroundColor: colors.white },
  triRed: { flex: 1, backgroundColor: "#ED2939" },

  // ── Hero ──
  hero: { backgroundColor: colors.navy, paddingHorizontal: 40, paddingTop: 20, paddingBottom: 28 },
  heroTitle: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 20, lineHeight: 1.3 },
  heroAccent: { color: "#60A5FA" },
  heroSubtitle: { color: "#CBD5E1", fontSize: 9.5, marginTop: 10, lineHeight: 1.5, maxWidth: 420 },

  statsRow: { flexDirection: "row", marginTop: 20, gap: 10 },
  statBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  statValue: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 14 },
  statLabel: { color: "#9CA3AF", fontSize: 7, marginTop: 2, textAlign: "center" },

  // ── Body ──
  body: { paddingHorizontal: 40, paddingVertical: 22 },
  sectionLabel: { color: colors.blue, fontFamily: "Helvetica-Bold", fontSize: 8, letterSpacing: 0.5 },
  sectionTitle: { color: colors.navy, fontFamily: "Helvetica-Bold", fontSize: 15, marginTop: 4, marginBottom: 14 },

  benefitsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  benefitCard: {
    width: "48%",
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  benefitTitle: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: colors.navy, marginBottom: 4 },
  benefitText: { fontSize: 8.5, color: colors.gray, lineHeight: 1.4 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: colors.gray },

  // ── Steps ──
  stepsRow: { flexDirection: "row", gap: 14, marginBottom: 24 },
  stepCard: { flex: 1 },
  stepNum: { color: colors.blueLight === "#EFF6FF" ? "#BFDBFE" : colors.blue, fontFamily: "Helvetica-Bold", fontSize: 22, marginBottom: 4 },
  stepTitle: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: colors.navy, marginBottom: 4 },
  stepText: { fontSize: 8.5, color: colors.gray, lineHeight: 1.4 },

  // ── Pricing table ──
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden", marginBottom: 20 },
  tRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
  tRowLast: { flexDirection: "row" },
  tHeadCell: { flex: 1, backgroundColor: colors.navy, padding: 8 },
  tHeadLabelCell: { flex: 1.3, backgroundColor: colors.navy, padding: 8 },
  tHeadText: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 8.5, textAlign: "center" },
  tLabelCell: { flex: 1.3, padding: 8, backgroundColor: colors.lightGray },
  tCell: { flex: 1, padding: 8, alignItems: "center", justifyContent: "center" },
  tLabelText: { fontSize: 8.5, color: colors.text, fontFamily: "Helvetica-Bold" },
  tValueText: { fontSize: 8.5, color: colors.text, textAlign: "center" },

  // ── Reassurance ──
  reassuranceRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  reassuranceCard: { flex: 1, padding: 10 },
  reassuranceTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: colors.navy, marginBottom: 3 },
  reassuranceText: { fontSize: 8, color: colors.gray, lineHeight: 1.4 },

  // ── CTA ──
  ctaBox: {
    backgroundColor: colors.navy,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  ctaTitle: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 13, marginBottom: 6, textAlign: "center" },
  ctaText: { color: "#CBD5E1", fontSize: 8.5, marginBottom: 12, textAlign: "center", maxWidth: 380 },
  ctaRow: { flexDirection: "row", gap: 24 },
  ctaItemLabel: { color: "#9CA3AF", fontSize: 7 },
  ctaItemValue: { color: colors.white, fontFamily: "Helvetica-Bold", fontSize: 9.5, marginTop: 1 },
});

const benefits = [
  {
    title: "Des stagiaires qualifiés",
    text: "Nous captons la demande sur tout le territoire et l'orientons vers vos sessions : des inscriptions prêtes à payer, pas de simples contacts.",
  },
  {
    title: "Des sessions mieux remplies",
    text: "Vous publiez vos dates, nous les mettons en avant auprès des conducteurs qui cherchent un stage près de chez eux.",
  },
  {
    title: "Vous gardez la majorité",
    text: "Aucun frais d'inscription. Une commission claire, prélevée uniquement sur les réservations réellement confirmées.",
  },
  {
    title: "Une visibilité locale et SEO",
    text: "Votre centre apparaît sur nos pages ville et dans les résultats de recherche : une vitrine en ligne sans effort de votre côté.",
  },
  {
    title: "Zéro gestion administrative",
    text: "Convocations, attestations, émargement, encaissement : la plateforme automatise le suivi de vos stagiaires.",
  },
  {
    title: "Un pilotage en temps réel",
    text: "Un tableau de bord clair pour suivre réservations, remplissage et revenus, et ajuster vos dates à tout moment.",
  },
];

const steps = [
  { num: "01", title: "Vous déposez votre demande", text: "Formulaire en 2 minutes sur byspermis.fr/devenir-partenaire. Nous vérifions votre agrément préfectoral." },
  { num: "02", title: "Vous publiez vos sessions", text: "Une fois validé, vous créez vos dates de stage en quelques clics : elles sont immédiatement visibles." },
  { num: "03", title: "Vous encaissez, sereinement", text: "Les conducteurs réservent et paient en ligne. Vous êtes réglé automatiquement après chaque stage." },
];

const plans = [
  { nom: "Essentiel", prix: "49 €/mois", commission: "10 %", formations: "5" },
  { nom: "Premium", prix: "99 €/mois", commission: "7 %", formations: "20" },
  { nom: "Entreprise", prix: "199 €/mois", commission: "5 %", formations: "Illimité" },
];

const reassurance = [
  { title: "Uniquement des centres agréés", text: "Nous vérifions systématiquement l'agrément préfectoral de chaque centre partenaire." },
  { title: "Vos données protégées", text: "Conformité RGPD stricte : vos informations ne sont jamais revendues." },
  { title: "Un vrai partenariat", text: "Une équipe dédiée vous accompagne au démarrage et reste joignable ensuite." },
];

export function BrochurePartenaire() {
  return (
    <Document title="BYS Permis — Brochure centre partenaire" author="BYS Permis">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>BF</Text>
          </View>
          <View>
            <Text style={styles.brandName}>BYS Permis</Text>
            <Text style={styles.brandTagline}>Marketplace des stages de récupération de points</Text>
          </View>
        </View>
        <View style={styles.tricolore}>
          <View style={styles.triBlue} />
          <View style={styles.triWhite} />
          <View style={styles.triRed} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Remplissez vos stages de{"\n"}récupération de <Text style={styles.heroAccent}>points</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            BYS Permis connecte votre centre agréé aux conducteurs qui cherchent un stage près
            de chez eux. Vous gagnez en visibilité et en remplissage — nous nous occupons du reste.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0 €</Text>
              <Text style={styles.statLabel}>Frais d&apos;inscription</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>48h</Text>
              <Text style={styles.statLabel}>Pour être recontacté</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>Sans</Text>
              <Text style={styles.statLabel}>Engagement de durée</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Paiements sécurisés</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>POURQUOI PASSER PAR NOUS</Text>
          <Text style={styles.sectionTitle}>Ce que BYS Permis change pour votre centre</Text>

          <View style={styles.benefitsGrid}>
            {benefits.map((b) => (
              <View key={b.title} style={styles.benefitCard}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>BYS Permis — byspermis.fr</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>UN PARCOURS TRANSPARENT</Text>
          <Text style={styles.sectionTitle}>De la demande à votre premier stage rempli</Text>

          <View style={styles.stepsRow}>
            {steps.map((s) => (
              <View key={s.num} style={styles.stepCard}>
                <Text style={styles.stepNum}>{s.num}</Text>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepText}>{s.text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>NOS OFFRES</Text>
          <Text style={styles.sectionTitle}>Un abonnement simple, une commission dégressive</Text>

          <View style={styles.table}>
            <View style={styles.tRow}>
              <View style={styles.tHeadLabelCell}>
                <Text style={styles.tHeadText}> </Text>
              </View>
              {plans.map((p) => (
                <View key={p.nom} style={styles.tHeadCell}>
                  <Text style={styles.tHeadText}>{p.nom}</Text>
                </View>
              ))}
            </View>
            <View style={styles.tRow}>
              <View style={styles.tLabelCell}>
                <Text style={styles.tLabelText}>Abonnement mensuel</Text>
              </View>
              {plans.map((p) => (
                <View key={p.nom} style={styles.tCell}>
                  <Text style={styles.tValueText}>{p.prix}</Text>
                </View>
              ))}
            </View>
            <View style={styles.tRow}>
              <View style={styles.tLabelCell}>
                <Text style={styles.tLabelText}>Commission</Text>
              </View>
              {plans.map((p) => (
                <View key={p.nom} style={styles.tCell}>
                  <Text style={styles.tValueText}>{p.commission}</Text>
                </View>
              ))}
            </View>
            <View style={styles.tRowLast}>
              <View style={styles.tLabelCell}>
                <Text style={styles.tLabelText}>Formations max.</Text>
              </View>
              {plans.map((p) => (
                <View key={p.nom} style={styles.tCell}>
                  <Text style={styles.tValueText}>{p.formations}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.sectionLabel}>EN TOUTE CONFIANCE</Text>
          <Text style={styles.sectionTitle}>Un partenaire sérieux et exigeant</Text>

          <View style={styles.reassuranceRow}>
            {reassurance.map((r) => (
              <View key={r.title} style={styles.reassuranceCard}>
                <Text style={styles.reassuranceTitle}>{r.title}</Text>
                <Text style={styles.reassuranceText}>{r.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ctaBox}>
            <Text style={styles.ctaTitle}>Prêt à remplir vos prochaines sessions ?</Text>
            <Text style={styles.ctaText}>
              Déposez votre demande en 2 minutes : notre équipe partenariats vérifie votre agrément
              et revient vers vous sous 48h ouvrées avec une proposition adaptée à votre volume.
            </Text>
            <View style={styles.ctaRow}>
              <View>
                <Text style={styles.ctaItemLabel}>Site web</Text>
                <Text style={styles.ctaItemValue}>byspermis.fr/devenir-partenaire</Text>
              </View>
              <View>
                <Text style={styles.ctaItemLabel}>Email</Text>
                <Text style={styles.ctaItemValue}>contact@byspermis.fr</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>BYS Permis — byspermis.fr</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
