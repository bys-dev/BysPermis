import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Build ID déterministe partagé par toutes les instances Clever Cloud
  // (chaque instance rebuild indépendamment) → évite les mismatches de
  // Server Actions / chunks entre instances derrière le load-balancer.
  generateBuildId: () =>
    process.env.COMMIT_ID ?? process.env.CC_COMMIT_ID ?? null,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/uxpilot-auth.appspot.com/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  experimental: {
    // ─── Empreinte mémoire du build (Clever Cloud) ───
    // Le conteneur de build fait ~2 Go et Clever y injecte
    // NODE_OPTIONS=--max-old-space-size=1262. Ce plafond vaut PAR PROCESSUS :
    // Next lançant plusieurs ouvriers en parallèle (7 observés en génération
    // statique), la somme dépasse la RAM du conteneur et le noyau tue le build
    // — « build worker exited with signal SIGKILL ». Changer de bundler n'y
    // change rien : c'est la multiplication des processus qui coûte.
    //
    // On sérialise donc les deux phases concernées :
    webpackBuildWorker: false, // compilation dans le processus principal
    cpus: 1, // génération des pages statiques une par une
    //
    // Contrepartie : build sensiblement plus lent. À retirer si l'instance de
    // build passe sur un gabarit plus large (variable CC_BUILD_FLAVOR).
    optimizePackageImports: [
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/free-brands-svg-icons",
      "@fortawesome/free-regular-svg-icons",
      "@fortawesome/react-fontawesome",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const sentryEnabled = !!process.env.SENTRY_DSN && !!process.env.SENTRY_AUTH_TOKEN;

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring-tunnel",
      sourcemaps: { disable: false },
      disableLogger: true,
    })
  : nextConfig;
