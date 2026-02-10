# Views Modulares - Estrutura

## Visão Geral

Este diretório contém os módulos de visualização (views) da aplicação, separados por funcionalidade. A meta é substituir o `views.js` monolítico por módulos pequenos, conectados diretamente à API.

## Estrutura Atual (principais)

```
views/
├── audit.js            Auditoria via API
├── clients.js          Clientes via API
├── dashboard.js        Dashboard via API
├── expenses.js         OS via API (CRUD completo)
├── invoices.js         Notas via API
├── invite-signup.js    Cadastro público via convite
├── invites.js          Convites (admin) via API
├── invites_backup.js   Backup legacy de convites
├── projects.js         Projetos via API
├── reimbursements.js   Reembolsos via API
├── services.js         Serviços via API
├── settings.js         Configurações do tenant via API
├── user-tenants.js     Vínculo usuário x tenant via API
├── users.js            Usuários (aprovação) via API
├── index.js            Agregador que sobrescreve NFViews
└── README.md           Este arquivo
```

## Status de Migração

### ✅ Concluído (API-first)
- expenses, reimbursements, invoices, projects, clients, services
- invites (admin) e invite-signup (público)
- users, user-tenants
- settings, audit, dashboard

### ⚠️ Pendente
- Remover dependência do `views.js` monolítico (ainda serve de fallback)
- Centralizar a configuração do API base (hoje cada módulo define `API_BASE` local)

## Padrões de Implementação

- Estrutura IIFE exportando `NFViewsX` para manter compatibilidade com `NFViews` global.
- Loading com spinner (`loading-container` + `spinner`).
- Normalizar dados antes de filtrar/paginar (IDs como string, status legíveis).
- Paginação quando lista > 50 itens; resetar página ao alterar filtros.
- Títulos via `setTitle()` e navegação via `NFApp.viewRouter`.

## API Base

Ambientes atuais:
- Dev: `http://localhost:8000`
- Produção: `https://api.notas.blendz.com.br`

Próximo passo: expor um único helper (ex.: `NFStore.getApiBase()` ou `NFStore.apiUrl()`) para evitar repetir literais em cada módulo.

## Próximos Passos

1) Extrair helper único de API base/normalização e reutilizar nas views.  
2) Remover o fallback do `views.js` legacy quando todas as telas estiverem confirmadas no fluxo novo.  
3) Deduplicar padrões de UI (loading, toasts de erro) em helpers compartilhados.
