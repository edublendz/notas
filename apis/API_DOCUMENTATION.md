# API REST - Notas Fiscais

API completa em Symfony 7.4 para gerenciar notas fiscais, despesas, reembolsos e projetos.

## Setup

### 1. Configurar banco de dados

O arquivo `.env.local` já está configurado com:
```
DATABASE_URL="mysql://root:@127.0.0.1:3306/notas?serverVersion=mariadb-10.4.32&charset=utf8mb4"
```

Certifique-se de que o banco `notas` existe no MySQL/MariaDB.

### 2. Instalar dependências

```bash
cd apis
composer install
```

### 3. Rodar a aplicação

```bash
# Rodar em desenvolvimento
symfony server:start

# Ou Using PHP built-in server
php -S 127.0.0.1:8000 -t public
```

## Rotas disponíveis

### Health Check
- `GET /api/health` - Verifica o status da API

### Autenticação (Sem proteção JWT)
- `POST /api/auth/login` - Login com email+senha, retorna JWT token
- `POST /api/auth/refresh` - Renovar JWT token expirado
- `GET /api/auth/me` - Obter informações do usuário autenticado

**Exemplo de Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"master@corp.com", "password":"123456"}'

# Response:
# {
#   "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
#   "user": {"id": 1, "name": "Master", "email": "master@corp.com", "role": "MASTER"},
#   "expiresIn": 3600
# }
```

**Usar o token em requisições protegidas:**
```bash
curl http://localhost:8000/api/projects?tenantId=1 \
  -H "Authorization: Bearer <seu_token>"
```

### Tenants
- `GET /api/tenants` - Listar tenants (com paginação)
- `GET /api/tenants/{id}` - Obter tenant por ID
- `POST /api/tenants` - Criar novo tenant
- `PUT /api/tenants/{id}` - Atualizar tenant
- `DELETE /api/tenants/{id}` - Deletar tenant

### Projetos
- `GET /api/projects?tenantId={id}` - Listar projetos
- `GET /api/projects/{id}` - Obter projeto por ID
- `POST /api/projects` - Criar novo projeto
- `PUT /api/projects/{id}` - Atualizar projeto
- `DELETE /api/projects/{id}` - Deletar projeto

### Clientes
- `GET /api/clients?tenantId={id}` - Listar clientes
- `GET /api/clients/{id}` - Obter cliente por ID
- `POST /api/clients` - Criar novo cliente
- `PUT /api/clients/{id}` - Atualizar cliente
- `DELETE /api/clients/{id}` - Deletar cliente

### Despesas (OS)
- `GET /api/expenses?tenantId={id}&statusId={id}` - Listar despesas
- `GET /api/expenses/{id}` - Obter despesa por ID
- `POST /api/expenses` - Criar nova despesa
- `PUT /api/expenses/{id}` - Atualizar despesa
- `DELETE /api/expenses/{id}` - Deletar despesa

### Reembolsos
- `GET /api/reimbursements?tenantId={id}` - Listar reembolsos
- `GET /api/reimbursements/{id}` - Obter reembolso por ID
- `POST /api/reimbursements` - Criar novo reembolso
- `PUT /api/reimbursements/{id}` - Atualizar reembolso
- `DELETE /api/reimbursements/{id}` - Deletar reembolso

### Notas Fiscais
- `GET /api/invoices?tenantId={id}` - Listar notas fiscais
- `GET /api/invoices/{id}` - Obter nota fiscal por ID
- `POST /api/invoices` - Criar nova nota fiscal
- `PUT /api/invoices/{id}` - Atualizar nota fiscal
- `DELETE /api/invoices/{id}` - Deletar nota fiscal

### Serviços
- `GET /api/services?tenantId={id}` - Listar serviços
- `GET /api/services/{id}` - Obter serviço por ID
- `POST /api/services` - Criar novo serviço
- `PUT /api/services/{id}` - Atualizar serviço
- `DELETE /api/services/{id}` - Deletar serviço

### Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/{id}` - Obter usuário por ID
- `POST /api/users` - Criar novo usuário
- `PUT /api/users/{id}` - Atualizar usuário
- `DELETE /api/users/{id}` - Deletar usuário

