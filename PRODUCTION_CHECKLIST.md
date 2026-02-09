# Checklist Final de Deploy - Produção

**Data:** 09/02/2026  
**Servidor:** Linode 172.233.178.166  
**Domínios:** notas.blendz.com.br | api.notas.blendz.com.br

---

## ✅ PRÉ-REQUISITOS

### 1. Código & Segurança
- [x] Rate limiting implementado e testado
- [x] CORS headers configurados
- [x] Credenciais fortes em `.env.prod`
- [x] Bcrypt para senhas
- [x] JWT Authentication
- [x] Sistema de auditoria
- [x] Multi-tenant isolation
- [x] Bug do store.js corrigido (detecção de ambiente)

### 2. Testes Locais
- [x] API health check funcionando (`http://localhost:8000/api/health`)
- [x] Login funcionando com rate limiting
- [x] Migrations aplicadas em dev
- [x] Frontend detectando ambiente corretamente
- [x] Scripts de teste criados e documentados

### 3. Arquivos de Deploy
- [x] `deploy/.env.prod` com credenciais seguras
- [x] `deploy/docker-compose.prod.yml` configurado
- [x] `deploy/nginx/notas.conf` com SSL
- [x] `apis/Dockerfile` otimizado para prod

---

## 🚀 PASSOS PARA DEPLOY

### PASSO 1: Configurar DNS (Se ainda não foi feito)

**No painel do domínio (Registro.br, GoDaddy, etc):**

```
Tipo: A
Host: notas
Valor: 172.233.178.166
TTL: 3600

Tipo: A
Host: api.notas
Valor: 172.233.178.166
TTL: 3600
```

**Validar:**
```bash
nslookup notas.blendz.com.br
nslookup api.notas.blendz.com.br
```

Ambos devem retornar: `172.233.178.166`

---

### PASSO 2: Acessar Servidor

```bash
ssh root@172.233.178.166
```

---

### PASSO 3: Instalar Docker (Se necessário)

```bash
# Verificar se já está instalado
docker --version
docker compose version

# Se não estiver instalado, executar:
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

---

### PASSO 4: Fazer Upload do Código

**Opção A: Git (Recomendado)**
```bash
# No servidor
cd /srv
git clone git@github.com:edublendz/notas.git
cd notas
```

**Opção B: rsync (da máquina local)**
```bash
# Da sua máquina Windows (no PowerShell)
# Instalar rsync se necessário: choco install rsync

rsync -avz --exclude 'node_modules' --exclude '.git' \
  --exclude 'apis/vendor' --exclude 'apis/var/cache' \
  C:\xampp\htdocs\notas/ root@172.233.178.166:/srv/notas/
```

---

### PASSO 5: Verificar .env.prod (NO SERVIDOR)

```bash
cd /srv/notas/deploy
cat .env.prod

# Deve mostrar:
# APP_SECRET=85cd36cd2cb650881af198849538b4bcbb0254874907ded83e71b6362eb85c0a
# DB_PASSWORD=97af80f5d4f90ae109f50585ca4a355d
# DB_ROOT_PASSWORD=098edc6fdbd96173aac0179f1db6e94f
```

⚠️ **IMPORTANTE:** Se as senhas estiverem erradas, edite o arquivo:
```bash
nano /srv/notas/deploy/.env.prod
# Cole as credenciais corretas
# Ctrl+O para salvar, Ctrl+X para sair
```

---

### PASSO 6: Gerar Certificados SSL

```bash
cd /srv/notas/deploy

# Tornar script executável
chmod +x init-letsencrypt.sh

# Executar geração de certificados
./init-letsencrypt.sh
```

**O que o script faz:**
1. Inicia Nginx temporário para validação do domínio
2. Solicita certificados ao Let's Encrypt para:
   - `notas.blendz.com.br`
   - `api.notas.blendz.com.br`
3. Armazena certificados em `./certbot/conf/`

**Se der erro:**
- Verifique se DNS está apontando corretamente
- Aguarde propagação do DNS (pode levar até 24h)
- Tente novamente após 30 minutos

---

### PASSO 7: Subir Containers Docker

```bash
cd /srv/notas/deploy

# Build e start de todos os serviços
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

**Containers criados:**
- `api` - Symfony API (PHP-FPM)
- `nginx` - Servidor web + proxy reverso
- `db` - MariaDB 10.11.7
- `certbot` - Renovação automática de SSL

**Verificar status:**
```bash
docker compose -f docker-compose.prod.yml ps
```

Todos devem estar `Up`.

---

### PASSO 8: Rodar Migrations

```bash
cd /srv/notas/deploy

docker compose -f docker-compose.prod.yml --env-file .env.prod exec api \
  php bin/console doctrine:migrations:migrate --no-interaction
```

