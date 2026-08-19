import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

/** Espaces authentifiés et tunnels : aucun intérêt à l'index, risque de duplication. */
const PRIVE = [
  "/api/",
  "/espace-eleve/",
  "/espace-centre/",
  "/admin/",
  "/plateforme/",
  "/dashboard/",
  "/reserver/",
  "/support/",
  "/desabonnement/",
  "/maintenance",
  "/connexion",
  "/inscription",
];

/**
 * Crawlers des moteurs de réponse générative.
 *
 * Ils sont déjà couverts par la règle `*`, mais on les déclare nommément pour
 * deux raisons : plusieurs de ces agents ne lisent que le bloc portant leur
 * propre user-agent, et une autorisation explicite documente une décision qui
 * n'est pas neutre — accepter que le contenu du site alimente et soit cité par
 * ChatGPT, Perplexity, Claude, Gemini et Copilot.
 *
 * Distinction utile si l'arbitrage devait changer : `GPTBot`, `ClaudeBot`,
 * `Google-Extended` et `Applebot-Extended` servent l'entraînement, tandis que
 * `OAI-SearchBot`, `ChatGPT-User`, `Claude-User`, `PerplexityBot` et
 * `Perplexity-User` alimentent les réponses citées en temps réel. Ce sont ces
 * derniers qui apportent du trafic.
 */
const AGENTS_IA = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "cohere-ai",
  "YouBot",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVE },
      ...AGENTS_IA.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVE })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
