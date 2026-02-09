# Scripts Utilitários - MVP Financeiro

Pasta para scripts de automação, testes e utilitários do projeto.

## 📂 Estrutura

```
scripts/
├── README.md           ← Este arquivo
├── tests/              ← Testes automatizados (API, rate limiting, CORS, etc)
└── deploy/             ← Scripts de deploy e manutenção (futuro)
```

## 📁 Subpastas

### `tests/`
Scripts de teste automatizados para validar funcionalidades da API.
- Ver [tests/README.md](tests/README.md) para detalhes

### `deploy/` (planejado)
Scripts de deploy, backup, migrations e manutenção.

---

## 🚀 Como Usar

```powershell
# Executar testes
cd scripts\tests
powershell -ExecutionPolicy Bypass -File test-rate-limit.ps1

# (futuro) Deploy
cd scripts\deploy
.\deploy-production.ps1
```

---

## 📝 Convenções

**Nomenclatura:**
- `test-*.ps1` - Scripts de teste
- `deploy-*.ps1` - Scripts de deploy
- `backup-*.ps1` - Scripts de backup
- `util-*.ps1` - Utilitários diversos

**Padronização:**
- Usar PowerShell para automação no Windows
- Usar Bash para automação no Linux/Docker
- Sempre incluir comentários explicativos
- Output colorido para facilitar leitura