## Exemplos de Uso

### Criar um Projeto

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": 1,
    "code": "PROJ-001",
    "name": "Meu Projeto",
    "statusId": 1,
    "valueTotal": "50000.00",
    "costPlanned": "25000.00"
  }'
```

### Listar Despesas

```bash
curl http://localhost:8000/api/expenses?tenantId=1&page=1&limit=20
```

### Criar Despesa

```bash
curl -X POST http://localhost:8000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": 1,
    "projectId": 1,
    "serviceId": 1,
    "statusId": 1,
    "value": "150.50",
    "dateBuy": "2026-02-06",
    "description": "Transporte",
    "complement": "Uber"
  }'
```

### Atualizar Despesa

```bash
curl -X PUT http://localhost:8000/api/expenses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "value": "200.00",
    "statusId": 2
  }'
```

## Estrutura de Dados

### Entity Relationships

```
Tenant (multi-tenant)
  ├── User (usuários da aplicação)
  ├── Client (clientes do tenant)
  ├── Project (projetos)
  │   └── Expense (despesas do projeto)
  │   └── Reimbursement (reembolsos)
  │   └── InvoiceItem (itens de NF)
  ├── Service (serviços)
  ├── Invoice (notas fiscais)
  │   └── InvoiceItem
  │   └── InvoiceExpense (associação com despesas)
  └── AuditLog (log de auditoria)
```

## Entidades Criadas

1. **Tenant** - Organização/Empresa
2. **User** - Usuário do sistema
3. **Role** - Função/Perfil (Master, Operador)
4. **UserStatus** - Status do usuário (Aprovado, Pendente, etc)
5. **UserTenant** - Associação usuário-tenant
6. **Client** - Grande negócio
7. **Project** - Projeto do cliente
8. **ProjectStatus** - Status do projeto
9. **ProjectUser** - Associação projeto-usuário
10. **Service** - Tipo de serviço
11. **Expense** - Despesa/OS
12. **ExpenseStatus** - Status da despesa
13. **Reimbursement** - Reembolso
14. **ReimbursementStatus** - Status do reembolso
15. **ReimbursementType** - Tipo de reembolso
16. **Invoice** - Nota fiscal
17. **InvoiceStatus** - Status da NF
18. **InvoiceItem** - Item da NF
19. **InvoiceExpense** - Associação NF-Despesa
20. **Sale** - Venda
21. **SaleType** - Tipo de venda
22. **Invite** - Convite de usuário
23. **Session** - Sessão de login
24. **UserPreference** - Preferências do usuário
25. **AuditLog** - Log de auditoria

## Controllers Criados

- `BaseController` - Classe base com helpers
- `ProjectController` - CRUD de projetos
- `ClientController` - CRUD de clientes
- `ExpenseController` - CRUD de despesas
- `InvoiceController` - CRUD de notas fiscais
- `ReimbursementController` - CRUD de reembolsos
- `ServiceController` - CRUD de serviços
- `UserController` - CRUD de usuários
- `TenantController` - CRUD de tenants

## Próximos Passos

1. ✅ Entities Doctrine - COMPLETO
2. ✅ Controllers REST com CRUD - COMPLETO
3. ✅ Repositories - COMPLETO
4. ⏳ DTOs Request/Response - EM PROGRESSO
5. ⏳ Services de Negócio - EM PROGRESSO
6. ⏳ Autenticação/Autorização - PENDENTE
7. ⏳ Validação advanced - PENDENTE
8. ⏳ Testes unitários - PENDENTE

## Notas Importantes

- A API retorna JSON em todos os endpoints
- Erros retornam `{ "error": "mensagem" }`
- Validações retornam `{ "errors": { "campo": "mensagem" } }`
- Todas as operações estão isoladas por `tenantId` (multi-tenant)
- Senhas de usuário são hashed (nunca exponha no response)
- Paginação padrão: `page=1, limit=20`
