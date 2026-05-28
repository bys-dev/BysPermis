/** Comptes recette — source de vérité si Auth0 / token indisponibles (ex. Vercel sans M2M). */
export const DEMO_ACCOUNT_ROLES = {
  "bysandrys95@gmail.com": "OWNER",
  "sebastien@bys-formation.fr": "OWNER",
  "admin@bys-formation.fr": "ADMIN",
  "support@bys-formation.fr": "SUPPORT",
  "comptabilite@bys-formation.fr": "COMPTABLE",
  "commercial@bys-formation.fr": "COMMERCIAL",
  "contact@bys-formation.fr": "CENTRE_OWNER",
  "gestion@bys-formation.fr": "CENTRE_ADMIN",
  "formateur@bys-formation.fr": "CENTRE_FORMATEUR",
  "secretariat@autoecole-conduite-plus.fr": "CENTRE_SECRETAIRE",
  "marie.durand@outlook.fr": "ELEVE",
} as const

export type DemoAccountRole = (typeof DEMO_ACCOUNT_ROLES)[keyof typeof DEMO_ACCOUNT_ROLES]

export function roleForDemoEmail(email: string | undefined | null): DemoAccountRole | undefined {
  if (!email) return undefined
  const key = email.trim().toLowerCase() as keyof typeof DEMO_ACCOUNT_ROLES
  return DEMO_ACCOUNT_ROLES[key]
}
