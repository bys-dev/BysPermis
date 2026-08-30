/**
 * Générateur des modèles d'email BYS Permis.
 *
 * Même principe que `baseLayout` / `wrapInBrandedTemplate` côté SL Formations :
 * le contenu éditorial vit seul dans `contenus/`, l'habillage de marque est
 * appliqué au build. Une modification de la charte se fait à un seul endroit.
 *
 *   node prospection/modeles-emails/build.mjs
 *
 * Sortie : un fichier HTML prêt à coller par modèle + le README d'index.
 *
 * Le fichier généré est un FRAGMENT (pas de <html>/<head>) : le module
 * Campagnes l'injecte dans `wrapCampaignHtml` (src/lib/prospects/template.ts),
 * qui ajoute lui-même les mentions légales et le lien de désinscription.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const CONTENUS = join(ICI, "contenus");

// ─── Charte ──────────────────────────────────────────────
// Palette validée : navy + bleu + blanc + gris. Aucune autre teinte.
export const C = {
  navy: "#0E1A38", // fond bandeau (nuance sombre du logo)
  navyClair: "#1B2E58", // nuance médiane du logo
  bleu: "#2563EB", // couleur d'action (boutons, filets, liens)
  bleuPale: "#93B4E8", // texte secondaire sur navy
  texte: "#23303F",
  texteDoux: "#64748B",
  pied: "#6A7686",
  piedDoux: "#A2ABB8",
  bordure: "#E2E8F0",
  fondDoux: "#F8FAFC",
  fondBleu: "#EFF6FF",
  bordureBleue: "#DBEAFE",
};

const POLICE = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Identité affichée en pied de mail (source : /mentions-legales). */
const SOCIETE = {
  nom: "BYS PERMIS",
  forme: "SAS au capital de 100 €",
  adresse: "33 rue de la Chaussée d'Antin, 75009 Paris",
  email: "contact@byspermis.fr",
  site: "byspermis.fr",
  rcs: "Paris 107 056 327",
};

/**
 * Habillage de marque.
 * `variante: "complet"` → bandeau navy plein (annonces, promos, grand public).
 * `variante: "sobre"`   → en-tête discret sur fond blanc, meilleure
 *                         délivrabilité pour le démarchage à froid.
 */
export function habiller({ contenu, preheader, variante = "complet" }) {
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:transparent;font-size:1px;line-height:1px">${preheader}</div>\n`
    : "";

  const enTete =
    variante === "sobre"
      ? `    <td align="left" style="background:#ffffff;padding:24px 32px 18px;border:1px solid ${C.bordure};border-bottom:none;border-radius:14px 14px 0 0">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle" style="padding-right:11px">
            <img src="https://byspermis.fr/colored-logo.png" width="32" height="32" alt="" style="display:block;border:0" />
          </td>
          <td valign="middle" align="left">
            <div style="font-size:16px;font-weight:bold;color:${C.navy};letter-spacing:1.6px;line-height:1.15">BYS PERMIS</div>
            <div style="font-size:10px;color:${C.texteDoux};letter-spacing:1px;padding-top:3px">STAGES DE RÉCUPÉRATION DE POINTS</div>
          </td>
        </tr>
      </table>
    </td>`
      : `    <td align="center" bgcolor="${C.navy}" style="background:${C.navy};padding:26px 24px 22px;border-radius:14px 14px 0 0;border-bottom:3px solid ${C.bleu};text-align:center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto">
        <tr>
          <td bgcolor="#FFFFFF" align="center" valign="middle" width="46" style="background:#ffffff;border-radius:10px;width:46px;height:46px;padding:8px;text-align:center">
            <img src="https://byspermis.fr/colored-logo.png" width="30" height="30" alt="BYS" style="display:block;border:0;margin:0 auto" />
          </td>
          <td align="left" style="padding-left:12px;text-align:left">
            <div style="font-size:19px;font-weight:bold;color:#ffffff;letter-spacing:2px;line-height:1.15">BYS PERMIS</div>
            <div style="font-size:10px;color:${C.bleuPale};letter-spacing:1.2px;padding-top:4px">STAGES DE RÉCUPÉRATION DE POINTS</div>
          </td>
        </tr>
      </table>
    </td>`;

  return `${preheaderHtml}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${POLICE}">
  <tr>
${enTete}
  </tr>
  <tr>
    <td style="background:#ffffff;padding:${variante === "sobre" ? "6px 32px 30px" : "34px 32px 30px"};border-left:1px solid ${C.bordure};border-right:1px solid ${C.bordure};font-size:15px;line-height:1.65;color:${C.texte}">
${contenu.trimEnd()}
    </td>
  </tr>
  <tr>
    <td style="height:3px;background:${C.bleu};font-size:0;line-height:3px">&nbsp;</td>
  </tr>
  <tr>
    <td align="center" style="background:${C.fondDoux};padding:22px 24px;border-radius:0 0 14px 14px;border:1px solid ${C.bordure};border-top:none;text-align:center">
      <p style="margin:0;font-size:11px;line-height:1.65;color:${C.pied}">
        <strong style="color:${C.navy};letter-spacing:.3px">${SOCIETE.nom}</strong> — ${SOCIETE.forme} · ${SOCIETE.adresse}<br/>
        <a href="mailto:${SOCIETE.email}" style="color:${C.pied};text-decoration:none">${SOCIETE.email}</a> · <a href="https://${SOCIETE.site}" style="color:${C.pied};text-decoration:none">${SOCIETE.site}</a><br/>
        <span style="color:${C.piedDoux}">RCS ${SOCIETE.rcs}</span>
      </p>
    </td>
  </tr>
</table>`;
}

