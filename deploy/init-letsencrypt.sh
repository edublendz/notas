#!/usr/bin/env sh
set -eu

DOMAIN_MAIN="notas.blendz.com.br"
DOMAIN_API="api.notas.blendz.com.br"
EMAIL="edu@blendz.com.br"
STAGING=0

DATA_PATH="./certbot"
ENV_FILE=".env.prod"
CERT_NAME="notas"

# Detect compose: prefer plugin (docker compose), fallback to docker-compose
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  echo "Docker Compose not found. Install docker compose plugin or docker-compose binary." >&2
  exit 1
fi

if [ ! -d "${DATA_PATH}/conf/live/${CERT_NAME}" ]; then
  echo "Creating dummy certificate for ${CERT_NAME}..."
  mkdir -p "${DATA_PATH}/conf/live/${CERT_NAME}"

  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "${DATA_PATH}/conf/live/${CERT_NAME}/privkey.pem" \
    -out "${DATA_PATH}/conf/live/${CERT_NAME}/fullchain.pem" \
    -subj "/CN=${DOMAIN_MAIN}"
fi

# Use env file for interpolation to avoid warnings
# Start API first to ensure Nginx can resolve upstream "api"
$DOCKER_COMPOSE --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d api nginx

STAGING_ARG=""
if [ "${STAGING}" -ne 0 ]; then
  STAGING_ARG="--staging"
fi

# Preflight: ensure HTTP-01 path is reachable externally
mkdir -p "${DATA_PATH}/www/.well-known/acme-challenge"
TOKEN_FILE="${DATA_PATH}/www/.well-known/acme-challenge/ping.txt"
TOKEN_VAL="$(date +%s)-$RANDOM"
echo "$TOKEN_VAL" > "$TOKEN_FILE"

# Wait for nginx to answer locally
TRIES=30
until curl -fsS -I http://localhost >/dev/null 2>&1 || [ $TRIES -le 0 ]; do
  echo "Waiting for nginx on localhost:80..."; sleep 2; TRIES=$((TRIES-1));
done

# Check external reachability for both domains (best-effort)
curl -fsS "http://${DOMAIN_MAIN}/.well-known/acme-challenge/ping.txt" >/dev/null 2>&1 || echo "WARN: HTTP-01 for ${DOMAIN_MAIN} not reachable from here. Check DNS/firewall."
curl -fsS "http://${DOMAIN_API}/.well-known/acme-challenge/ping.txt" >/dev/null 2>&1 || echo "WARN: HTTP-01 for ${DOMAIN_API} not reachable from here. Check DNS/firewall."

# Request real certificates (keep dummy certs in place during issuance)
$DOCKER_COMPOSE --env-file "$ENV_FILE" -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  --cert-name "${CERT_NAME}" \
  -d "${DOMAIN_MAIN}" \
  -d "${DOMAIN_API}" \
  --email "${EMAIL}" \
  --agree-tos --no-eff-email \
  ${STAGING_ARG}

$DOCKER_COMPOSE --env-file "$ENV_FILE" -f docker-compose.prod.yml exec nginx nginx -s reload

# Optional: clean up any residual dummy dirs (after successful issuance)
[ -d "${DATA_PATH}/conf/live/${DOMAIN_MAIN}" ] && [ -f "${DATA_PATH}/conf/live/${DOMAIN_MAIN}/privkey.pem" ] || true
[ -d "${DATA_PATH}/conf/live/${DOMAIN_API}" ] && [ -f "${DATA_PATH}/conf/live/${DOMAIN_API}/privkey.pem" ] || true

echo "Done."
