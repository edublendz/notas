<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\User;
use App\Entity\UserTenant;
use App\Entity\UserPreference;
use App\Service\JwtTokenProvider;
use App\Service\PasswordHasher;
use App\Service\AuditService;
use App\Service\LoginRateLimiter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/auth', name: 'api_auth_')]
class AuthController extends BaseController
{
    private JwtTokenProvider $tokenProvider;
    private PasswordHasher $passwordHasher;
    private AuditService $auditService;
    private LoginRateLimiter $rateLimiter;

    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        JwtTokenProvider $tokenProvider,
        PasswordHasher $passwordHasher,
        AuditService $auditService,
        LoginRateLimiter $rateLimiter
    ) {
        parent::__construct($entityManager, $serializer);
        $this->tokenProvider = $tokenProvider;
        $this->passwordHasher = $passwordHasher;
        $this->auditService = $auditService;
        $this->rateLimiter = $rateLimiter;
    }

    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        // ===== Rate Limiting =====
        $rateLimitCheck = $this->rateLimiter->checkLimit($request);
        if (!$rateLimitCheck['allowed']) {
            return new JsonResponse(
                ['error' => $rateLimitCheck['message']],
                Response::HTTP_TOO_MANY_REQUESTS
            );
        }

        $data = $this->getJsonBody($request);

        if (empty($data['email']) || empty($data['password'])) {
            $this->rateLimiter->recordAttempt($request);
            return $this->validationErrorResponse([
                'email' => empty($data['email']) ? 'Email é obrigatório' : null,
                'password' => empty($data['password']) ? 'Senha é obrigatória' : null,
            ]);
        }

        $user = $this->entityManager->getRepository(User::class)->findByEmail($data['email']);

        if (!$user) {
            $this->rateLimiter->recordAttempt($request);
            return $this->errorResponse('Email ou senha inválidos', Response::HTTP_UNAUTHORIZED);
        }

        // Validar senha com bcrypt
        if (!$this->passwordHasher->verify($user, $data['password'])) {
            $this->rateLimiter->recordAttempt($request);
            return $this->errorResponse('Email ou senha inválidos', Response::HTTP_UNAUTHORIZED);
        }

        // Bloquear usuários com status PENDING
        if ($user->getStatus()->getCode() === 'PENDING') {
            $this->rateLimiter->recordAttempt($request);
            return $this->errorResponse('Seu cadastro está aguardando aprovação. Entre em contato com o administrador.', Response::HTTP_FORBIDDEN);
        }

        // Se senha precisa upgrade (SHA256 -> bcrypt), atualizar no banco
        if ($this->passwordHasher->needsRehash($user->getPasswordHash())) {
          $user->setPasswordHash($this->passwordHasher->hash($user, $data['password']));
            $this->entityManager->flush();
        }

        // Buscar primeiro tenant do usuário
        $userTenantRepo = $this->entityManager->getRepository(UserTenant::class);
        // Nota: UserTenant tem chave primária composta (user_id, tenant_id), sem campo 'id'
        $userTenants = $userTenantRepo->findBy(['user' => $user], [], 1);
        
        $selectedTenant = null;
        if (!empty($userTenants)) {
            $selectedTenant = $userTenants[0]->getTenant();
        }

        // Atualizar ou criar UserPreference com o selected_tenant
        if ($selectedTenant) {
            try {
                $prefRepo = $this->entityManager->getRepository(UserPreference::class);
                $preference = $prefRepo->findOneBy(['user' => $user]);
                
                $isNew = false;
                if (!$preference) {
                    $preference = new UserPreference();
                    $preference->setUser($user);
                    $isNew = true;
                }
                
                $preference->setSelectedTenant($selectedTenant);
                $preference->setUpdatedAt(new \DateTime());
                
                $this->entityManager->persist($preference);
                $this->entityManager->flush();
                
                error_log("[AuthController] UserPreference " . ($isNew ? "created" : "updated") . " for user: " . $user->getEmail() . " with tenant: " . $selectedTenant->getName());
            } catch (\Exception $e) {
                error_log("[AuthController] Error saving UserPreference: " . $e->getMessage());
                error_log("[AuthController] Stack trace: " . $e->getTraceAsString());
            }
        } else {
            error_log("[AuthController] No tenant found for user: " . $user->getEmail());
        }

        $token = $this->tokenProvider->generateToken($user);

        // Registrar login na auditoria
        $this->auditService->logLogin($user, $data['email']);

        // ===== Rate Limiting: Resetar tentativas após login bem-sucedido =====
        $this->rateLimiter->resetAttempts($request);

        return $this->jsonResponse([
            'token' => $token,
            'user' => [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'role' => $user->getRole()->getCode(),
            ],
            'selectedTenant' => $selectedTenant ? [
                'id' => $selectedTenant->getId(),
                'name' => $selectedTenant->getName(),
            ] : null,
            'expiresIn' => 3600, // 1 hora em segundos
        ]);
    }

    #[Route('/refresh', name: 'refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        $authHeader = $request->headers->get('Authorization', '');
        $token = JwtTokenProvider::extractToken($authHeader);

        if (!$token) {
            return $this->errorResponse('Token não fornecido', Response::HTTP_UNAUTHORIZED);
        }

        $claims = $this->tokenProvider->validateToken($token);

        if (!$claims) {
             
            return $this->errorResponse('Token inválido ou expirado', Response::HTTP_UNAUTHORIZED);
        }

        $user = $this->entityManager->getRepository(User::class)->find($claims['uid']);

        if (!$user) {
            return $this->errorResponse('Usuário não encontrado', Response::HTTP_NOT_FOUND);
        }

        $newToken = $this->tokenProvider->generateToken($user);

        return $this->jsonResponse([
            'token' => $newToken,
            'expiresIn' => 3600,
        ]);
    }

    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(Request $request): JsonResponse
    {
        $authHeader = $request->headers->get('Authorization', '');
        $token = JwtTokenProvider::extractToken($authHeader);

        if (!$token) {
            return $this->errorResponse('Token não fornecido', Response::HTTP_UNAUTHORIZED);
        }

        $claims = $this->tokenProvider->validateToken($token);

        if (!$claims) {
            return $this->errorResponse('Token inválido ou expirado', Response::HTTP_UNAUTHORIZED);
        }

        $user = $this->entityManager->getRepository(User::class)->find($claims['uid']);

        if (!$user) {
            return $this->errorResponse('Usuário não encontrado', Response::HTTP_NOT_FOUND);
        }

        return $this->jsonResponse([
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'role' => $user->getRole()->getCode(),
            'active' => $user->isActive(),
            'createdAt' => $user->getCreatedAt()?->format('Y-m-d H:i:s'),
        ]);
    }
}