// ─── Catalogue ───────────────────────────────────────────
// `canal` : "campagnes" = envoyable tel quel depuis /admin/campagnes
//           (l'audience est le fichier prospects = centres agréés).
//           "autre" = destiné aux stagiaires : le module ne sait pas les
//           cibler, à envoyer via Resend ou manuellement.

export const CATALOGUE = [
  {
    slug: "01-prospection-premier-contact",
    nom: "Premier contact",
    famille: "Prospection centres",
    canal: "campagnes",
    variante: "sobre",
    objets: [
      "{{nom}} — vos places libres visibles à {{ville|votre secteur}}",
      "Des stagiaires en plus pour {{nom}} ?",
    ],
    preheader: "Inscription gratuite, commission uniquement sur les réservations confirmées.",
    ciblage: "Statuts : Nouveau + À contacter · « jamais contactés » coché",
    quand: "Premier email de la séquence.",
  },
  {
    slug: "02-prospection-relance-courte",
    nom: "Relance courte",
    famille: "Prospection centres",
    canal: "campagnes",
    variante: "sobre",
    objets: ["Re : {{nom}} — vos places libres", "Une minute pour {{nom}} ?"],
    preheader: "Zéro frais fixe, zéro engagement — une commission seulement si un stagiaire réserve.",
    ciblage: "Statut : Contacté · exclure la campagne « Premier contact » pour les répondeurs",
    quand: "J+5 à J+7 après le premier contact.",
  },
  {
    slug: "03-prospection-objections",
    nom: "Réponse aux objections",
    famille: "Prospection centres",
    canal: "campagnes",
    variante: "sobre",
    objets: [
      "« Et si ça me prend des inscriptions que j'aurais eues quand même ? »",
      "Les 4 questions que posent les centres avant de se lancer",
    ],
    preheader: "Les 4 questions que nous posent les centres agréés avant de se lancer.",
    ciblage: "Statuts : Contacté + Relancé",
    quand: "J+12 — relance à valeur ajoutée, remplace une relance « molle ».",
  },
  {
    slug: "04-prospection-derniere-relance",
    nom: "Dernière relance (soft close)",
    famille: "Prospection centres",
    canal: "campagnes",
    variante: "sobre",
    objets: ["Je referme le dossier {{nom}} ?", "Dernier message de ma part"],
    preheader: "Dernier message de ma part — l'offre reste ouverte si vous changez d'avis.",
    ciblage: "Statut : Relancé",
    quand: "J+15 après la dernière relance. Génère souvent le meilleur taux de réponse.",
  },
  {
    slug: "05-prospection-offre-lancement",
    nom: "Offre de lancement 0 %",
    famille: "Prospection centres",
    canal: "campagnes",
    variante: "complet",
    objets: [
      "{{nom}} : 0 % de commission sur vos premières sessions",
      "Offre de lancement pour les centres du {{departement|secteur}}",
    ],
    preheader: "0 % de commission sur vos premières sessions — offre de lancement réservée aux centres agréés.",
    ciblage: "Statuts : Contacté + Relancé + Intéressé (jamais en premier contact)",
    quand: "Quand la séquence classique n'a rien donné, ou pour ouvrir un nouveau département.",
    aCompleter: ["nombre de sessions offertes", "date limite de l'offre"],
  },
  {
    slug: "06-prospection-invitation-echange",
    nom: "Invitation à un échange de 15 min",
    famille: "Prospection centres",
    canal: "campagnes",
    variante: "sobre",
    objets: ["15 minutes pour voir si on peut remplir vos sessions ?", "{{nom}} — un créneau cette semaine ?"],
    preheader: "15 minutes au téléphone pour voir si la plateforme peut remplir vos sessions.",
    ciblage: "Statuts : Contacté + Intéressé",
    quand: "Sur les prospects qui ont ouvert sans répondre, ou après un appel manqué.",
    aCompleter: ["les 3 créneaux proposés (ne jamais laisser une date passée)"],
  },
  {
    slug: "07-prospection-pic-saisonnier",
    nom: "Pic saisonnier / remplissage",
    famille: "Prospection centres",
    canal: "campagnes",
    variante: "complet",
    objets: [
      "Vos dates sont-elles visibles là où les conducteurs cherchent ?",
      "Rentrée : la demande de stages repart",
    ],
    preheader: "Vos sessions sont-elles visibles là où les conducteurs cherchent une date ?",
    ciblage: "Tous statuts contactables, hors Intéressé (qui reçoivent l'offre 05)",
    quand: "Rentrée de septembre, janvier, avant les grands départs.",
  },
  {
    slug: "08-partenaire-bienvenue",
    nom: "Bienvenue & activation",
    famille: "Partenaires",
    canal: "campagnes",
    variante: "complet",
    objets: ["Bienvenue sur BYS Permis, {{nom}}", "{{nom}} : 3 étapes avant votre première réservation"],
    preheader: "3 étapes pour publier votre première session et recevoir vos premières réservations.",
    ciblage: "Statut : Intéressé / Inscrit",
    quand: "Dès la validation du dossier partenaire.",
  },
  {
    slug: "09-partenaire-reactivation",
    nom: "Réactivation (aucune session publiée)",
    famille: "Partenaires",
    canal: "campagnes",
    variante: "sobre",
    objets: ["{{nom}} : vos places ne sont pas encore visibles", "Votre compte est prêt, vos dates manquent"],
    preheader: "Votre compte est actif mais aucune session n'est publiée — 2 minutes suffisent.",
    ciblage: "Statut : Inscrit, sans session publiée (à filtrer à la main pour l'instant)",
    quand: "15 jours après l'inscription si aucune session n'est en ligne.",
  },
  {
    slug: "10-partenaire-annonce-nouveaute",
    nom: "Annonce d'une nouveauté",
    famille: "Partenaires",
    canal: "campagnes",
    variante: "complet",
    objets: ["Nouveau sur BYS Permis : [[nom de la nouveauté]]", "Une nouveauté qui va vous faire gagner du temps"],
    preheader: "Une nouveauté disponible dès aujourd'hui dans votre espace centre.",
    ciblage: "Statuts : Intéressé + Inscrit",
    quand: "À chaque livraison de fonctionnalité visible côté centre.",
    aCompleter: ["nom de la nouveauté", "les 3 bénéfices", "le lien de destination"],
  },
  {
    slug: "11-grand-public-offre-promo",
    nom: "Offre promotionnelle (code promo)",
    famille: "Grand public",
    canal: "autre",
    variante: "complet",
    objets: ["[[-XX €]] sur votre stage de récupération de points", "Votre code [[CODE]] est actif jusqu'au [[date]]"],
    preheader: "Votre code promo est actif — 4 points récupérés en 2 jours.",
    ciblage: "Liste opt-in stagiaires (hors module Campagnes)",
    quand: "Opérations commerciales, périodes creuses.",
    aCompleter: ["le code", "le montant de la remise", "la date de fin"],
  },
  {
    slug: "12-grand-public-reservation-non-finalisee",
    nom: "Réservation non finalisée",
    famille: "Grand public",
    canal: "autre",
    variante: "complet",
    objets: ["Votre place n'est pas encore réservée", "Il reste des places sur votre stage du [[date]]"],
    preheader: "Votre place n'est pas encore confirmée — le stage peut afficher complet.",
    ciblage: "Réservations en statut PENDING depuis plus de 2 h",
    quand: "Relance automatique H+2, puis J+1.",
    aCompleter: ["les infos de session (date, ville, prix)"],
  },
  {
    slug: "13-grand-public-newsletter",
    nom: "Newsletter / actualité permis à points",
    famille: "Grand public",
    canal: "autre",
    variante: "complet",
    objets: ["Permis à points : ce qu'il faut savoir ce mois-ci", "Combien de points vous reste-t-il vraiment ?"],
    preheader: "L'essentiel du mois sur le permis à points, et les prochaines sessions près de chez vous.",
    ciblage: "Liste opt-in stagiaires + visiteurs inscrits",
    quand: "Mensuel.",
    aCompleter: ["l'article mis en avant", "les 3 sessions listées"],
  },
  {
    slug: "14-grand-public-demande-avis",
    nom: "Demande d'avis après stage",
    famille: "Grand public",
    canal: "autre",
    variante: "sobre",
    objets: ["Comment s'est passé votre stage ?", "2 minutes pour aider les prochains stagiaires"],
    preheader: "Votre avis aide les prochains conducteurs à choisir leur centre.",
    ciblage: "Stagiaires dont le stage est terminé depuis 48 h",
    quand: "J+2 après la fin du stage.",
    aCompleter: ["le lien du formulaire d'avis"],
  },
];

