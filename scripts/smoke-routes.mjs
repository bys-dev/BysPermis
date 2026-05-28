#!/usr/bin/env node
/**
 * Smoke test — toutes les routes API et pages principales.
 * Usage: node scripts/smoke-routes.mjs [baseURL]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";

const PUBLIC_GET_APIS = [
  "/api/health",
  "/api/formations",
  "/api/formations?perPage=1",
  "/api/formations/suggestions?q=perm",
  "/api/sessions",
  "/api/centres",
  "/api/categories",
  "/api/subscription-plans",
  "/api/articles",
];

const PUBLIC_GET_APIS_404 = [
  "/api/sessions/id-inexistant-smoke",
  "/api/formations/slug/slug-inexistant-smoke",
  "/api/centres/slug-inexistant-smoke",
];

const PROTECTED_GET_APIS = [
  "/api/reservations",
  "/api/notifications",
  "/api/tickets",
  "/api/users/me",
  "/api/auth/me",
  "/api/favorites",
  "/api/loyalty",
  "/api/messages",
  "/api/invoices",
  "/api/admin/stats",
  "/api/admin/me",
  "/api/admin/users",
  "/api/admin/centres",
  "/api/admin/tickets",
  "/api/admin/revenus",
  "/api/admin/analytics",
  "/api/admin/promo",
  "/api/admin/payments",
  "/api/admin/moderation",
  "/api/admin/settings",
  "/api/admin/exports?type=centres",
  "/api/centre/stats",
  "/api/centre/me",
  "/api/centre/formations",
  "/api/centre/sessions",
  "/api/centre/membres",
  "/api/centre/payments",
  "/api/centre/completion",
  "/api/centre/list",
  "/api/centre/promo",
  "/api/centre/contrats",
  "/api/centre/email-templates",
  "/api/centre/exports?type=reservations",
];

const PUBLIC_PAGES = [
  "/",
  "/recherche",
  "/centres",
  "/faq",
  "/contact",
  "/comment-ca-marche",
  "/a-propos",
  "/tarifs-partenaires",
  "/cgu",
  "/mentions-legales",
  "/politique-de-confidentialite",
  "/cookies",
  "/connexion",
  "/inscription",
  "/blog",
  "/stages/paris",
  "/maintenance",
  "/sitemap.xml",
  "/robots.txt",
];

const PROTECTED_PAGES = [
  "/dashboard",
  "/espace-eleve",
  "/espace-centre",
  "/espace-centre/dashboard",
  "/admin",
  "/admin/dashboard",
  "/plateforme/dashboard",
];

async function fetchStatus(path, opts = {}) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, { redirect: "manual", ...opts });
    return { path, status: res.status, ok: false };
  } catch (e) {
    return { path, status: 0, error: String(e.message), ok: false };
  }
}

function pass(entry, expected) {
  const statuses = Array.isArray(expected) ? expected : [expected];
  entry.ok = statuses.includes(entry.status);
  return entry;
}

const results = { pass: 0, fail: 0, items: [] };

function record(entry) {
  if (entry.ok) results.pass++;
  else results.fail++;
  results.items.push(entry);
}

console.log(`\n🔍 Smoke test — ${BASE}\n`);

for (const path of PUBLIC_GET_APIS) {
  const r = await fetchStatus(path);
  record(pass(r, 200));
}

for (const path of PUBLIC_GET_APIS_404) {
  const r = await fetchStatus(path);
  record(pass(r, 404));
}

for (const path of PROTECTED_GET_APIS) {
  const r = await fetchStatus(path);
  record(pass(r, [401, 403]));
}

for (const path of PUBLIC_PAGES) {
  const r = await fetchStatus(path);
  record(pass(r, [200, 307, 308]));
}

for (const path of PROTECTED_PAGES) {
  const r = await fetchStatus(path);
  // redirect to login or ok if session exists
  record(pass(r, [200, 307, 308]));
}

// POST validations
const contactBad = await fetch(`${BASE}/api/contact`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nom: "", email: "x", sujet: "", message: "" }),
});
record(pass({ path: "POST /api/contact (invalid)", status: contactBad.status }, 400));

const registerBad = await fetch(`${BASE}/api/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "bad" }),
});
record(pass({ path: "POST /api/register (invalid)", status: registerBad.status }, 400));

const paymentNoAuth = await fetch(`${BASE}/api/stripe/create-payment-intent`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sessionId: "test" }),
});
record(pass({ path: "POST /api/stripe/create-payment-intent", status: paymentNoAuth.status }, 401));

// Report failures
const failures = results.items.filter((i) => !i.ok);
console.log(`✅ ${results.pass} OK  |  ❌ ${results.fail} échecs\n`);
if (failures.length) {
  console.log("Échecs :");
  for (const f of failures) {
    console.log(`  ${f.path} → ${f.status}${f.error ? ` (${f.error})` : ""}`);
  }
  process.exit(1);
}
console.log("Tous les smoke tests sont passés.\n");
process.exit(0);
