import { prisma } from "@/lib/prisma";

/**
 * Fetch the right email template (centre-specific override or default fallback)
 * and replace {{variable}} placeholders with actual values.
 */
export async function renderEmailTemplate(
  slug: string,
  centreId: string | null,
  variables: Record<string, string>
): Promise<{ subject: string; html: string }> {
  // 1. Try centre-specific template first, then fall back to default (centreId = null)
  let template = centreId
    ? await prisma.emailTemplate.findUnique({
        where: { slug_centreId: { slug, centreId } },
      })
    : null;

  if (!template) {
    // Prisma unique constraint with null requires a workaround
    template = await prisma.emailTemplate.findFirst({
      where: { slug, centreId: null },
    });
  }

  if (!template) {
    throw new Error(`Email template "${slug}" introuvable`);
  }

  // 2. Replace {{variable}} placeholders
  const subject = replacePlaceholders(template.sujet, variables);
  const html = replacePlaceholders(template.contenu, variables);

  return { subject, html };
}

/**
 * Replace all {{variableName}} placeholders in a string with values from the variables map.
 * Unknown variables are left as-is.
 */
function replacePlaceholders(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return variables[key] ?? match;
  });
}
