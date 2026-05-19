import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
    "src/generated/**",
    // Prisma seed/scripts: dynamic Prisma payloads use untyped accumulators.
    // These scripts never run in production — only locally / on staging seed.
    "prisma/seed.ts",
    "prisma/seed-demo.ts",
    "prisma/seed-auth0.ts",
    "prisma/check-db.ts",
  ]),
  {
    // React 19 hook compiler rules are informative — don't block the build.
    // Track them as warnings and clean up incrementally.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
      // Cosmetic — apostrophes inside JSX are allowed in production builds.
      "react/no-unescaped-entities": "warn",
    },
  },
  {
    // Test files have their own conventions (no display-name, dynamic mocks).
    files: ["__tests__/**/*.{ts,tsx}", "jest.setup.ts"],
    rules: {
      "react/display-name": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
