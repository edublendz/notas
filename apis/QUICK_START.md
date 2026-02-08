# ⚡ Quick Start - Autenticação JWT

Guia passo a passo para colocar a autenticação JWT funcionando.

## 1️⃣ Instalar Dependências

```bash
cd c:\xampp\htdocs\notas\apis

# Instalar JWT
composer require lcobucci/jwt

# Instalar Doctrine (se ainda não tiver)
composer require symfony/orm-pack
```

## 2️⃣ Configurar Variáveis de Ambiente

Editar `.env.local` e adicionar/verificar:

```env
# Gerar uma chave segura:
APP_SECRET=your-secret-key-changed-to-something-random

DATABASE_URL="mysql://root:@127.0.0.1:3306/notas?serverVersion=mariadb-10.4.32&charset=utf8mb4"

DEFAULT_URI=http://api.notas.local
```

Para gerar uma chave segura, execute:
```bash
php -r 'echo bin2hex(random_bytes(24));'
```

## 3️⃣ Verificar config/services.yaml

O arquivo deve ter este conteúdo (ou similar):

```yaml
services:
  _defaults:
    autowire: true
    autoconfigure: true

  App\Service\JwtTokenProvider:
    arguments:
      $appSecret: '%env(APP_SECRET)%'

  App\EventSubscriber\AuthenticationSubscriber:
    tags:
      - { name: kernel.event_subscriber }
```

Se o arquivo não existe, criar em `apis/config/services.yaml`.

## 4️⃣ Limpar Cache (se necessário)

```bash
php bin/console cache:clear
# ou
rm -rf var/cache/*
```

## 5️⃣ Rodar a API

```bash
cd c:\xampp\htdocs\notas\apis

# Usando PHP built-in server
php -S 127.0.0.1:8000 -t public

# Ou usando Symfony CLI
symfony server:start
```

A API estará disponível em: `http://localhost:8000`

## 6️⃣ Testar a Autenticação

### A. Health Check (sem autenticação)

```bash
curl http://localhost:8000/api/health
```

Response:
```json
{
  "status": "ok",
  "ts": "2026-02-06T10:30:00+00:00"
}
```

### B. Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "master@corp.com",
    "password": "123456"
  }'
```

Response:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "Master",
    "email": "master@corp.com",
    "role": "MASTER"
  },
  "expiresIn": 3600
}
```

Copiar o valor de `token`.

### C. Obter Informações do Usuário

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### D. Listar Projetos (protegido)

```bash
curl "http://localhost:8000/api/projects?tenantId=1" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 7️⃣ Usuários de Teste

Os seguintes usuários já existem no banco:

```
Email: master@corp.com
Senha: 123456
Role: MASTER
Tenant: Todas

Email: talita@vdt.com.br
Senha: 123456
Role: OPERADOR
Tenant: Vou de Trip (ID: 3)
```

## 🧪 Testar Tudo Automaticamente

Se tiver `bash` (Git Bash, WSL, ou Linux):

```bash
cd c:\xampp\htdocs\notas\apis

# Executar script de teste
bash test-auth.sh
```

## 📝 Exemplos Completos

### JavaScript - Login e Requisições

```javascript
// 1. Login
async function login() {
  const response = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'master@corp.com',
      password: '123456'
    })
  });

  const data = await response.json();
  const token = data.token;
  
  // Armazenar token
  localStorage.setItem('jwt_token', token);
}

// 2. Fazer requisição com token
async function getProjects() {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(
    'http://localhost:8000/api/projects?tenantId=1',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
}

// Uso:
await login();
const projects = await getProjects();
console.log(projects);
```

### Python - Exemplo com Requests

```python
import requests

BASE_URL = 'http://localhost:8000'

# 1. Login
response = requests.post(f'{BASE_URL}/api/auth/login', json={
    'email': 'master@corp.com',
    'password': '123456'
})

data = response.json()
token = data['token']

# 2. Usar token
headers = {'Authorization': f'Bearer {token}'}
response = requests.get(
    f'{BASE_URL}/api/projects?tenantId=1',
    headers=headers
)

print(response.json())
```

## ❌ Troubleshooting

### Erro: "Attribute class 'Lcobucci\JWT' not found"

```bash
composer require lcobucci/jwt
php bin/console cache:clear
```

### Erro: "APP_SECRET not defined"

Editar `.env.local` e adicionar:
```
APP_SECRET=your-secret-key
```

### Erro 401: "Token não fornecido"

Verificar se está usando o header correto:
```
Authorization: Bearer TOKEN_AQUI
```

Não usar:
```
Authorization: TOKEN_AQUI (sem Bearer)
Authorization: JWT TOKEN_AQUI (JWT é para Lcobucci)
```

### Erro: "Token inválido"

Verificar:
- Token não expirou (< 1 hora)
- APP_SECRET é o mesmo
- Token não foi alterado

## ✅ Checklist

- [x] Composer require lcobucci/jwt
- [x] .env.local com APP_SECRET
- [x] config/services.yaml configurado
- [x] API rodando em localhost:8000
- [x] POST /api/auth/login retorna token
- [x] GET /api/auth/me com token funciona
- [x] Endpoints protegidos exigem token
- [x] Token expirado retorna 401

## 📚 Documentação Completa

- [AUTHENTICATION.md](AUTHENTICATION.md) - Documentação de autenticação
- [CONFIGURATION.md](CONFIGURATION.md) - Configuração de serviços
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Todas as rotas

## 🚀 Próximo Passo

Agora pode integrar com o frontend JavaScript (store.js, app.js) para usar as APIs reais!
