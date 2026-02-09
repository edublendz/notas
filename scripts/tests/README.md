# Scripts de Teste - MVP Financeiro

Scripts automatizados para testar funcionalidades críticas da API.

## 📂 Estrutura

```
scripts/tests/
├── README.md                      ← Este arquivo
├── test-rate-limit.ps1            ← Teste de Rate Limiting no Login
├── clear-rate-limit.ps1           ← Limpa arquivos de rate limit (útil para testes)
└── (futuros testes aqui)
```

## 🧹 clear-rate-limit.ps1

Limpa todos os arquivos de rate limiting para resetar os contadores.

**Quando usar:**
- Após testes de rate limiting
- Quando estiver bloqueado e quiser resetar
- Para limpar dados antigos

**Como executar:**
```powershell
cd scripts\tests
powershell -ExecutionPolicy Bypass -File clear-rate-limit.ps1
```

## 🔒 test-rate-limit.ps1

Testa o bloqueio por tentativas excessivas de login (proteção contra brute force).

**O que faz:**
- Faz 12 tentativas de login com credenciais inválidas
- Verifica se as primeiras 10 retornam HTTP 401 (Unauthorized)
- Verifica se 11ª e 12ª retornam HTTP 429 (Too Many Requests - BLOQUEADO)
- Testa login válido e verifica se o contador é resetado
- Mostra os arquivos de rate limit criados em `var/rate_limit/`

**Como executar:**
```powershell
# Certifique-se que a API está rodando
cd apis
php -S 127.0.0.1:8000 -t public

# Em outro terminal, execute:
cd scripts\tests
powershell -ExecutionPolicy Bypass -File test-rate-limit.ps1
```

**Output esperado:**
```
=== Teste de Rate Limiting ===
Fazendo 12 tentativas de login com credenciais invalidas...

Tentativa 1 : HTTP 401 (credenciais invalidas)
Tentativa 2 : HTTP 401 (credenciais invalidas)
...
Tentativa 10 : HTTP 401 (credenciais invalidas)
Tentativa 11 : HTTP 429 (BLOQUEADO!) - {"error":"Muitas tentativas de login..."}
Tentativa 12 : HTTP 429 (BLOQUEADO!) - {"error":"Muitas tentativas de login..."}

=== Verificando arquivos de rate limit ===
Arquivo: rate_c4ca4238a0b923820dcc509a6f75849b.json
Conteudo: {"attempts":12,"window_start":1739144567,"locked_until":1739144867}

=== Testando login valido (deve resetar o contador) ===
Login valido: HTTP 200 - Sucesso!
Arquivo de rate limit deve ter sido deletado.

=== Verificando se arquivo foi deletado ===
Nenhum arquivo encontrado - Rate limit foi resetado com sucesso!
```

---

## 🚀 Próximos Testes (Planejados)

- `test-cors.ps1` - Testa headers CORS e preflight OPTIONS
- `test-jwt.ps1` - Testa geração, validação e expiração de tokens JWT
- `test-multi-tenant.ps1` - Testa isolamento de dados entre tenants
- `test-audit.ps1` - Verifica se logs de auditoria estão sendo criados
- `test-permissions.ps1` - Testa permissões MASTER vs OPERADOR

---

## 📝 Notas de Desenvolvimento

**Requisitos:**
- PHP 8.2+
- PowerShell 5.1+
- Servidor de desenvolvimento rodando na porta 8000

**Problemas Comuns:**

**1. "ExecutionPolicy" bloqueando script:**
```powershell
# Solução: executar com bypass
powershell -ExecutionPolicy Bypass -File test-xxx.ps1
```

**2. Erro "Conexão recusada":**
```powershell
# Solução: iniciar servidor primeiro
cd apis
php -S 127.0.0.1:8000 -t public
```

**3. Rate limit não resetando:**
```powershell
# Solução: deletar arquivos manualmente
Remove-Item apis\var\rate_limit\*.json
```

---

## ✅ Checklist Antes de Deploy

Executar todos os testes e garantir que passem:

- [ ] `test-rate-limit.ps1` - Rate limiting funcionando
- [ ] API health check retorna 200
- [ ] Login com credenciais válidas funcionando
- [ ] Migrations aplicadas corretamente
- [ ] Variáveis de ambiente configuradas (`.env.prod`)

---

## 🤝 Contribuindo

Ao criar novos testes:
1. Use nomenclatura `test-{funcionalidade}.ps1`
2. Adicione output colorido (`Write-Host -ForegroundColor`)
3. Valide status HTTP esperado
4. Mostre mensagens claras de sucesso/falha
5. Atualize este README com instruções do novo teste
