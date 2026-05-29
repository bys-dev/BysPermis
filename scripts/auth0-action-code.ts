/**
 * Code source unique de l'Action Auth0 Post-Login BYS Permis.
 * Modèle proche SL Formations : rôles natifs Auth0 (event.authorization.roles).
 * Fallback : app_metadata.role. Pas de défaut ELEVE dans le token.
 */

export const AUTH0_ACTION_NAME = "BYS - Inject Role";
export const AUTH0_LEGACY_ACTION_NAME = "Add role to ID token";
export const AUTH0_ROLE_NAMESPACE = "https://byspermis.fr";

export const AUTH0_POST_LOGIN_ACTION_CODE = `
/**
 * BYS Permis — Post-Login Action (modèle SL Formations adapté)
 * Injecte roles[] + role principal dans le ID token et l'access token.
 */
exports.onExecutePostLogin = async (event, api) => {
  if (!event.user.email || !event.user.email_verified) {
    return;
  }

  const namespace = "${AUTH0_ROLE_NAMESPACE}";

  const VALID_ROLES = [
    "ELEVE",
    "CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE",
    "SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER"
  ];

  const ROLE_LEVELS = {
    OWNER: 100, ADMIN: 90, COMPTABLE: 70, COMMERCIAL: 70, SUPPORT: 60,
    CENTRE_OWNER: 50, CENTRE_ADMIN: 40, CENTRE_FORMATEUR: 30, CENTRE_SECRETAIRE: 20, ELEVE: 10
  };

  const nativeRoles = (event.authorization && event.authorization.roles) || [];
  const appRole = event.user.app_metadata && event.user.app_metadata.role;

  const allCandidates = nativeRoles.concat(appRole ? [appRole] : []);
  const roles = allCandidates.filter(function (r) { return VALID_ROLES.indexOf(r) !== -1; });

  if (roles.length === 0) {
    return;
  }

  var primary = roles[0];
  for (var i = 1; i < roles.length; i++) {
    if ((ROLE_LEVELS[roles[i]] || 0) > (ROLE_LEVELS[primary] || 0)) {
      primary = roles[i];
    }
  }

  api.idToken.setCustomClaim(namespace + "/roles", roles);
  api.accessToken.setCustomClaim(namespace + "/roles", roles);
  api.idToken.setCustomClaim(namespace + "/role", primary);
  api.accessToken.setCustomClaim(namespace + "/role", primary);
  api.idToken.setCustomClaim("role", primary);
};
`;