// ─── Génération ──────────────────────────────────────────

function genererModeles() {
  const dispo = new Set(
    readdirSync(CONTENUS)
      .filter((f) => f.endsWith(".html"))
      .map((f) => f.replace(/\.html$/, "")),
  );
  const manquants = [];

  for (const modele of CATALOGUE) {
    if (!dispo.has(modele.slug)) {
      manquants.push(modele.slug);
      continue;
    }
    const contenu = readFileSync(join(CONTENUS, `${modele.slug}.html`), "utf8");
    const html =
      `<!-- BYS Permis · ${modele.nom} · ${modele.famille}\n` +
      `     Objet suggéré : ${modele.objets[0]}\n` +
      `     Généré par prospection/modeles-emails/build.mjs — éditer contenus/${modele.slug}.html -->\n` +
      habiller({ contenu, preheader: modele.preheader, variante: modele.variante }) +
      "\n";
    writeFileSync(join(ICI, `${modele.slug}.html`), html, "utf8");
  }

  return manquants;
}

function genererReadme() {
  const familles = [...new Set(CATALOGUE.map((m) => m.famille))];

  const bloc = (m) => {
    const objets = m.objets.map((o) => `  - \`${o}\``).join("\n");
    const aCompleter = m.aCompleter?.length
      ? `\n- **À compléter avant envoi** : ${m.aCompleter.join(" · ")} — repérables aux \`[[doubles crochets]]\`.`
      : "";
    return `### ${m.nom}

[\`${m.slug}.html\`](./${m.slug}.html) · habillage **${m.variante}** · ${
      m.canal === "campagnes" ? "envoyable depuis **/admin/campagnes**" : "**hors module Campagnes**"
    }

- **Objets à tester** :
${objets}
- **Pré-en-tête** : ${m.preheader}
- **Ciblage** : ${m.ciblage}
- **Quand l'envoyer** : ${m.quand}${aCompleter}
`;
  };

  const sections = familles
    .map((f) => `## ${f}\n\n${CATALOGUE.filter((m) => m.famille === f).map(bloc).join("\n")}`)
    .join("---\n\n");

  return `# Modèles d'email — BYS Permis

Bibliothèque de modèles prêts à coller dans le champ **Contenu (HTML)** de
l'éditeur de campagnes (\`/admin/campagnes\`).

Habillage repris de la mécanique SL Formations (\`baseLayout\` / \`wrapInBrandedTemplate\`),
transposé à la charte BYS : navy, bleu, blanc, gris.

> Fichiers générés par \`build.mjs\`. Pour modifier un texte : éditer
> \`contenus/<slug>.html\` puis relancer \`node prospection/modeles-emails/build.mjs\`.
> Pour modifier la charte (couleurs, en-tête, pied) : éditer \`habiller()\` dans
> \`build.mjs\` — les ${CATALOGUE.length} modèles sont régénérés d'un coup.

---

## Mode d'emploi

1. Ouvrir le fichier \`.html\` du modèle, tout sélectionner, copier.
2. Dans **Campagnes → Nouvelle campagne**, coller dans **Contenu (HTML)**.
3. Recopier l'un des **objets** proposés dans le champ *Objet de l'email*.
4. Régler le **ciblage**, puis **Aperçu** et **Test** sur votre adresse avant de créer.

### Ce que la plateforme ajoute automatiquement

Le module enveloppe votre HTML avec \`wrapCampaignHtml()\`
(\`src/lib/prospects/template.ts\`), qui ajoute sous le message l'identité de
l'expéditeur et le **lien de désinscription** — obligatoire pour le démarchage.
Ne le recopiez pas dans le contenu : il serait en double.

### Variables disponibles

Seules ces 15 clés sont acceptées ; toute autre **bloque l'enregistrement** de la
campagne (\`validateCampaignTemplate\`) :

\`{{nom}}\` \`{{raisonSociale}}\` \`{{ville}}\` \`{{codePostal}}\` \`{{departement}}\`
\`{{contactNom}}\` \`{{contactPrenom}}\` \`{{contactFonction}}\` \`{{salutation}}\`
\`{{telephone}}\` \`{{siteWeb}}\` \`{{agrementNumber}}\` \`{{lienInscription}}\`
\`{{lienSite}}\` \`{{lienDesinscription}}\`

**Toujours prévoir un repli** avec la syntaxe \`{{ville|votre secteur}}\` : le
fichier de prospection est incomplet, et une variable vide sans repli laisse un
trou dans la phrase.

### Deux habillages

| Habillage | Ce que c'est | Pour quoi |
|---|---|---|
| **sobre** | En-tête discret sur fond blanc, pas de bandeau plein | Démarchage à froid. Un mail visuellement « marketing » part plus souvent en spam et ressemble moins à un email écrit à la main. |
| **complet** | Bandeau navy pleine largeur + logo | Destinataires qui vous connaissent déjà : partenaires, annonces, offres, grand public. |

---

## Règles d'envoi

- **Volume** : 30 à 50 emails par jour maximum sur du froid. Le module envoie par
  lots de 100 (\`BATCH_SIZE\`), c'est le ciblage qui doit rester petit.
- **Expéditeur** : une adresse nominative (\`sebastien@byspermis.fr\`) répond mieux
  qu'un \`contact@\`. Renseigner systématiquement l'**adresse de réponse**.
- **Un seul lien cliquable** sur les modèles à froid : plusieurs liens et images
  dégradent la délivrabilité.
- **Jamais deux campagnes à froid le même jour** vers le même prospect : utiliser
  « exclure les campagnes » dans le ciblage.
- **Chiffres** : ne publier que des chiffres réels. Aucun modèle de cette
  bibliothèque n'affiche de statistique inventée.
- **Cadre légal (B2B)** : la prospection vers une adresse professionnelle est
  autorisée sans consentement préalable (art. L34-5 CPCE) à condition d'identifier
  l'expéditeur et d'offrir un moyen simple de refus — les deux sont gérés par
  l'habillage automatique.
- **Images** : les modèles n'utilisent qu'une seule image, le logo servi par
  \`https://byspermis.fr/colored-logo.png\`. Vérifier que cette URL répond avant la
  première campagne — sinon le texte de remplacement prend le relais.

---

${sections}---

## Blocs réutilisables

Pour composer un modèle sur mesure, voir [\`kit-blocs.html\`](./kit-blocs.html) :
bouton, encart bleu, carte grise, séparateur, comparatif deux colonnes, étapes
numérotées, ligne de statistiques, signature.
`;
}

// Exécution uniquement en appel direct : `build-apercu.mjs` importe ce module
// pour son CATALOGUE et son habillage, sans déclencher de réécriture.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const manquants = genererModeles();
  writeFileSync(join(ICI, "README.md"), genererReadme(), "utf8");

  console.log(`✔ ${CATALOGUE.length - manquants.length}/${CATALOGUE.length} modèles générés + README.md`);
  if (manquants.length) console.log(`⚠ contenus manquants : ${manquants.join(", ")}`);
}
