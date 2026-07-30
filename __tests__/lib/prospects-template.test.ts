import {
  buildProspectVariables,
  renderTemplate,
  renderCampaignEmail,
  validateCampaignTemplate,
  unsubscribeUrl,
  PROSPECT_TEMPLATE_VARIABLES,
  type TemplateProspect,
} from "@/lib/prospects/template";

const prospect: TemplateProspect = {
  nom: "Centre Auto Formation",
  raisonSociale: "AUTO FORMATION SARL",
  ville: "Cergy",
  codePostal: "95000",
  departement: "95",
  email: "contact@exemple.fr",
  telephone: "0123456789",
  siteWeb: null,
  agrementNumber: "R 21 095 0001 0",
  contactNom: "Dupont",
  contactPrenom: "Marc",
  contactFonction: "Gérant",
  unsubscribeToken: "tok_abc123",
};

describe("buildProspectVariables", () => {
  it("expose les champs du prospect", () => {
    const vars = buildProspectVariables(prospect);
    expect(vars.nom).toBe("Centre Auto Formation");
    expect(vars.ville).toBe("Cergy");
    expect(vars.departement).toBe("95");
  });

  it("compose une salutation nominative", () => {
    expect(buildProspectVariables(prospect).salutation).toBe("Bonjour Marc Dupont,");
  });

  it("reste neutre sans interlocuteur identifié", () => {
    const vars = buildProspectVariables({ ...prospect, contactNom: null, contactPrenom: null });
    expect(vars.salutation).toBe("Bonjour,");
  });

  it("construit un lien de désinscription propre au prospect", () => {
    const vars = buildProspectVariables(prospect);
    expect(vars.lienDesinscription).toBe(unsubscribeUrl("tok_abc123"));
    expect(vars.lienDesinscription).toContain("tok_abc123");
  });

  it("fournit une valeur pour chaque variable du catalogue", () => {
    const vars = buildProspectVariables(prospect);
    for (const v of PROSPECT_TEMPLATE_VARIABLES) {
      expect(Object.prototype.hasOwnProperty.call(vars, v.key)).toBe(true);
    }
  });
});

describe("renderTemplate", () => {
  const vars = buildProspectVariables(prospect);

  it("remplace les placeholders connus", () => {
    const { output } = renderTemplate("Bonjour {{nom}} à {{ville}}", vars, { escape: false });
    expect(output).toBe("Bonjour Centre Auto Formation à Cergy");
  });

  it("applique la valeur de repli quand la variable est vide", () => {
    const vides = buildProspectVariables({ ...prospect, ville: null });
    const { output } = renderTemplate("dans {{ville|votre secteur}}", vides, { escape: false });
    expect(output).toBe("dans votre secteur");
  });

  it("ne laisse jamais un placeholder inconnu dans le rendu", () => {
    const { output, unknown } = renderTemplate("Bonjour {{inconnu}}", vars, { escape: false });
    expect(output).toBe("Bonjour ");
    expect(unknown).toContain("inconnu");
  });

  it("signale les variables connues mais vides", () => {
    const vides = buildProspectVariables({ ...prospect, ville: null });
    const { empty } = renderTemplate("{{ville}}", vides);
    expect(empty).toContain("ville");
  });

  it("échappe le HTML des données importées", () => {
    const hostile = buildProspectVariables({ ...prospect, nom: '<script>alert("x")</script>' });
    const { output } = renderTemplate("{{nom}}", hostile, { escape: true });
    expect(output).not.toContain("<script>");
    expect(output).toContain("&lt;script&gt;");
  });

  it("n'échappe pas l'objet, qui est du texte brut", () => {
    const vars2 = buildProspectVariables({ ...prospect, nom: "Auto & Co" });
    const { output } = renderTemplate("{{nom}}", vars2, { escape: false });
    expect(output).toBe("Auto & Co");
  });
});

describe("renderCampaignEmail", () => {
  it("rend l'objet et le corps personnalisés", () => {
    const email = renderCampaignEmail({
      sujet: "{{nom}} — proposition",
      contenu: "<p>{{salutation}}</p>",
      prospect,
    });
    expect(email.subject).toBe("Centre Auto Formation — proposition");
    expect(email.html).toContain("Bonjour Marc Dupont,");
  });

  it("ajoute systématiquement le lien de désinscription", () => {
    const email = renderCampaignEmail({ sujet: "x", contenu: "<p>corps</p>", prospect });
    expect(email.html).toContain(unsubscribeUrl("tok_abc123"));
    expect(email.html).toContain("désinscrire");
  });

  it("mentionne le cadre professionnel de l'envoi", () => {
    const email = renderCampaignEmail({ sujet: "x", contenu: "<p>corps</p>", prospect });
    expect(email.html).toMatch(/cadre professionnel/i);
  });
});

describe("validateCampaignTemplate", () => {
  it("accepte un gabarit correct", () => {
    const res = validateCampaignTemplate({ sujet: "Bonjour {{nom}}", contenu: "<p>{{salutation}}</p>" });
    expect(res.errors).toHaveLength(0);
  });

  it("refuse un objet ou un contenu vide", () => {
    expect(validateCampaignTemplate({ sujet: "", contenu: "<p>x</p>" }).errors.length).toBeGreaterThan(0);
    expect(validateCampaignTemplate({ sujet: "x", contenu: "" }).errors.length).toBeGreaterThan(0);
  });

  it("refuse une variable inconnue plutôt que de l'envoyer vide", () => {
    const res = validateCampaignTemplate({ sujet: "Bonjour {{prenom}}", contenu: "<p>corps du message</p>" });
    expect(res.errors.join(" ")).toContain("{{prenom}}");
  });

  it("accepte la syntaxe de repli", () => {
    const res = validateCampaignTemplate({
      sujet: "Stage à {{ville|proximité}}",
      contenu: "<p>contenu suffisamment long</p>",
    });
    expect(res.errors).toHaveLength(0);
  });
});
