/**
 * Génère `apercu.html` : la planche de contact des modèles d'email.
 *
 *   node prospection/modeles-emails/build-apercu.mjs
 *
 * La page rend chaque modèle tel qu'il arrivera vraiment — pour les modèles
 * envoyés par le module Campagnes, l'habillage `wrapCampaignHtml()` (mentions
 * légales + désinscription) est reproduit à l'identique autour du contenu.
 *
 * Le fichier produit s'ouvre directement dans un navigateur et se publie tel
 * quel en Artifact (pas de <html>/<head>/<body> : ils sont ajoutés au publish).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOGUE } from "./build.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));

// ─── Données injectées dans la page ──────────────────────

/** Valeurs d'exemple : celles du catalogue de variables de l'éditeur. */
const EXEMPLE = {
  nom: "Centre Auto Formation",
  raisonSociale: "AUTO FORMATION SARL",
  ville: "Cergy",
  codePostal: "95000",
  departement: "95",
  contactNom: "Dupont",
  contactPrenom: "Marc",
  contactFonction: "Gérant",
  salutation: "Bonjour Marc Dupont,",
  telephone: "01 23 45 67 89",
  siteWeb: "https://exemple.fr",
  agrementNumber: "R 21 095 0001 0",
  lienInscription: "https://byspermis.fr/devenir-partenaire",
  lienSite: "https://byspermis.fr",
  lienDesinscription: "https://byspermis.fr/desabonnement/apercu",
};

/** Le logo est servi depuis byspermis.fr ; en aperçu on l'inline (CSP). */
const LOGO_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 316 316">` +
  `<path d="M150 0 L0 150 L150 300 L181 269 L62 150 L181 31 Z" fill="#1B2E58"/>` +
  `<path d="M225 75 L300 150 L225 225 L150 150 Z" fill="#1B2E58"/></svg>`;
const LOGO_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;

const donnees = {
  logo: LOGO_DATA_URI,
  exemple: EXEMPLE,
  modeles: CATALOGUE.map((m) => ({
    slug: m.slug,
    nom: m.nom,
    famille: m.famille,
    canal: m.canal,
    variante: m.variante,
    objets: m.objets,
    preheader: m.preheader,
    ciblage: m.ciblage,
    quand: m.quand,
    aCompleter: m.aCompleter ?? [],
    html: readFileSync(join(ICI, `${m.slug}.html`), "utf8"),
  })),
};

const FAMILLES = [...new Set(CATALOGUE.map((m) => m.famille))];

/** Séquence de démarchage : l'ordre porte une vraie information (le délai). */
const CADENCE = [
  { slug: "01-prospection-premier-contact", jour: "J0", nom: "Premier contact" },
  { slug: "02-prospection-relance-courte", jour: "J+6", nom: "Relance courte" },
  { slug: "03-prospection-objections", jour: "J+12", nom: "Objections" },
  { slug: "04-prospection-derniere-relance", jour: "J+27", nom: "Soft close" },
];

const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ─── Page ────────────────────────────────────────────────

