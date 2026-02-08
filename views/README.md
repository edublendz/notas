# Views Modulares - Estrutura

## Visão Geral

Este diretório contém os módulos de visualização (views) da aplicação, separados por funcionalidade. O objetivo é migrar progressivamente do arquivo monolítico `views.js` (3868 linhas) para módulos menores e mais manuteníveis, **cada um conectado diretamente às APIs**.

## Estrutura Atual

```
views/
├── expenses.js      ✅ Migrado com API completa
├── index.js         ✅ Agregador (sobrescreve NFViews)
└── README.md        📄 Este arquivo
```

## Status de Migração

### ✅ Concluído
- **expenses.js**: Despesas (OSs)
  - `viewExpenses()` - Listagem com filtros, paginação, API
  - `openExpenseForm()` - CRUD completo via API
  - `openServiceForm()` - Gerenciamento de serviços
  - **APIs conectadas:**
    - GET /api/expenses?limit=200
    - GET /api/projects?limit=200
    - GET /api/users?limit=200
    - POST /api/expenses
    - PUT /api/expenses/{id}
    - PATCH /api/expenses/{id}
    - POST /api/expenses/{id}/approve
    - POST /api/expenses/{id}/reject

### ⚠️ Pendente (ainda em views.js)
- **reimbursements.js**: Reembolsos (precisa migrar para API)
- **invoices.js**: Notas fiscais (precisa migrar para API)
- **projects.js**: Projetos (precisa migrar para API)
- **sales.js**: Vendas
- **clients.js**: Clientes
- **users.js**: Usuários
- **dashboard.js**: Dashboard
- **settings.js**: Configurações
- **audit.js**: Auditoria

## Como Funciona

### Carregamento por Camadas

1. **views.js** (original): Carrega todas as views antigas e define `NFViews`
2. **views/expenses.js**: Define `NFViewsExpenses` com funções migradas
3. **views/index.js**: Sobrescreve `NFViews.expenses` com versão da API

### Compatibilidade

O [index.js](index.js) garante que:
- Funções migradas sobrescrevem as antigas
- Funções não migradas continuam funcionando
- `NFViews` permanece como interface unificada
- App.js continua funcionando sem modificações

## Padrões de Implementação

### 1. Estrutura do Módulo

```javascript
// views/exemplo.js
(function (global) {
  "use strict";

  const { NFStore, NFUI } = global;
  
  // Aliases
  const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000'
    : '/apis/public/index.php';
  
  // Funções da view
  function viewExemplo() {
    // Implementação com API
  }
  
  function openExemploForm(id) {
    // Implementação com API  
  }

  // Exporta módulo
  global.NFViewsExemplo = {
    viewExemplo,
    openExemploForm
  };

})(window);
```

### 2. Loading State Animado

```javascript
content.innerHTML = `
  <div class="loading-container">
    <div class="spinner"></div>
    <div class="loading-text">Carregando...</div>
  </div>
`;

const resp = await NFStore.apiFetch(\`\${API_BASE}/api/endpoint\`);
// ... processar dados e renderizar
```

### 3. Normalização de Dados da API

```javascript
const normalized = apiData.map(d => ({
  ...d,
  statusStr: typeof d.status === 'string' 
    ? d.status 
    : (d.status?.name || ""),
  projectIdStr: String(d.project_id || d.projectId || "")
}));
```

### 4. Paginação

```javascript
const itemsPerPage = 50;
const currentPage = DB().ui.modulePage || 1;
const totalPages = Math.ceil(filtered.length / itemsPerPage);
const startIdx = (currentPage - 1) * itemsPerPage;
const paginatedItems = filtered.slice(startIdx, startIdx + itemsPerPage);

// Resetar página ao mudar filtro
$("#filter").onchange = ()=>{ 
  DB().ui.modulePage = 1; 
  saveDB(); 
  viewRouter("module"); 
};
```

### 5. Filtros

```javascript
// UI State no store.js
DB().ui.moduleStatus = "";
DB().ui.moduleProjectId = "";

// Aplicar filtros nos dados normalizados
let filtered = normalized.filter(d => {
  if (qStatus && d.statusStr !== qStatus) return false;
  if (qProject && d.projectIdStr !== String(qProject)) return false;
  return true;
});
```

## Próximos Passos

### 1. Migrar Reimbursements
- Criar `views/reimbursements.js`
- Implementar APIs:
  - GET /api/reimbursements
  - POST /api/reimbursements
  - PUT /api/reimbursements/{id}
  - PATCH /api/reimbursements/{id} (approve/reject)
- Aplicar padrões de loading, paginação, filtros

### 2. Migrar Invoices
- Criar `views/invoices.js`
- Implementar APIs de notas fiscais
- Conectar com expenses (relacionamento)

### 3. Migrar Projects
- Criar `views/projects.js`
- Implementar APIs de projetos
- Dashboard de custos por projeto

### 4. Remover views.js
- Após migrar TODAS as views
- Atualizar index.html para remover `<script src="views.js"></script>`
- Simplificar `views/index.js`

## Benefícios da Modularização

✅ **Manutenibilidade**: Arquivos menores e focados  
✅ **Escalabilidade**: Fácil adicionar novas features  
✅ **Performance**: Carregamento progressivo (futuro)  
✅ **Testabilidade**: Módulos isolados são mais testáveis  
✅ **Colaboração**: Múltiplos devs podem trabalhar em paralelo  
✅ **API-First**: Dados vêm do backend, não do localStorage  

## Convenções

- Usar `NFViews[ModuleName]` para exportar módulos
- Manter compatibilidade com `NFViews` global
- Sempre normalizar dados da API antes de filtrar
- Usar loading animado para UX
- Implementar paginação quando >50 itens
- Resetar página ao mudar filtros
- Usar `String()` para comparar IDs
