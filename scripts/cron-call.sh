#!/bin/sh
# Appelle un endpoint cron interne de l'application.
#
# Usage : cron-call.sh /api/cron/<tache>
#
# Deux precautions :
#
#  1. Garde multi-instance. Clever Cloud execute le cron sur CHAQUE instance.
#     Sans garde, une plateforme scalee a trois instances enverrait trois fois
#     les rappels de session et trois fois chaque campagne. Seule l'instance 0
#     travaille ; les autres sortent immediatement.
#
#  2. Appel en local. On tape http://localhost:$PORT plutot que le domaine
#     public : pas de traversee du load-balancer, donc pas de risque d'atterrir
#     sur une autre instance, et la tache reste injoignable depuis l'exterieur.
#
# L'authentification reprend le schema attendu par les routes : un en-tete
# Authorization: Bearer $CRON_SECRET, verifie avant tout traitement.

set -eu

if [ "${INSTANCE_NUMBER:-0}" != "0" ]; then
  exit 0
fi

ENDPOINT="${1:?usage: cron-call.sh /api/cron/<tache>}"

if [ -z "${CRON_SECRET:-}" ]; then
  echo "[cron] CRON_SECRET absent — $ENDPOINT ignore" >&2
  exit 1
fi

# -f : sortie en erreur si le serveur repond >= 400, pour que l'echec soit
# visible dans les logs plutot que silencieux.
curl -fsS --max-time 600 \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "http://localhost:${PORT:-8080}${ENDPOINT}" \
  && echo "[cron] $ENDPOINT ok" \
  || { echo "[cron] $ENDPOINT ECHEC" >&2; exit 1; }
