# Deployment (Linode + Docker + Nginx + MariaDB)

Este guia prepara o front estatico e a API Symfony em producao usando Docker, Nginx e MariaDB.

## 1) DNS

Crie os apontamentos A:

- notas.blendz.com.br -> 172.233.178.166
- api.notas.blendz.com.br -> 172.233.178.166

## 2) Instalar Docker no Linode (Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker
```

## 3) Subir o codigo no servidor

```bash
ssh root@172.233.178.166
mkdir -p /srv/notas
cd /srv/notas
# Faça upload do projeto (git clone ou rsync)
```

## 4) Ajustar variaveis de prod

Edite o arquivo:

- deploy/.env.prod

Troque `APP_SECRET` e `DB_ROOT_PASSWORD` por valores fortes.

## 5) Gerar certificados SSL (Let's Encrypt)

```bash
cd /srv/notas/deploy

chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

## 6) Subir toda a stack

```bash
cd /srv/notas/deploy

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## 7) Rodar migrations e seeds

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api \
  php bin/console doctrine:migrations:migrate --no-interaction

# Opcional: seed
# docker compose -f docker-compose.prod.yml --env-file .env.prod exec api \
#   php bin/console app:seed-project-statuses
```

## 8) Validar endpoints

```bash
curl -s https://api.notas.blendz.com.br/api/health
```

## Renovacao automatica do SSL

Crie um cron para renovar:

```bash
crontab -e
```

Adicione:

```bash
0 3 * * * cd /srv/notas/deploy && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Observacoes

- O front em produção usa `https://api.notas.blendz.com.br` como base da API; em desenvolvimento, `http://localhost:8000`.
- O caminho legacy `/apis/public/index.php` foi descontinuado no front e só deve ser mantido em Nginx por compatibilidade de acessos antigos, se necessário.
- A API responde diretamente em `https://api.notas.blendz.com.br`.
