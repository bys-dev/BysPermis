/**
 * Code source unique de l'Action Auth0 Post-Login BYS Permis.
 * Source de vérité : app_metadata.role (seed-auth0, admin API).
 * Fallback : rôles natifs Auth0 (event.authorization.roles).
 */

export const AUTH0_ACTION_NAME = "BYS - Inject Role";
export const AUTH0_LEGACY_ACTION_NAME = "Add role to ID token";
export const AUTH0_ROLE_NAMESPACE = "https://byspermis.fr";

export const AUTH0_POST_LOGIN_ACTION_CODE = `
/**
 * BYS Permis — Post-Login Action
 * Injecte le rôle dans le ID token et l'access token.
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "${AUTH0_ROLE_NAMESPACE}";

  const VALID_ROLES = [
    "ELEVE",
    "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE",
    "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER"
  ];

  const appRole = event.user.app_metadata && event.user.app_metadata.role;
  const nativeRoles =
    event.authorization && event.authorization.roles ? event.authorization.roles : [];
  const nativeRole = nativeRoles.find(function (r) { return VALID_ROLES.indexOf(r) !== -1; });

  const rawRole = VALID_ROLES.indexOf(appRole) !== -1 ? appRole : nativeRole;

  // Ne pas injecter ELEVE par défaut : sinon le token écrase les rôles OWNER/ADMIN en base.
  // Les nouveaux comptes sans rôle sont gérés côté app (getCurrentUser → ELEVE).
  if (VALID_ROLES.indexOf(rawRole) === -1) {
    return;
  }

  api.idToken.setCustomClaim(namespace + "/role", rawRole);
  api.accessToken.setCustomClaim(namespace + "/role", rawRole);
  api.idToken.setCustomClaim("role", rawRole);
};
`;
