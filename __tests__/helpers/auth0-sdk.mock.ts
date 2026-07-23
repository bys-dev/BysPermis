// Mock pour @auth0/nextjs-auth0/server — le SDK est publié en ESM pur et Jest ne
// transforme pas node_modules : sans ce mock, toute suite qui importe (même
// indirectement) src/lib/auth0.ts échoue sur « SyntaxError: Unexpected token 'export' ».
//
// Même approche que le mock de @react-pdf/renderer : on remplace le module par un
// stub CommonJS. Les tests qui ont besoin d'une session mockent `@/lib/auth0`
// directement (requireAuth / getCurrentUser), pas ce client bas niveau.

export interface MockSessionUser {
  sub?: string;
  email?: string;
  [key: string]: unknown;
}

export class Auth0Client {
  constructor(_options?: unknown) {}

  /** Aucune session par défaut : les tests d'accès attendent un 401 non authentifié. */
  async getSession(): Promise<{ user: MockSessionUser } | null> {
    return null;
  }

  async middleware(): Promise<null> {
    return null;
  }
}
