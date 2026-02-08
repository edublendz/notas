<?php

namespace App\EventSubscriber;

use App\Service\JwtTokenProvider;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class AuthenticationSubscriber implements EventSubscriberInterface
{
    private JwtTokenProvider $tokenProvider;

    // Rotas que NÃO precisam de autenticação
    private array $publicRoutes = [
        '/api/health',
        '/api/auth/login',
        '/api/auth/refresh',
        '/api/public/', // Rotas públicas (convites, etc)
    ];

    public function __construct(JwtTokenProvider $tokenProvider)
    {
        $this->tokenProvider = $tokenProvider;
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();

        // Pular validação para rotas públicas
        if ($this->isPublicRoute($path)) {
            return;
        }

        // Pular validação para OPTIONS requests (CORS preflight)
        if ($request->getMethod() === 'OPTIONS') {
            return;
        }

        $authHeader = $request->headers->get('Authorization', '');

        if (empty($authHeader)) {
            $event->setResponse(new JsonResponse(
                ['error' => 'Token de autenticação não fornecido'],
                Response::HTTP_UNAUTHORIZED
            ));
            return;
        }

        $token = JwtTokenProvider::extractToken($authHeader);

        if (!$token) {
            $event->setResponse(new JsonResponse(
                ['error' => 'Formato inválido do token Authorization'],
                Response::HTTP_UNAUTHORIZED
            ));
            return;
        }

        $claims = $this->tokenProvider->validateToken($token);

        if (!$claims) {
            $event->setResponse(new JsonResponse(
                ['error' => 'Token inválido ou expirado'],
                Response::HTTP_UNAUTHORIZED
            ));
            return;
        }

        // Armazenar claims na request para uso posterior
        $request->attributes->set('user_claims', $claims);
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => 'onKernelRequest',
        ];
    }

    private function isPublicRoute(string $path): bool
    {
        foreach ($this->publicRoutes as $publicRoute) {
            if (strpos($path, $publicRoute) === 0) {
                return true;
            }
        }
        return false;
    }
}
