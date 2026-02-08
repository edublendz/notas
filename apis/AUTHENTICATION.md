# Autenticação JWT - API REST

Sistema de autenticação baseado em JWT tokens.

## Como Funciona

1. **Login** - Envia email + senha e recebe um token JWT
2. **Usar Token** - Inclui o token no header `Authorization: Bearer <token>`
3. **Validação** - API valida o token antes de processar requisição
4. **Expiração** - Token expira em 1 hora (3600 segundos)
5. **Refresh** - Renovar o token com um novo

## Endpoints de Autenticação

### 1. Login - POST /api/auth/login

Autentica um usuário e retorna um JWT token.

**Request:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "master@corp.com",
    "password": "123456"
  }'
```

**Response (200 OK):**
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

**Errors:**
- 422 - Email ou senha vazio
- 401 - Email ou senha inválidos

### 2. Refresh Token - POST /api/auth/refresh

Renova um token JWT válido.

**Request:**
```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Response (200 OK):**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 3600
}
```

### 3. Get User Info - GET /api/auth/me

Retorna informações do usuário autenticado.

**Request:**
```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Master",
  "email": "master@corp.com",
  "role": "MASTER",
  "active": true
}
```

## Usando o Token

### Em Requisições Autenticadas

Todos os endpoints protegidos exigem o header `Authorization`:

```bash
# GET /api/projects com autenticação
curl http://localhost:8000/api/projects?tenantId=1 \
  -H "Authorization: Bearer <seu_token_aqui>"

# POST /api/expenses com autenticação
curl -X POST http://localhost:8000/api/expenses \
  -H "Authorization: Bearer <seu_token_aqui>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": 1,
    "statusId": 1,
    "value": "150.50",
    "dateBuy": "2026-02-06"
  }'
```

### Sem Token

Se tentar acessar um endpoint protegido sem token:

```bash
curl http://localhost:8000/api/projects?tenantId=1
```

**Response (401 Unauthorized):**
```json
{
  "error": "Token de autenticação não fornecido"
}
```

### Token Expirado

Se o token expirou:

**Response (401 Unauthorized):**
```json
{
  "error": "Token inválido ou expirado"
}
```

**Solução**: Usar endpoint `/api/auth/refresh` para gerar um novo token.

## Rotas Públicas (Sem Autenticação)

Essas rotas **não precisam** de token:

- `GET /api/health` - Verificar status da API
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/refresh` - Renovar token

## Fluxo Completo de Autenticação

```
1. Client faz Login
   POST /api/auth/login
   {"email": "...", "password": "..."}
   ↓
   Response: {"token": "...", "expiresIn": 3600}

2. Client armazena o token (localStorage ou sessionStorage)

3. Client faz requisição protegida
   GET /api/projects
   Header: Authorization: Bearer <token>
   ↓
   Response: {"data": [...]}

4. Se token expirar
   POST /api/auth/refresh
   Header: Authorization: Bearer <token_expirado>
   ↓
   Response: {"token": "...", "expiresIn": 3600}

5. Client atualiza o token armazenado
```

## Usuários de Teste

Com base no dump do banco fornecido:

| Email | Senha | Tenant | Role |
|-------|-------|--------|------|
| master@corp.com | 123456 | todas | MASTER |
| diego@diapason.com.br | 123456 | Diapason | MASTER |
| eduardo@vdt.com.br | 123456 | VDT | MASTER |
| talita@vdt.com.br | 123456 | VDT | OPERADOR |
| batata@diapason.com.br | 123456 | Diapason | OPERADOR |

**Nota**: As senhas no dump são SHA256 hashes. Use `123456` como senha de teste.

## Implementação no Frontend (JavaScript)

### 1. Login e Armazenar Token

```javascript
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  
  if (response.ok) {
    // Armazenar token
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return true;
  }
  
  console.error(data.error);
  return false;
}
```

### 2. Fazer Requisições com Token

```javascript
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('jwt_token');
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, options);
  
  if (response.status === 401) {
    // Token expirou - tentar refresh
    await refreshToken();
    // Repetir requisição
    return apiCall(endpoint, method, body);
  }

  return response.json();
}
```

### 3. Renovar Token

```javascript
async function refreshToken() {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('jwt_token', data.token);
    return true;
  }

  // Token inválido - fazer login novamente
  logout();
  return false;
}

function logout() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
```

### 4. Uso em Componentes

```javascript
// Listar projetos
const projects = await apiCall('/api/projects?tenantId=1');

// Criar despesa
const expense = await apiCall('/api/expenses', 'POST', {
  tenantId: 1,
  statusId: 1,
  value: '150.50',
  dateBuy: '2026-02-06'
});
```

## Segurança

⚠️ **Em Produção**:

1. **Use HTTPS** - Nunca transmita tokens em HTTP
2. **Use bcrypt** - Para hash de senhas (não SHA256)
3. **Aumente expiração** - Ajuste 3600 segundos conforme necessário
4. **Rotate secret** - Altere `APP_SECRET` em `.env`
5. **CORS** - Configure adequadamente para seus domínios
6. **Rate limiting** - Limitar tentativas de login

## Troubleshooting

### "Attribute class 'Lcobucci\JWT' not found"

Instalar JWT:
```bash
composer require lcobucci/jwt
```

### "Token inválido ou expirado"

Verifique:
- Token está no formato correto
- Token não expirou (< 3600 segundos)
- `APP_SECRET` é a mesma

### "Token de autenticação não fornecido"

Verificar header `Authorization`:
```
Authorization: Bearer <token>
```

Não esquecer `Bearer` antes do token!
