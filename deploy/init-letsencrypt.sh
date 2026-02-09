#!/usr/bin/env sh
set -eu

DOMAIN_MAIN="notas.blendz.com.br"
DOMAIN_API="api.notas.blendz.com.br"
EMAIL="edu@blendz.com.br"
STAGING=0

DATA_PATH="./certbot"

if [ ! -d "${DATA_PATH}/conf/live/${DOMAIN_MAIN}" ]; then
  echo "Creating dummy certificates..."
  mkdir -p "${DATA_PATH}/conf/live/${DOMAIN_MAIN}" "${DATA_PATH}/conf/live/${DOMAIN_API}"

  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "${DATA_PATH}/conf/live/${DOMAIN_MAIN}/privkey.pem" \
    -out "${DATA_PATH}/conf/live/${DOMAIN_MAIN}/fullchain.pem" \
    -subj "/CN=${DOMAIN_MAIN}"

  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "${DATA_PATH}/conf/live/${DOMAIN_API}/privkey.pem" \
    -out "${DATA_PATH}/conf/live/${DOMAIN_API}/fullchain.pem" \
    -subj "/CN=${DOMAIN_API}"
fi

docker compose -f docker-compose.prod.yml up -d nginx

STAGING_ARG=""
if [ "${STAGING}" -ne 0 ]; then
  STAGING_ARG="--staging"
fi

# Delete dummy certs
rm -rf "${DATA_PATH}/conf/live/${DOMAIN_MAIN}" "${DATA_PATH}/conf/live/${DOMAIN_API}"

# Request real certificates

docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "${DOMAIN_MAIN}" \
  -d "${DOMAIN_API}" \
  --email "${EMAIL}" \
  --agree-tos --no-eff-email \
  ${STAGING_ARG}

docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "Done."
