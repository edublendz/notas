# Script de teste para Rate Limiting
# Faz 12 tentativas de login com credenciais inválidas
# Esperado: 10 tentativas com 401, 11ª e 12ª com 429

Write-Host "=== Teste de Rate Limiting ===" -ForegroundColor Cyan
Write-Host "Fazendo 12 tentativas de login com credenciais invalidas..." -ForegroundColor Yellow
Write-Host ""

$url = "http://localhost:8000/api/auth/login"
$body = @{
    email = "fake@test.com"
    password = "wrong"
} | ConvertTo-Json

for ($i = 1; $i -le 12; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction SilentlyContinue

        Write-Host "Tentativa $i : HTTP $($response.StatusCode) - $($response.Content)" -ForegroundColor Green
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $_.ErrorDetails.Message
        
        if ($statusCode -eq 429) {
            Write-Host "Tentativa $i : HTTP 429 (BLOQUEADO!) - $errorBody" -ForegroundColor Red
        }
        elseif ($statusCode -eq 401) {
            Write-Host "Tentativa $i : HTTP 401 (credenciais invalidas)" -ForegroundColor Yellow
        }
        else {
            Write-Host "Tentativa $i : HTTP $statusCode - $errorBody" -ForegroundColor Magenta
        }
    }
    
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "=== Verificando arquivos de rate limit ===" -ForegroundColor Cyan
Get-ChildItem -Path "apis\var\rate_limit\*.json" | ForEach-Object {
    Write-Host "Arquivo: $($_.Name)" -ForegroundColor Yellow
    Write-Host "Conteudo: $(Get-Content $_.FullName)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Testando login valido (deve resetar o contador) ===" -ForegroundColor Cyan
$validBody = @{
    email = "master@corp.com"
    password = "123456"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $url -Method POST `
        -ContentType "application/json" `
        -Body $validBody `
        -UseBasicParsing

    Write-Host "Login valido: HTTP $($response.StatusCode) - Sucesso!" -ForegroundColor Green
    Write-Host "Arquivo de rate limit deve ter sido deletado." -ForegroundColor Green
}
catch {
    Write-Host "Login valido falhou: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Verificando se arquivo foi deletado ===" -ForegroundColor Cyan
$files = Get-ChildItem -Path "apis\var\rate_limit\*.json" -ErrorAction SilentlyContinue
if ($files.Count -eq 0) {
    Write-Host "Nenhum arquivo encontrado - Rate limit foi resetado com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "Ainda existem $($files.Count) arquivo(s):" -ForegroundColor Yellow
    $files | ForEach-Object { Write-Host "  - $($_.Name)" }
}
