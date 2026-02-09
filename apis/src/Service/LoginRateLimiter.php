<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\Request;

/**
 * Limita o número de tentativas de login por IP para prevenir brute force attacks.
 * 
 * Configuração:
 * - Máximo 10 tentativas por IP em 15 minutos
 * - Bloqueio de 5 minutos após atingir o limite
 * 
 * Armazenamento: Sistema de arquivos (var/rate_limit/)
 */
class LoginRateLimiter
{
    private const MAX_ATTEMPTS = 10;
    private const WINDOW_SECONDS = 900; // 15 minutos
    private const LOCKOUT_SECONDS = 300; // 5 minutos
    private string $storageDir;

    public function __construct(string $projectDir)
    {
        $this->storageDir = $projectDir . '/var/rate_limit';
        
        // Criar diretório se não existir
        if (!is_dir($this->storageDir)) {
            @mkdir($this->storageDir, 0777, true);
        }
        
        // Limpar entradas antigas
        $this->cleanOldEntries();
    }

    /**
     * Verifica se o IP está bloqueado por rate limit
     * 
     * @return array ['allowed' => bool, 'message' => string, 'retryAfter' => ?int]
     */
    public function checkLimit(Request $request): array
    {
        $ip = $this->getClientIp($request);
        $now = time();
        
        $data = $this->loadData($ip);

        // Se não há registro de tentativas, permitir
        if (!$data) {
            return ['allowed' => true];
        }

        // Se está em lockout e ainda não expirou
        if (isset($data['locked_until']) && $data['locked_until'] > $now) {
            $retryAfter = $data['locked_until'] - $now;
            return [
                'allowed' => false,
                'message' => "Muitas tentativas de login. Tente novamente em {$retryAfter} segundos.",
                'retryAfter' => $retryAfter
            ];
        }

        // Se a janela de tempo expirou, resetar
        if ($data['window_start'] + self::WINDOW_SECONDS < $now) {
            $this->deleteData($ip);
            return ['allowed' => true];
        }

        // Ainda dentro da janela
        if ($data['attempts'] >= self::MAX_ATTEMPTS) {
            // Bloquear por LOCKOUT_SECONDS
            $data['locked_until'] = $now + self::LOCKOUT_SECONDS;
            $this->saveData($ip, $data);
            return [
                'allowed' => false,
                'message' => "Muitas tentativas de login. Tente novamente em " . self::LOCKOUT_SECONDS . " segundos.",
                'retryAfter' => self::LOCKOUT_SECONDS
            ];
        }

        return ['allowed' => true];
    }

    /**
     * Registra uma tentativa de login
     */
    public function recordAttempt(Request $request): void
    {
        $ip = $this->getClientIp($request);
        $now = time();

        $data = $this->loadData($ip);

        if (!$data) {
            $data = [
                'attempts' => 0,
                'window_start' => $now,
            ];
        }

        // Incrementar tentativas
        $data['attempts']++;
        
        $this->saveData($ip, $data);
    }

    /**
     * Resetar tentativas após login bem-sucedido
     */
    public function resetAttempts(Request $request): void
    {
        $ip = $this->getClientIp($request);
        $this->deleteData($ip);
    }

    /**
     * Extrai o IP real da requisição (suporta proxies)
     */
    private function getClientIp(Request $request): string
    {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            // Pega o primeiro IP da lista (pode ter múltiplos)
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
        return $request->getClientIp() ?? '127.0.0.1';
    }

    /**
     * Remove entradas expiradas para evitar crescimento indefinido
     */
    private function cleanOldEntries(): void
    {
        if (!is_dir($this->storageDir)) {
            return;
        }

        $now = time();
        $files = glob($this->storageDir . '/rate_*.json');
        
        foreach ($files as $file) {
            // Deletar arquivos mais antigos que 2 horas
            if (filemtime($file) < $now - 7200) {
                @unlink($file);
            }
        }
    }

    /**
     * Carrega dados do arquivo para um IP
     */
    private function loadData(string $ip): ?array
    {
        $filename = $this->getFilename($ip);
        
        if (!file_exists($filename)) {
            return null;
        }

        $content = @file_get_contents($filename);
        if ($content === false) {
            return null;
        }

        $data = json_decode($content, true);
        return is_array($data) ? $data : null;
    }

    /**
     * Salva dados no arquivo para um IP
     */
    private function saveData(string $ip, array $data): void
    {
        $filename = $this->getFilename($ip);
        @file_put_contents($filename, json_encode($data), LOCK_EX);
    }

    /**
     * Deleta dados do arquivo para um IP
     */
    private function deleteData(string $ip): void
    {
        $filename = $this->getFilename($ip);
        @unlink($filename);
    }

    /**
     * Gera nome de arquivo baseado no IP (hash para evitar problemas com IPv6)
     */
    private function getFilename(string $ip): string
    {
        $hash = md5($ip);
        return $this->storageDir . '/rate_' . $hash . '.json';
    }
}
