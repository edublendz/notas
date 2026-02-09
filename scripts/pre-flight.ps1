# Pre-Flight Check - Deploy Producao
# Valida se todos os requisitos estao prontos

Write-Host "========================================"
Write-Host "  PRE-FLIGHT CHECK - DEPLOY PRODUCAO   "
Write-Host "========================================"
Write-Host ""

$errors = 0

Write-Host "=== ARQUIVOS DE CONFIGURACAO ===" -ForegroundColor Cyan

# .env.prod existe
if (Test-Path "deploy\.env.prod") {
    Write-Host "[OK] .env.prod existe" -ForegroundColor Green
} else {
    Write-Host "[ERRO] .env.prod nao encontrado" -ForegroundColor Red
    $errors++
}

# docker-compose.prod.yml
if (Test-Path "deploy\docker-compose.prod.yml") {
    Write-Host "[OK] docker-compose.prod.yml existe" -ForegroundColor Green
} else {
    Write-Host "[ERRO] docker-compose.prod.yml nao encontrado" -ForegroundColor Red
    $errors++
}

# Dockerfile
if (Test-Path "apis\Dockerfile") {
    Write-Host "[OK] Dockerfile existe" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Dockerfile nao encontrado" -ForegroundColor Red
    $errors++
}

Write-Host ""
Write-Host "=== SEGURANCA ===" -ForegroundColor Cyan

# LoginRateLimiter
if (Test-Path "apis\src\Service\LoginRateLimiter.php") {
    Write-Host "[OK] LoginRateLimiter implementado" -ForegroundColor Green
} else {
    Write-Host "[ERRO] LoginRateLimiter nao encontrado" -ForegroundColor Red
    $errors++
}

# CorsSubscriber
if (Test-Path "apis\src\EventSubscriber\CorsSubscriber.php") {
    Write-Host "[OK] CorsSubscriber implementado" -ForegroundColor Green
} else {
    Write-Host "[ERRO] CorsSubscriber nao encontrado" -ForegroundColor Red
    $errors++
}

Write-Host ""
Write-Host "=== MIGRATIONS ===" -ForegroundColor Cyan

$migrations = Get-ChildItem -Path "apis\migrations" -Filter "*.php" -ErrorAction SilentlyContinue
if ($migrations.Count -ge 4) {
    Write-Host "[OK] $($migrations.Count) migrations encontradas" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Apenas $($migrations.Count) migrations encontradas" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== DOCUMENTACAO ===" -ForegroundColor Cyan

if (Test-Path "PRODUCTION_CHECKLIST.md") {
    Write-Host "[OK] PRODUCTION_CHECKLIST.md criado" -ForegroundColor Green
} else {
    Write-Host "[AVISO] PRODUCTION_CHECKLIST.md nao encontrado" -ForegroundColor Yellow
}

if (Test-Path "apis\SECURITY_IMPLEMENTATION.md") {
    Write-Host "[OK] SECURITY_IMPLEMENTATION.md criado" -ForegroundColor Green
} else {
    Write-Host "[AVISO] SECURITY_IMPLEMENTATION.md nao encontrado" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================"
Write-Host "              RESUMO"
Write-Host "========================================" 
Write-Host ""

if ($errors -eq 0) {
    Write-Host "TUDO PRONTO PARA PRODUCAO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:"
    Write-Host "1. Configurar DNS (notas.blendz.com.br e api.notas.blendz.com.br)"
    Write-Host "2. Acessar servidor: ssh root@172.233.178.166"
    Write-Host "3. Fazer upload do codigo"
    Write-Host "4. Seguir PRODUCTION_CHECKLIST.md"
    Write-Host ""
} else {
    Write-Host "ERROS ENCONTRADOS: $errors" -ForegroundColor Red
    Write-Host "Corrija os erros antes de fazer deploy!"
    Write-Host ""
}
