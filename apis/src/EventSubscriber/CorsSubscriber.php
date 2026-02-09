<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Adiciona headers CORS padrão a todas as resposta da API.
 * 
 * Permite requisições de qualquer origem no desenvolvimento,
 * em produção restrinja origins específicas.
 */
class CorsSubscriber implements EventSubscriberInterface
{
    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $response = $event->getResponse();
        $request = $event->getRequest();

        // Definir origem permitida baseado em ambiente
        $allowedOrigin = $this->getAllowedOrigin($request);

        // Headers CORS
        $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        $response->headers->set('Access-Control-Max-Age', '3600'); // Cache preflight por 1 hora
        $response->headers->set('Access-Control-Expose-Headers', 'Content-Length, X-JSON-Response');

        // Para requisições OPTIONS (preflight), retornar 200 vazio
        if ($request->getMethod() === 'OPTIONS') {
            $response->setStatusCode(Response::HTTP_OK);
            $response->setContent('');
        }
    }

    public static function getSubscribedEvents(): array
    {
        // Executar depois de todos os listeners
        return [
            KernelEvents::RESPONSE => ['onKernelResponse', -10]
        ];
    }

    /**
     * Define a origem permitida baseado no ambiente
     */
    private function getAllowedOrigin(\Symfony\Component\HttpFoundation\Request $request): string
    {
        // Em desenvolvimento, permitir localhost
        $env = $_ENV['APP_ENV'] ?? 'dev';
        
        if ($env === 'dev') {
            // Desenvolvimento: aceitar qualquer origin
            $origin = $request->headers->get('Origin', '*');
            return ($origin && $origin !== '*') ? $origin : '*';
        }

        // Produção: whitelist de origins
        $whitelistedOrigins = [
            'https://notas.blendz.com.br',
            'https://api.notas.blendz.com.br',
        ];

        $origin = $request->headers->get('Origin', '');
        
        if (in_array($origin, $whitelistedOrigins, true)) {
            return $origin;
        }

        // Se origin não está na whitelist, retornar origem da requisição
        // (ainda será rejeitada pelo navegador, mas não exponha a lista)
        return 'null';
    }
}