**Expected output:**
```
[OK] Database migrated successfully!
```

---

### PASSO 9: Seed de Dados Iniciais (Opcional)

```bash
# Seed de status de projetos
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api \
  php bin/console app:seed-project-statuses

# Outros seeds conforme necessário
```

---

### PASSO 10: Validar Endpoints

**Health Check:**
```bash
curl -s https://api.notas.blendz.com.br/api/health
# Deve retornar: {"status":"ok","ts":"..."}
```

**Login:**
```bash
curl -X POST https://api.notas.blendz.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"master@corp.com","password":"123456"}'

# Deve retornar: {"token":"...","user":{...},...}
```

**Frontend:**
```bash
curl -I https://notas.blendz.com.br
# Deve retornar: HTTP/2 200
```

---

### PASSO 11: Testar no Navegador

1. Abrir: `https://notas.blendz.com.br`
2. Fazer login com credenciais válidas
3. Navegar pelas views (Dashboard, Expenses, etc)
4. Verificar chamadas à API no DevTools (Network)

**Testar Rate Limiting:**
1. Fazer logout
2. Tentar login com senha errada 11 vezes
3. Na 11ª tentativa deve aparecer: "Muitas tentativas de login..."

---

### PASSO 12: Configurar Renovação Automática do SSL

```bash
# Editar crontab
crontab -e

# Adicionar linha (renova às 3h da manhã todo dia):
0 3 * * * cd /srv/notas/deploy && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### Logs em Tempo Real

```bash
cd /srv/notas/deploy

# Todos os logs
docker compose -f docker-compose.prod.yml logs -f

# Apenas API
docker compose -f docker-compose.prod.yml logs -f api

# Apenas Nginx
docker compose -f docker-compose.prod.yml logs -f nginx

# Apenas Database
docker compose -f docker-compose.prod.yml logs -f db
```

### Verificar Banco de Dados

```bash
# Conectar ao MySQL
docker compose -f docker-compose.prod.yml exec db \
  mysql -u notas -p97af80f5d4f90ae109f50585ca4a355d notas

# Comandos úteis:
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

### Limpar Cache da API

```bash
docker compose -f docker-compose.prod.yml exec api \
  php bin/console cache:clear --env=prod
```

---

## 🔒 SEGURANÇA PÓS-DEPLOY

### Firewall (UFW)

```bash
# Permitir apenas portas essenciais
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirect para HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### Backup do Banco

```bash
# Criar backup
docker compose -f docker-compose.prod.yml exec db \
  mysqldump -u notas -p97af80f5d4f90ae109f50585ca4a355d notas \
  > backup-$(date +%Y%m%d).sql

# Restaurar backup
docker compose -f docker-compose.prod.yml exec -T db \
  mysql -u notas -p97af80f5d4f90ae109f50585ca4a355d notas \
  < backup-20260209.sql
```

---

## ⚠️ TROUBLESHOOTING

### Erro: "Connection refused"
```bash
# Verificar se containers estão rodando
docker compose -f docker-compose.prod.yml ps

# Reiniciar serviços
docker compose -f docker-compose.prod.yml restart
```

### Erro: "502 Bad Gateway"
```bash
# Verificar logs do PHP-FPM
docker compose -f docker-compose.prod.yml logs api

# Verificar se API está escutando
docker compose -f docker-compose.prod.yml exec api netstat -tlnp | grep 9000
```

### Erro: "Certificate not found"
```bash
# Regerar certificados
cd /srv/notas/deploy
./init-letsencrypt.sh
```

### Rate Limit muito agressivo
```bash
# Ajustar constantes em apis/src/Service/LoginRateLimiter.php
# MAX_ATTEMPTS = 10
# WINDOW_SECONDS = 900 (15 min)
# LOCKOUT_SECONDS = 300 (5 min)

# Rebuild
docker compose -f docker-compose.prod.yml up -d --build api
```

---

## ✅ CHECKLIST FINAL

Após deploy, validar:

- [ ] DNS apontando corretamente
- [ ] HTTPS funcionando (cadeado verde no navegador)
- [ ] Frontend carregando sem erros no console
- [ ] Login funcionando
- [ ] Rate limiting ativo
- [ ] CORS headers presentes (verificar no Network tab)
- [ ] Auditoria registrando ações (verificar tabela `audit_logs`)
- [ ] Migrations aplicadas
- [ ] Cron de renovação SSL configurado
- [ ] Firewall ativo
- [ ] Backup do banco funcionando

---

## 🎉 DEPLOY COMPLETO!

Se todos os itens acima estão ✅, a aplicação está **100% em produção**!

**Próximos passos:**
1. Monitorar logs por 24-48h
2. Configurar alertas (Uptime Robot, etc)
3. Implementar backup automatizado
4. Documentar procedimentos de manutenção
