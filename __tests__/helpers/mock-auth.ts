/**
 * Mock auth helper — simulates authenticated users for each role.
 *
 * Usage:
 *   import { loginAs, logout } from "../helpers/mock-auth";
 *
 *   beforeEach(() => loginAs("ELEVE"));   // or "CENTRE_OWNER", "ADMIN", etc.
 *   afterEach(() => logout());
 *
 * The mock intercepts `@/lib/auth0` so that requireAuth / requireRole / etc.
 * resolve to a fake Prisma-shaped User object with the chosen role.
 */

import type { User } from "@/generated/prisma/client";

// ─── Fake users per role ────────────────────────────────────

const FAKE_USERS: Record<string, User> = {
  ELEVE: {
    id: "user-eleve-001",
    auth0Id: "auth0|test-eleve",
    email: "eleve@test.fr",
    nom: "Dupont",
    prenom: "Jean",
    telephone: "0612345678",
    adresse: "12 Rue Test",
    codePostal: "75001",
    ville: "Paris",
    role: "ELEVE",
    isBlocked: false,
    activeCentreId: null,
    loyaltyLevel: "BRONZE",
    totalPoints: 0,
    referralCode: "BYS-JEAN01",
    referredBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as User,

  CENTRE_OWNER: {
    id: "user-centre-owner-001",
    auth0Id: "auth0|test-centre-owner",
    email: "owner@centre-test.fr",
    nom: "Moreau",
    prenom: "Sebastien",
    telephone: "0134256789",
    adresse: "9 Chaussée Jules César",
    codePostal: "95520",
    ville: "Osny",
    role: "CENTRE_OWNER",
    isBlocked: false,
    activeCentreId: "centre-test-001",
    loyaltyLevel: "BRONZE",
    totalPoints: 0,
    referralCode: "BYS-SEBA01",
    referredBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as User,

  CENTRE_ADMIN: {
    id: "user-centre-admin-001",
    auth0Id: "auth0|test-centre-admin",
    email: "admin@centre-test.fr",
    nom: "Benali",
    prenom: "Fatima",
    telephone: "0143557890",
    adresse: "45 Avenue de la République",
    codePostal: "75011",
    ville: "Paris",
    role: "CENTRE_ADMIN",
    isBlocked: false,
    activeCentreId: "centre-test-001",
    loyaltyLevel: "BRONZE",
    totalPoints: 0,
    referralCode: "BYS-FATI01",
    referredBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as User,

  CENTRE_FORMATEUR: {
    id: "user-centre-formateur-001",
    auth0Id: "auth0|test-formateur",
    email: "formateur@centre-test.fr",
    nom: "Lefebvre",
    prenom: "Thomas",
    telephone: "0240556677",
    adresse: "22 Rue de Strasbourg",
    codePostal: "44000",
    ville: "Nantes",
    role: "CENTRE_FORMATEUR",
    isBlocked: false,
    activeCentreId: "centre-test-001",
    loyaltyLevel: "BRONZE",
    totalPoints: 0,
    referralCode: "BYS-THOM01",
    referredBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as User,

  CENTRE_SECRETAIRE: {
    id: "user-centre-secretaire-001",
    auth0Id: "auth0|test-secretaire",
    email: "secretaire@centre-test.fr",
    nom: "Garcia",
    prenom: "Laura",
    telephone: "0145678901",
    adresse: "8 Rue des Lilas",
    codePostal: "75020",
    ville: "Paris",
    role: "CENTRE_SECRETAIRE",
    isBlocked: false,
    activeCentreId: "centre-test-001",
    loyaltyLevel: "BRONZE",
    totalPoints: 0,
    referralCode: "BYS-LAUR01",
    referredBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as User,

  SUPPORT: {
    id: "user-support-001",
    auth0Id: "auth0|test-support",
    email: "support@bys-formation.fr",
    nom: "Martin",
    prenom: "Sophie",
    telephone: "0155667788",
    adresse: null,
    codePostal: null,
    ville: null,
    role: "SUPPORT",
    isBlocked: false,
    activeCentreId: null,
    loyaltyLevel: "BRONZE",
    totalPoints: 0,
    referralCode: "BYS-SOPH01",
    referredBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as User,

  COMPTABLE: {
    id: "user-comptable-001",
    auth0Id: "auth0|test-comptable",
    email: "compta@bys-formation.fr",
    nom: "Petit",
    prenom: "Claire",
    telephone: null,
    adresse: null,
    codePostal: null,
    ville: null,
    role: "COMPTABLE",
    isBlocked: false,
    activeCentreId: null,
    loyaltyLevel: "BRONZE",
    totalPoints: 0,
    referralCode: "BYS-CLAI01",
    referredBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as User,

  COMMERCIAL: {
    id: "user-commercial-001",
    auth0Id: "auth0|test-commercial",
    email: "commercial@bys-formation.fr",
    nom: "Lemaire",
    prenom: "Hugo",
    telephone: null,
    adresse: null,
    codePostal: null,
    ville: null,
    role: "COMMERCIAL",
    isBlocked: false,
    activeCentreId: null,
    loyaltyLevel: "BRONZE",
    totalPoints: 0,
    referralCode: "BYS-HUGO01",
    referredBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as User,

  ADMIN: {
    id: "user-admin-001",
    auth0Id: "auth0|test-admin",
    email: "admin@bys-formation.fr",
    nom: "Magar",
    prenom: "Andrys",
    telephone: "0612345678",
    adresse: "15 Rue de la Paix",
    codePostal: "95520",
    ville: "Osny",
    role: "ADMIN",
    isBlocked: false,
    activeCentreId: null,
    loyaltyLevel: "BRONZE",
    totalPoints: 0,
    referralCode: "BYS-ANDR01",
    referredBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as User,

  OWNER: {
    id: "user-owner-001",
    auth0Id: "auth0|test-owner",
    email: "sebastien@bys-formation.fr",
    nom: "BYS",
    prenom: "Sebastien",
    telephone: "0600000000",
    adresse: null,
    codePostal: null,
    ville: null,
    role: "OWNER",
    isBlocked: false,
    activeCentreId: null,
    loyaltyLevel: "BRONZE",
    totalPoints: 0,
    referralCode: "BYS-SEBA99",
    referredBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } as User,
};

// ─── State ──────────────────────────────────────────────────

let currentUser: User | null = null;

// ─── Role groups (mirrored from auth0.ts) ───────────────────

const CENTRE_ROLES = ["CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE"];
const CENTRE_MANAGEMENT_ROLES = ["CENTRE_OWNER", "CENTRE_ADMIN"];
const CENTRE_FINANCE_ROLES = ["CENTRE_OWNER"];
const PLATFORM_ADMIN_ROLES = ["ADMIN", "OWNER"];

function checkRole(user: User, allowed: readonly string[]) {
  if (!allowed.includes(user.role)) {
    throw new Error("Non autorisé");
  }
  return user;
}

// ─── Public API ─────────────────────────────────────────────

export function loginAs(role: string): User {
  const user = FAKE_USERS[role];
  if (!user) throw new Error(`Unknown test role: ${role}`);
  currentUser = user;
  return user;
}

export function logout(): void {
  currentUser = null;
}

export function getTestUser(role: string): User {
  return FAKE_USERS[role];
}

// ─── Mock implementations (match auth0.ts signatures) ───────

export const mockGetCurrentUser = jest.fn(async () => currentUser);

export const mockRequireAuth = jest.fn(async () => {
  if (!currentUser) throw new Error("Non authentifié");
  return currentUser;
});

export const mockRequireRole = jest.fn(async (allowedRoles: readonly string[]) => {
  if (!currentUser) throw new Error("Non authentifié");
  return checkRole(currentUser, allowedRoles);
});

export const mockRequireCentreStaff = jest.fn(async () => {
  if (!currentUser) throw new Error("Non authentifié");
  return checkRole(currentUser, [...CENTRE_ROLES, ...PLATFORM_ADMIN_ROLES]);
});

export const mockRequireCentreManagement = jest.fn(async () => {
  if (!currentUser) throw new Error("Non authentifié");
  return checkRole(currentUser, [...CENTRE_MANAGEMENT_ROLES, ...PLATFORM_ADMIN_ROLES]);
});

export const mockRequireCentreOwner = jest.fn(async () => {
  if (!currentUser) throw new Error("Non authentifié");
  return checkRole(currentUser, [...CENTRE_FINANCE_ROLES, ...PLATFORM_ADMIN_ROLES]);
});

export const mockRequireSupport = jest.fn(async () => {
  if (!currentUser) throw new Error("Non authentifié");
  return checkRole(currentUser, ["SUPPORT", "ADMIN", "OWNER"]);
});

export const mockRequireComptable = jest.fn(async () => {
  if (!currentUser) throw new Error("Non authentifié");
  return checkRole(currentUser, ["COMPTABLE", "ADMIN", "OWNER"]);
});

export const mockRequireAdmin = jest.fn(async () => {
  if (!currentUser) throw new Error("Non authentifié");
  return checkRole(currentUser, PLATFORM_ADMIN_ROLES);
});

export const mockRequireOwner = jest.fn(async () => {
  if (!currentUser) throw new Error("Non authentifié");
  return checkRole(currentUser, ["OWNER"]);
});

export const mockRequireCentre = mockRequireCentreStaff; // legacy alias

// ─── Setup: call this in jest.mock() ────────────────────────

export function getAuth0Mocks() {
  return {
    getCurrentUser: mockGetCurrentUser,
    requireAuth: mockRequireAuth,
    requireRole: mockRequireRole,
    requireCentreStaff: mockRequireCentreStaff,
    requireCentreManagement: mockRequireCentreManagement,
    requireCentreOwner: mockRequireCentreOwner,
    requireSupport: mockRequireSupport,
    requireComptable: mockRequireComptable,
    requireAdmin: mockRequireAdmin,
    requireOwner: mockRequireOwner,
    requireCentre: mockRequireCentreStaff,
    auth0: {},
    ALL_ROLES: [
      "ELEVE", "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE",
      "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER",
    ],
    CENTRE_ROLES,
    CENTRE_MANAGEMENT_ROLES,
    CENTRE_FINANCE_ROLES,
    PLATFORM_ROLES: ["SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER"],
    PLATFORM_ADMIN_ROLES,
  };
}
