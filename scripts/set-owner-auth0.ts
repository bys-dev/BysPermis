import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const EMAIL = "bysforma95@gmail.com";
const ROLE = "OWNER";

function cfg() {
  const domain = (process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, "") ?? process.env.AUTH0_DOMAIN)!;
  const clientId = (process.env.AUTH0_MANAGEMENT_CLIENT_ID ?? process.env.AUTH0_CLIENT_ID)!;
  const clientSecret = (process.env.AUTH0_MANAGEMENT_CLIENT_SECRET ?? process.env.AUTH0_CLIENT_SECRET)!;
  return { domain, clientId, clientSecret };
}

async function main() {
  const { domain, clientId, clientSecret } = cfg();

  const tokenRes = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret, audience: `https://${domain}/api/v2/` }),
  });
  if (!tokenRes.ok) throw new Error("Token M2M échec: " + (await tokenRes.text()));
  const { access_token } = (await tokenRes.json()) as { access_token: string };
  const headers = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };

  const byEmail = await fetch(`https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(EMAIL)}`, { headers });
  if (!byEmail.ok) throw new Error("users-by-email échec: " + (await byEmail.text()));
  const users = (await byEmail.json()) as Array<{ user_id: string; email: string; app_metadata?: { role?: string } }>;
  if (!users.length) throw new Error(`Aucun utilisateur Auth0 pour ${EMAIL}`);

  console.log(`Comptes Auth0 pour ${EMAIL}:`, users.map((u) => `${u.user_id} (role=${u.app_metadata?.role ?? "—"})`));

  for (const u of users) {
    const patch = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(u.user_id)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ app_metadata: { role: ROLE } }),
    });
    if (!patch.ok) throw new Error(`PATCH ${u.user_id} échec: ` + (await patch.text()));
    console.log(`✅ Auth0 app_metadata.role=${ROLE} défini pour ${u.user_id}`);
  }

  // Cache DB immédiat (Auth0 = source de vérité, donc non écrasé au prochain login)
  const updated = await prisma.user.updateMany({ where: { email: EMAIL }, data: { role: ROLE } });
  console.log(`✅ DB synchronisée (${updated.count} ligne) — role=${ROLE}`);
}

main().finally(() => prisma.$disconnect());