const page = `<title>Modèles d'email BYS Permis</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;600;700&display=swap">

<style>
  /* Palette : reprise des tokens du projet (brand-accent #3B82F6, navy du
     logo). Le gris est biaisé vers le bleu, jamais un gris neutre. */
  :root {
    --ground: #F4F6FA;
    --surface: #FFFFFF;
    --surface-2: #EEF2F9;
    --ink: #111827;
    --ink-soft: #5A6478;
    --ink-faint: #8A94AA;
    --line: #E2E8F0;
    --line-strong: #CBD5E4;
    --blue: #2563EB;
    --blue-soft: #EFF6FF;
    --navy: #0E1A38;
    --rail: 232px;
    --radius: 12px;
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #0B1424;
      --surface: #111E38;
      --surface-2: #162644;
      --ink: #E7EDF8;
      --ink-soft: #9AA7C2;
      --ink-faint: #6E7C9B;
      --line: #22314F;
      --line-strong: #2F416A;
      --blue: #6BA1FA;
      --blue-soft: #16264A;
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --ground: #0B1424;
    --surface: #111E38;
    --surface-2: #162644;
    --ink: #E7EDF8;
    --ink-soft: #9AA7C2;
    --ink-faint: #6E7C9B;
    --line: #22314F;
    --line-strong: #2F416A;
    --blue: #6BA1FA;
    --blue-soft: #16264A;
    color-scheme: dark;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  .wrap {
    max-width: 1180px;
    margin: 0 auto;
    padding: 40px 24px 96px;
    display: grid;
    grid-template-columns: var(--rail) minmax(0, 1fr);
    gap: 40px;
    align-items: start;
  }

  /* ── Masthead ── */
  .masthead { grid-column: 1 / -1; border-bottom: 1px solid var(--line); padding-bottom: 26px; }
  .eyebrow {
    font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
    color: var(--blue); font-weight: 600; margin: 0 0 10px;
  }
  h1 {
    font-family: Outfit, Inter, sans-serif; font-weight: 700;
    font-size: clamp(28px, 4vw, 40px); line-height: 1.1; letter-spacing: -.02em;
    margin: 0 0 12px; text-wrap: balance;
  }
  .lede { margin: 0; max-width: 62ch; color: var(--ink-soft); }
  .lede code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; color: var(--ink); }

  /* ── Rail ── */
  .rail { position: sticky; top: 24px; }
  .rail-group + .rail-group { margin-top: 22px; }
  .rail-title {
    font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-faint); font-weight: 600; margin: 0 0 8px;
  }
  .rail a {
    display: flex; gap: 9px; align-items: baseline;
    padding: 5px 8px; margin-left: -8px; border-radius: 7px;
    color: var(--ink-soft); text-decoration: none; font-size: 13.5px; line-height: 1.35;
  }
  .rail a:hover { background: var(--surface); color: var(--ink); }
  .rail a .n {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px; color: var(--ink-faint); font-variant-numeric: tabular-nums;
  }
  .rail-actions { margin-top: 26px; padding-top: 20px; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 8px; }

  button {
    font: inherit; font-size: 13px; cursor: pointer;
    border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink);
    border-radius: 8px; padding: 7px 12px; text-align: left;
  }
  button:hover { border-color: var(--blue); color: var(--blue); }
  button:focus-visible, a:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
  button.on { background: var(--blue); border-color: var(--blue); color: #fff; }

  /* ── Cadence ── */
  .cadence {
    display: flex; flex-wrap: wrap; gap: 0; align-items: stretch;
    background: var(--surface); border: 1px solid var(--line);
    border-radius: var(--radius); overflow: hidden; margin: 0 0 36px;
  }
  .cadence-lbl {
    padding: 14px 18px; font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
    color: var(--ink-faint); font-weight: 600; border-right: 1px solid var(--line);
    display: flex; align-items: center;
  }
  .cadence-step { padding: 12px 18px; border-right: 1px solid var(--line); flex: 1 1 130px; }
  .cadence-step:last-child { border-right: 0; }
  .cadence-step .j {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px; color: var(--blue); font-variant-numeric: tabular-nums;
  }
  .cadence-step a { display: block; color: var(--ink); text-decoration: none; font-size: 14px; font-weight: 500; }
  .cadence-step a:hover { color: var(--blue); }

  /* ── Fiche ── */
  .card {
    background: var(--surface); border: 1px solid var(--line);
    border-radius: var(--radius); margin: 0 0 28px; scroll-margin-top: 20px; overflow: hidden;
  }
  .card-head { padding: 22px 26px 18px; border-bottom: 1px solid var(--line); }
  .card-titleline { display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap; }
  .card-n {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px; color: var(--ink-faint); font-variant-numeric: tabular-nums;
  }
  .card h2 {
    font-family: Outfit, Inter, sans-serif; font-weight: 600; font-size: 21px;
    letter-spacing: -.01em; margin: 0; line-height: 1.25;
  }
  .badges { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
  .badge {
    font-size: 11px; font-weight: 500; letter-spacing: .02em;
    padding: 3px 9px; border-radius: 999px;
    border: 1px solid var(--line-strong); color: var(--ink-soft);
  }
  .badge.blue { border-color: var(--blue); color: var(--blue); background: var(--blue-soft); }

  dl { margin: 0; padding: 20px 26px; display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 3px 20px; font-size: 14px; }
  dt { color: var(--ink-faint); font-size: 12px; letter-spacing: .04em; text-transform: uppercase; padding-top: 3px; }
  dd { margin: 0 0 10px; }
  dl > dd:last-of-type { margin-bottom: 0; }

  .objet { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 7px; }
  .objet code {
    flex: 1; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px;
    background: var(--surface-2); border: 1px solid var(--line); border-radius: 6px;
    padding: 5px 9px; word-break: break-word; color: var(--ink);
  }
  .objet button { flex: 0 0 auto; padding: 5px 10px; font-size: 12px; }
  .rendu { font-size: 12.5px; color: var(--ink-faint); margin: 2px 0 0; }

  .todo { color: var(--blue); }

  /* ── Aperçu : papier blanc dans les deux thèmes, c'est ce que reçoit le
       destinataire. Choix assumé, pas un oubli de token. ── */
  .preview-head {
    display: flex; justify-content: space-between; align-items: center; gap: 14px;
    padding: 12px 26px; border-top: 1px solid var(--line); background: var(--surface);
    font-size: 12px; color: var(--ink-faint); flex-wrap: wrap;
  }
  .preview-actions { display: flex; gap: 8px; }
  .paper { background: #EDF0F5; padding: 30px 20px; border-top: 1px solid var(--line); }
  .paper[hidden] { display: none; }
  .sheet {
    max-width: 640px; margin: 0 auto; background: #ffffff;
    border-radius: 6px; padding: 26px 20px;
    box-shadow: 0 1px 2px rgba(14, 26, 56, .12), 0 8px 24px rgba(14, 26, 56, .08);
    overflow-x: auto;
  }
  .ph {
    background: #EFF6FF; outline: 1px dashed #93B4E8; border-radius: 3px;
    padding: 0 3px; color: #2563EB; font-style: normal;
  }

  details.src { border-top: 1px solid var(--line); }
  details.src summary {
    padding: 11px 26px; cursor: pointer; font-size: 12.5px; color: var(--ink-soft);
    list-style: none;
  }
  details.src summary::-webkit-details-marker { display: none; }
  details.src summary::before { content: "▸ "; color: var(--ink-faint); }
  details.src[open] summary::before { content: "▾ "; }
  details.src summary:hover { color: var(--blue); }
  details.src pre {
    margin: 0; padding: 0 26px 22px; overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px; line-height: 1.6; color: var(--ink-soft);
  }

  .section-head { margin: 46px 0 20px; }
  .section-head:first-of-type { margin-top: 0; }
  .section-head h3 {
    font-family: Outfit, Inter, sans-serif; font-weight: 600; font-size: 13px;
    letter-spacing: .14em; text-transform: uppercase; color: var(--ink-faint); margin: 0;
  }

  .notes { grid-column: 1 / -1; margin-top: 20px; padding-top: 30px; border-top: 1px solid var(--line); }
  .notes h3 { font-family: Outfit, Inter, sans-serif; font-size: 18px; margin: 0 0 14px; font-weight: 600; }
  .notes ul { margin: 0; padding-left: 20px; color: var(--ink-soft); max-width: 72ch; }
  .notes li { margin-bottom: 8px; }
  .notes code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; color: var(--ink); }

  .hidden { display: none !important; }

  @media (max-width: 900px) {
    .wrap { grid-template-columns: minmax(0, 1fr); gap: 28px; }
    .rail { position: static; }
    dl { grid-template-columns: minmax(0, 1fr); gap: 2px; }
    dt { padding-top: 12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
  }
</style>

<div class="wrap">
  <header class="masthead">
    <p class="eyebrow">BYS Permis · emailing</p>
    <h1>Modèles d'email</h1>
    <p class="lede">${CATALOGUE.length} modèles prêts à coller dans le champ <em>Contenu&nbsp;(HTML)</em> de <code>/admin/campagnes</code>. Chaque aperçu est le rendu réel&nbsp;: pour les modèles envoyés par le module, l'habillage <code>wrapCampaignHtml()</code> — mentions légales et lien de désinscription — est reproduit à l'identique. Les variables sont résolues avec un centre d'exemple&nbsp;; les <span class="ph">zones à compléter</span> restent surlignées.</p>
  </header>

  <nav class="rail" aria-label="Sommaire">
    ${FAMILLES.map(
      (f) => `<div class="rail-group">
      <p class="rail-title">${esc(f)}</p>
      ${CATALOGUE.filter((m) => m.famille === f)
        .map(
          (m) =>
            `<a href="#m-${m.slug}"><span class="n">${m.slug.slice(0, 2)}</span><span>${esc(m.nom)}</span></a>`,
        )
        .join("\n      ")}
    </div>`,
    ).join("\n    ")}
    <div class="rail-actions">
      <button type="button" data-filtre="tous" class="on">Tout afficher</button>
      ${FAMILLES.map((f) => `<button type="button" data-filtre="${esc(f)}">${esc(f)}</button>`).join("\n      ")}
      <button type="button" id="toggle-apercus">Replier les aperçus</button>
    </div>
  </nav>

  <main id="liste"></main>

  <section class="notes">
    <h3>Règles d'envoi</h3>
    <ul>
      <li><strong>Volume</strong> — 30 à 50 emails par jour maximum sur du démarchage à froid. Le module expédie par lots de 100&nbsp;; c'est le ciblage qui doit rester petit.</li>
      <li><strong>Expéditeur</strong> — une adresse nominative (<code>sebastien@byspermis.fr</code>) obtient plus de réponses qu'un <code>contact@</code>. Toujours renseigner l'adresse de réponse.</li>
      <li><strong>Variables</strong> — seules les 15 clés du catalogue sont acceptées&nbsp;; toute autre bloque l'enregistrement de la campagne. Prévoir un repli&nbsp;: <code>{{ville|votre secteur}}</code>.</li>
      <li><strong>Chiffres</strong> — aucun modèle n'affiche de statistique inventée. N'y mettre que des chiffres réellement mesurés.</li>
      <li><strong>Images</strong> — une seule, le logo servi par <code>byspermis.fr/colored-logo.png</code>. Vérifier que l'URL répond avant la première campagne&nbsp;; sinon le texte de remplacement prend le relais.</li>
      <li><strong>Cadre légal B2B</strong> — la prospection vers une adresse professionnelle est autorisée sans consentement préalable (art. L34-5 CPCE) à condition d'identifier l'expéditeur et d'offrir un refus simple. Les deux sont ajoutés automatiquement par l'habillage.</li>
    </ul>
  </section>
</div>

<script type="application/json" id="donnees">${json(donnees)}</script>
<script>
(function () {
  const D = JSON.parse(document.getElementById("donnees").textContent);
  const FAMILLES = ${json(FAMILLES)};
  const CADENCE = ${json(CADENCE)};

  const VAR = /\\{\\{\\s*([a-zA-Z0-9_]+)\\s*(?:\\|([^}]*))?\\}\\}/g;
  const ACOMPLETER = /\\[\\[([^\\]]+)\\]\\]/g;

  function echapper(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /** Résout une variable comme le fait renderTemplate() côté serveur. */
  function resoudre(_m, cle, repli) {
    const v = D.exemple[cle];
    if (v) return v;
    return repli === undefined ? "" : repli.trim();
  }

  /** Applique fn au texte seulement, jamais à l'intérieur d'une balise. */
  function surLeTexte(html, fn) {
    return html
      .split(/(<[^>]*>)/)
      .map((p) => (p.charAt(0) === "<" ? p : fn(p)))
      .join("");
  }

  /** Habillage ajouté par wrapCampaignHtml() — reproduit à l'identique. */
  function habillagePlateforme(corps) {
    return (
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;font-size:15px;line-height:1.6">' +
      '<div style="padding:8px 0 20px">' + corps + "</div>" +
      '<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 14px"/>' +
      '<div style="color:#9ca3af;font-size:11px;line-height:1.6">' +
      '<p style="margin:0 0 6px">BYS Permis — plateforme de réservation de stages de récupération de points. ' +
      "Ce message vous est adressé dans un cadre professionnel, à l'adresse de votre centre agréé.</p>" +
      '<p style="margin:0">Vous ne souhaitez plus recevoir nos messages ? ' +
      '<a href="#" style="color:#6b7280;text-decoration:underline">Se désinscrire en un clic</a>.</p>' +
      "</div></div>"
    );
  }

  function rendu(modele) {
    let h = modele.html.replace(/<!--[\\s\\S]*?-->/g, "");
    h = h.split("https://byspermis.fr/colored-logo.png").join(D.logo);
    h = h.replace(VAR, resoudre);
    h = surLeTexte(h, (t) => t.replace(ACOMPLETER, '<span class="ph">$1</span>'));
    h = h.replace(ACOMPLETER, "$1"); // ce qui restait dans un attribut
    return modele.canal === "campagnes" ? habillagePlateforme(h) : h;
  }

  function objetRendu(objet) {
    return objet.replace(VAR, resoudre);
  }

  const liste = document.getElementById("liste");
  let html = "";

  FAMILLES.forEach(function (famille) {
    html += '<div class="section-head" data-famille="' + famille + '"><h3>' + famille + "</h3></div>";

    if (famille === "Prospection centres") {
      html +=
        '<div class="cadence" data-famille="' + famille + '">' +
        '<div class="cadence-lbl">Séquence</div>' +
        CADENCE.map(function (e) {
          return (
            '<div class="cadence-step"><div class="j">' + e.jour + "</div>" +
            '<a href="#m-' + e.slug + '">' + e.nom + "</a></div>"
          );
        }).join("") +
        "</div>";
    }

    D.modeles
      .filter(function (m) { return m.famille === famille; })
      .forEach(function (m) {
        const objets = m.objets
          .map(function (o, i) {
            return (
              '<div class="objet"><code>' + echapper(o) + "</code>" +
              '<button type="button" data-copie-objet="' + m.slug + "|" + i + '">Copier</button></div>' +
              (o.indexOf("{{") >= 0
                ? '<p class="rendu">→ ' + echapper(objetRendu(o)) + "</p>"
                : "")
            );
          })
          .join("");

        html +=
          '<article class="card" id="m-' + m.slug + '" data-famille="' + m.famille + '">' +
            '<div class="card-head">' +
              '<div class="card-titleline"><span class="card-n">' + m.slug.slice(0, 2) + "</span>" +
              "<h2>" + m.nom + "</h2></div>" +
              '<div class="badges">' +
                '<span class="badge' + (m.canal === "campagnes" ? " blue" : "") + '">' +
                  (m.canal === "campagnes" ? "Module Campagnes" : "Hors module — autre canal") +
                "</span>" +
                '<span class="badge">Habillage ' + m.variante + "</span>" +
                '<span class="badge">' + m.slug + ".html</span>" +
              "</div>" +
            "</div>" +
            "<dl>" +
              "<dt>Objets</dt><dd>" + objets + "</dd>" +
              "<dt>Pré-en-tête</dt><dd>" + echapper(m.preheader) + "</dd>" +
              "<dt>Ciblage</dt><dd>" + echapper(m.ciblage) + "</dd>" +
              "<dt>Quand</dt><dd>" + echapper(m.quand) + "</dd>" +
              (m.aCompleter.length
                ? '<dt>À compléter</dt><dd class="todo">' + m.aCompleter.map(echapper).join(" · ") + "</dd>"
                : "") +
            "</dl>" +
            '<div class="preview-head">' +
              "<span>" + (m.canal === "campagnes"
                ? "Rendu réel, habillage plateforme inclus"
                : "Rendu du contenu seul — ce modèle ne passe pas par le module") + "</span>" +
              '<span class="preview-actions">' +
                '<button type="button" data-copie="' + m.slug + '">Copier le HTML</button>' +
              "</span>" +
            "</div>" +
            '<div class="paper"><div class="sheet">' + rendu(m) + "</div></div>" +
            '<details class="src"><summary>Voir la source</summary><pre>' + echapper(m.html) + "</pre></details>" +
          "</article>";
      });
  });

  liste.innerHTML = html;

  // ── Copie ──
  function copier(texte, bouton) {
    const fini = function (ok) {
      const avant = bouton.textContent;
      bouton.textContent = ok ? "Copié" : "Échec — sélectionnez la source";
      setTimeout(function () { bouton.textContent = avant; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(function () { fini(true); }, function () { fini(false); });
      return;
    }
    try {
      const z = document.createElement("textarea");
      z.value = texte;
      z.style.position = "fixed";
      z.style.opacity = "0";
      document.body.appendChild(z);
      z.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(z);
      fini(ok);
    } catch (e) {
      fini(false);
    }
  }

  document.addEventListener("click", function (ev) {
    const b = ev.target.closest("button");
    if (!b) return;

    if (b.dataset.copie) {
      const m = D.modeles.find(function (x) { return x.slug === b.dataset.copie; });
      if (m) copier(m.html, b);
      return;
    }

    if (b.dataset.copieObjet) {
      const parts = b.dataset.copieObjet.split("|");
      const m = D.modeles.find(function (x) { return x.slug === parts[0]; });
      if (m) copier(m.objets[Number(parts[1])], b);
      return;
    }

    if (b.dataset.filtre) {
      document.querySelectorAll("[data-filtre]").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
      const f = b.dataset.filtre;
      document.querySelectorAll("[data-famille]").forEach(function (el) {
        el.classList.toggle("hidden", f !== "tous" && el.dataset.famille !== f);
      });
      return;
    }

    if (b.id === "toggle-apercus") {
      const papiers = document.querySelectorAll(".paper");
      const replier = !papiers[0].hidden;
      papiers.forEach(function (p) { p.hidden = replier; });
      b.textContent = replier ? "Déplier les aperçus" : "Replier les aperçus";
    }
  });
})();
</script>
`;

writeFileSync(join(ICI, "apercu.html"), page, "utf8");
console.log(`✔ apercu.html généré (${CATALOGUE.length} modèles)`);
