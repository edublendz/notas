# Checklist Final de Deploy - Produção

**Data:** 09/02/2026  
**Servidor:** Linode 172.233.178.166  
**Domínios:**
- ✅ notas.blendz.com.br (DNS configurado)
- ⏳ api.notas.blendz.com.br (será configurado manualmente)

**Status do Código:** Já no servidor via git (git push prod main)  
**Banco de Dados:** Backup .sql disponível (sem necessidade de migrations)

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

### 2. Banco de Dados
- [x] Backup .sql pronto
- [x] Não precisa rodar migrations

### 3. Documentação
- [x] Este checklist
- [x] SECURITY_IMPLEMENTATION.md
- [x] DEPLOYMENT.md

---

## 🚀 PASSOS PARA DEPLOY

### PASSO 1: Configurar DNS para api.notas.blendz.com.br (Manual)

**No painel do domínio:**

```
Tipo: A
Host: api.notas
Valor: 172.233.178.166
TTL: 3600
```

**Validar:**
```bash
nslookup api.notas.blendz.com.br
# Deve retornar: 172.233.178.166
```

Aguarde propagação (pode levar alguns minutos).

---

### PASSO 2: Acessar Servidor

```bash
ssh root@172.233.178.166
```

---

### PASSO 3: Instalar Docker

```bash
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

# Adicionar usuário ao grupo docker (se não for root)
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker --version
docker compose version
```

---

### PASSO 4: Verificar Código no Servidor

```bash
cd /var/repo/notas  # ou onde o código está clonado
ls -la

# Verificar se está na branch correta
git status
git branch -a
```

---

### PASSO 5: Verificar .env.prod

```bash
cd deploy
cat .env.prod

# Deve ter:
# APP_SECRET=85cd36cd2cb650881af198849538b4bcbb0254874907ded83e71b6362eb85c0a
# DB_PASSWORD=97af80f5d4f90ae109f50585ca4a355d
# DB_ROOT_PASSWORD=098edc6fdbd96173aac0179f1db6e94f
```

---

### PASSO 6: Gerar Certificados SSL

```bash
cd deploy

# Tornar script executável
chmod +x init-letsencrypt.sh

# Executar geração (vai pedir os domínios)
./init-letsencrypt.sh

# O script pedirá:
# - Email para renovação automática
# - Confirmação dos domínios:
#   - notas.blendz.com.br
#   - api.notas.blendz.com.br
```

**Se der erro de DNS:**
- Aguarde propagação do DNS
- Tente novamente em poucos minutos

---

### PASSO 7: Subir Aplicação

```bash
cd /path/to/notas/deploy

# Build e start
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Aguarde (pode levar 2-3 minutos na primeira vez)
sleep 10

# Verificar status
docker compose -f docker-compose.prod.yml ps
```

**Esperado:**
```
NAME            STATUS
api             Up (healthy)
nginx           Up
db              Up
certbot         Up
```

---

### PASSO 8: Restaurar Banco de Dados

```bash
# Se o arquivo .sql está localmente
scp backup.sql root@172.233.178.166:/srv/notas/deploy/

# No servidor
cd /srv/notas/deploy

# Restaurar
docker compose -f docker-compose.prod.yml exec -T db \
  mysql -u notas -p97af80f5d4f90ae109f50585ca4a355d notas < backup.sql

# Verificar import
docker compose -f docker-compose.prod.yml exec db \
  mysql -u notas -p97af80f5d4f90ae109f50585ca4a355d notas -e "SELECT COUNT(*) as users FROM users;"
```

---

### PASSO 9: Validar Endpoints

**Health Check:**
```bash
curl -s https://api.notas.blendz.com.br/api/health
# { "status": "ok", "ts": "..." }
```

**Login:**
```bash
curl -X POST https://api.notas.blendz.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"master@corp.com","password":"123456"}'

# { "token": "...", "user": {...} }
```

**Frontend:**
```bash
curl -s -I https://notas.blendz.com.br/
# HTTP/2 200
```

---

### PASSO 10: Testar no Navegador

1. Abrir: `https://notas.blendz.com.br`
2. Login com credenciais
3. Verificar console (DevTools) para erros
4. Testar algumas ações (criar projeto, etc)

---

### PASSO 11: Configurar Auto-Deploy via Git

Sua configuração já está pronta! Quando você faz:
```bash
git push prod main
```

O código é atualizado no servidor. Você pode automatizar a reconstrução:

```bash
# No servidor, criar post-receive hook
cat > /var/repo/notas.git/hooks/post-receive << 'EOF'
#!/bin/bash
cd /srv/notas
git pull origin main
cd deploy
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml exec -T api php bin/console cache:clear --env=prod
EOF

chmod +x /var/repo/notas.git/hooks/post-receive
```

Agora cada `git push prod main` vai:
1. Atualizar código
2. Reconstruir containers
3. Limpar cache

---

### PASSO 12: Configurar Renovação Automática do SSL

```bash
crontab -e

# Adicionar linha:
0 3 * * * cd /srv/notas/deploy && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 📊 MONITORAMENTO

### Logs em Tempo Real

```bash
cd /srv/notas/deploy

# Todos
docker compose -f docker-compose.prod.yml logs -f

# API apenas
docker compose -f docker-compose.prod.yml logs -f api

# Nginx apenas
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Backup Regular

```bash
# Criar backup diário
docker compose -f docker-compose.prod.yml exec db \
  mysqldump -u notas -p97af80f5d4f90ae109f50585ca4a355d notas \
  > backup-$(date +%Y%m%d-%H%M%S).sql
```

---

## ⚠️ TROUBLESHOOTING

### Erro: "502 Bad Gateway"
```bash
docker compose -f docker-compose.prod.yml logs api
docker compose -f docker-compose.prod.yml restart api
```

### Erro: "Connection refused" no banco
```bash
docker compose -f docker-compose.prod.yml logs db
docker compose -f docker-compose.prod.yml restart db
```

### Erro: "Certificate not found"
```bash
cd deploy
./init-letsencrypt.sh
docker compose -f docker-compose.prod.yml restart nginx
```

### Rate limit muito agressivo
```bash
# Ajustar em apis/src/Service/LoginRateLimiter.php
# Depois fazer git push para rebuild
docker compose -f docker-compose.prod.yml up -d --build api
```

---

## ✅ CHECKLIST FINAL

Após deploy, validar:

- [ ] DNS apontando (`nslookup api.notas.blendz.com.br`)
- [ ] HTTPS funcionando (cadeado verde)
- [ ] Frontend carregando sem erros
- [ ] Login funcionando
- [ ] Banco com dados importados
- [ ] Rate limiting ativo
- [ ] CORS headers presentes
- [ ] Auditoria registrando
- [ ] Cron de SSL configurado
- [ ] Logs limpinhos (sem erros)

---

## 🎉 PRONTO!

Aplicação está 100% em produção!

**Monitorar por 24-48h para garantir estabilidade.**
