# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [2.1] - 2026-02-09

### ✨ Adicionado

#### Implementações de Segurança para Produção

**Rate Limiting no Login**
- ✅ Proteção contra brute force attacks
- ✅ Máximo 10 tentativas por IP em 15 minutos
- ✅ Bloqueio de 5 minutos após atingir o limite (HTTP 429)
- ✅ Armazenamento persistente em sistema de arquivos (`var/rate_limit/`)
- ✅ Suporte a proxies (X-Forwarded-For)
- ✅ Reset automático após login bem-sucedido

**CORS Headers Explícitos**
- ✅ Headers CORS configurados em todas as responses
- ✅ Whitelist de origins em produção
- ✅ Suporte completo a preflight (OPTIONS)
- ✅ Diferenciação entre ambiente dev e prod

**Credenciais Fortes**
- ✅ APP_SECRET de 64 caracteres (256 bits)
- ✅ Senhas de banco geradas com 32 caracteres (128 bits)
- ✅ Arquivo `.env.prod` atualizado com valores seguros

**Scripts de Teste Automatizados**
- ✅ Estrutura organizada em `scripts/tests/`
- ✅ `test-rate-limit.ps1` - Validação automática de rate limiting
- ✅ `clear-rate-limit.ps1` - Limpa arquivos de rate limit
- ✅ Documentação completa em `scripts/tests/README.md`
- ✅ Output colorido e mensagens claras

### 🐛 Corrigido

**Rate Limiting não funcionava no Frontend**
- ✅ Corrigido `store.js` para usar detecção de ambiente (localhost:8000 vs produção)
- ✅ Login agora respeita rate limiting em desenvolvimento
- ✅ Alinhado com padrão usado em todos os outros módulos (expenses.js, dashboard.js, etc)

#### Sistema de Auditoria Completo

**Auditoria Automática (DoctrineAuditSubscriber)**
- ✅ Subscriber Doctrine configurado via `onFlush` para auditoria automática
- ✅ Registra automaticamente CREATE/UPDATE/DELETE de todas as entidades
- ✅ Uso correto de `persist()` + `computeChangeSet()` (sem `flush()` recursivo)
- ✅ Extração automática de informações representativas para campo `meta`:
  - Código (`getCode()`)
  - Nome/Título (`getName()`, `getTitle()`)
  - Descrição (primeiros 50 caracteres)
  - Email (para User)
- ✅ Captura automática de `actor_user_id` e `tenant_id` via JWT claims
- ✅ Entidades excluídas: `AuditLog` (evita loop infinito)

**Auditoria Manual (AuditService)**
- ✅ Serviço centralizado para ações de negócio específicas
- ✅ `logLogin()` - Registra login de usuário
- ✅ `logLogout()` - Registra logout de usuário
- ✅ `logTenantSwitch()` - Registra troca de empresa com detalhes (de X para Y)
- ✅ `logExpenseApprove()` / `logExpenseReject()` - Aprovação/rejeição de despesas
- ✅ `logInvoiceApprove()` / `logInvoiceReject()` - Aprovação/rejeição de notas fiscais
- ✅ `logReimbursementApprove()` / `logReimbursementReject()` - Aprovação/rejeição de reembolsos
- ✅ `logUserApprove()` / `logUserReject()` - Aprovação/rejeição de usuários
- ✅ `logInviteCreate()` / `logInviteAccept()` - Criação/aceitação de convites
- ✅ Remoção de `flush()` do `AuditService.log()` (evita duplo flush)

**Controllers com Auditoria**
- ✅ `AuthController` - LOGIN
- ✅ `UserPreferenceController` - TENANT_SWITCH (com meta detalhado)
- ✅ `ExpenseController` - APPROVE, REJECT
- ✅ `InvoiceController` - APPROVE, REJECT *(NOVO)*
- ✅ `ReimbursementController` - APPROVE, REJECT
- ✅ `InviteController` - CREATE, ACCEPT

**Frontend**
- ✅ View de auditoria em `views/audit.js`
- ✅ Exibição de logs com filtro MASTER/OPERADOR
- ✅ Colunas: Quando, Ação, Ator, Meta
- ✅ Formatação de datas em português

**Ferramentas de Diagnóstico**
- ✅ `DiagnosticAuditCommand` - Comando para diagnóstico completo do sistema de auditoria
  - Verifica se subscriber está registrado
  - Valida schema do AuditLog
  - Detecta problemas de configuração
  - Testa CREATE/UPDATE/DELETE em tempo real

### 🔧 Corrigido

- ✅ **Subscriber não rodava**: Alterada tag de `doctrine.event_subscriber` para `doctrine.event_listener` com `event: onFlush`
- ✅ **Duplo flush**: Removido `flush()` do `AuditService.log()` - agora só faz `persist()`
- ✅ **Meta vazio**: Implementada extração automática de informações da entidade

### 📋 Schema

**Tabela `audit_log`**
```sql
- id (bigint, PK, auto_increment)
- tenant_id (FK → tenants, nullable)
- actor_user_id (FK → users, nullable)
- action (varchar(64), NOT NULL) -- Ex: PROJECT_CREATE, EXPENSE_APPROVE
- entity_type (varchar(64), nullable) -- Ex: Project, Expense
- entity_id (bigint, nullable)
- meta (text, nullable) -- Informações representativas da entidade
- created_at (datetime, NOT NULL, default CURRENT_TIMESTAMP)
```

**Índices:**
- `idx_audit_tenant_date` (tenant_id, created_at)
- `idx_audit_actor_date` (actor_user_id, created_at)
- `idx_audit_entity` (entity_type, entity_id)

### 📝 Configuração

**services.yaml**
```yaml
App\EventSubscriber\DoctrineAuditSubscriber:
  tags:
    - { name: doctrine.event_listener, event: onFlush, connection: default }
```

### 🎯 Cobertura de Auditoria

**Automático (Subscriber):**
- Todas as entidades (27 mapeadas)
- CREATE, UPDATE, DELETE

**Manual (Controllers):**
- AUTH_LOGIN, AUTH_LOGOUT
- TENANT_SWITCH
- EXPENSE_APPROVE, EXPENSE_REJECT
- INVOICE_APPROVE, INVOICE_REJECT
- REIMBURSEMENT_APPROVE, REIMBURSEMENT_REJECT
- USER_APPROVE, USER_REJECT
- INVITE_CREATE, INVITE_ACCEPT

---

## Versões Anteriores

_Documentação em andamento_
