# Script para limpar arquivos de rate limiting
# Útil para resetar os testes

Write-Host "=== Limpando arquivos de Rate Limit ===" -ForegroundColor Cyan

$rateLimitDir = "apis\var\rate_limit"
$files = Get-ChildItem -Path $rateLimitDir -Filter "*.json" -ErrorAction SilentlyContinue

if ($files.Count -eq 0) {
    Write-Host "Nenhum arquivo de rate limit encontrado." -ForegroundColor Green
}
else {
    Write-Host "Encontrados $($files.Count) arquivo(s):" -ForegroundColor Yellow
    foreach ($file in $files) {
        Write-Host "  - Deletando: $($file.Name)" -ForegroundColor Gray
        Remove-Item $file.FullName -Force
    }
    Write-Host "Todos os arquivos de rate limit foram deletados!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Rate limit resetado. Você pode fazer novas tentativas de login." -ForegroundColor Cyan
