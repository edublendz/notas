<?php

namespace App\Controller\Api;

use App\Controller\BaseController;
use App\Entity\Tenant;
use App\Entity\User;
use App\Entity\UserTenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/tenants', name: 'api_tenants_')]
class TenantController extends BaseController
{
    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer
    ) {
        parent::__construct($entityManager, $serializer);
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->errorResponse('Usuário não autenticado', Response::HTTP_UNAUTHORIZED);
        }

        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(100, $request->query->getInt('limit', 20));

        // Query only tenants this user has access to
        $queryBuilder = $this->entityManager->getRepository(Tenant::class)
            ->createQueryBuilder('t')
            ->innerJoin(UserTenant::class, 'ut', 'WITH', 'ut.tenant = t.id')
            ->innerJoin(User::class, 'u', 'WITH', 'ut.user = u.id')
            ->where('u.id = :uid')
            ->setParameter('uid', $uid)
            ->orderBy('t.createdAt', 'DESC');

        $total = count($queryBuilder->getQuery()->getResult());
        $tenants = (clone $queryBuilder)
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        $data = array_map(fn($t) => [
            'id' => $t->getId(),
            'key' => $t->getKey(),
            'name' => $t->getName(),
            'doc' => $t->getDoc(),
            'indicatorPct' => $t->getIndicatorPct(),
            'requireProjectLink' => $t->isRequireProjectLink(),
            'createdAt' => $t->getCreatedAt()?->format('Y-m-d H:i:s'),
            'updatedAt' => $t->getUpdatedAt()?->format('Y-m-d H:i:s'),
        ], $tenants);

        return $this->jsonResponse([
            'data' => $data,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total]
        ]);
    }

    #[Route('/settings', name: 'get_settings', methods: ['GET'])]
    public function getSettings(Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->errorResponse('Não autenticado', Response::HTTP_UNAUTHORIZED);
        }

        // Get user
        $user = $this->entityManager->getRepository(User::class)->find($uid);
        if (!$user) {
            return $this->errorResponse('Usuário não encontrado', Response::HTTP_NOT_FOUND);
        }

        // Get tenant from first UserTenant relationship
        $userTenants = $user->getTenants();
        if ($userTenants->isEmpty()) {
            return $this->errorResponse('Usuário sem tenant associado', Response::HTTP_BAD_REQUEST);
        }

        $tenant = $userTenants->first()->getTenant();

        return $this->jsonResponse([
            'id' => $tenant->getId(),
            'name' => $tenant->getName(),
            'indicatorPct' => (float)$tenant->getIndicatorPct(),
            'requireProjectLink' => $tenant->isRequireProjectLink(),
        ]);
    }

    #[Route('/settings', name: 'update_settings', methods: ['PUT'])]
    public function updateSettings(Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->errorResponse('Não autenticado', Response::HTTP_UNAUTHORIZED);
        }

        // Get user
        $user = $this->entityManager->getRepository(User::class)->find($uid);
        if (!$user) {
            return $this->errorResponse('Usuário não encontrado', Response::HTTP_NOT_FOUND);
        }

        // Get tenant from first UserTenant relationship
        $userTenants = $user->getTenants();
        if ($userTenants->isEmpty()) {
            return $this->errorResponse('Usuário sem tenant associado', Response::HTTP_BAD_REQUEST);
        }

        $tenant = $userTenants->first()->getTenant();

        $data = $this->getJsonBody($request);

        if (isset($data['indicatorPct'])) {
            $pct = (float)$data['indicatorPct'];
            if ($pct < 0 || $pct > 1) {
                return $this->errorResponse('indicatorPct deve estar entre 0 e 1', Response::HTTP_BAD_REQUEST);
            }
            $tenant->setIndicatorPct((string)$pct);
        }

        if (isset($data['requireProjectLink'])) {
            $tenant->setRequireProjectLink((bool)$data['requireProjectLink']);
        }

        $this->entityManager->flush();

        return $this->jsonResponse([
            'message' => 'Configurações atualizadas com sucesso',
            'settings' => [
                'indicatorPct' => (float)$tenant->getIndicatorPct(),
                'requireProjectLink' => $tenant->isRequireProjectLink(),
            ],
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id, Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->errorResponse('Usuário não autenticado', Response::HTTP_UNAUTHORIZED);
        }

        $tenant = $this->entityManager->getRepository(Tenant::class)->find($id);
        
        if (!$tenant) {
            return $this->notFoundResponse('Tenant não encontrado');
        }

        // Verify user has access to this tenant
        $userTenant = $this->entityManager->getRepository(UserTenant::class)
            ->findOne(['user' => $uid, 'tenant' => $id]);
        
        if (!$userTenant) {
            return $this->forbiddenResponse('Acesso negado a este tenant');
        }

        return $this->jsonResponse([
            'id' => $tenant->getId(),
            'key' => $tenant->getKey(),
            'name' => $tenant->getName(),
            'doc' => $tenant->getDoc(),
            'indicatorPct' => $tenant->getIndicatorPct(),
            'requireProjectLink' => $tenant->isRequireProjectLink(),
            'createdAt' => $tenant->getCreatedAt()?->format('Y-m-d H:i:s'),
            'updatedAt' => $tenant->getUpdatedAt()?->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = $this->getJsonBody($request);
        
        if (empty($data['key']) || empty($data['name'])) {
            return $this->validationErrorResponse([
                'key' => empty($data['key']) ? 'Key é obrigatória' : null,
                'name' => empty($data['name']) ? 'Name é obrigatório' : null,
            ]);
        }

        $tenant = new Tenant();
        $tenant->setKey($data['key']);
        $tenant->setName($data['name']);
        $tenant->setDoc($data['doc'] ?? null);
        $tenant->setIndicatorPct($data['indicatorPct'] ?? '0.0000');
        $tenant->setRequireProjectLink($data['requireProjectLink'] ?? false);

        $this->entityManager->persist($tenant);
        $this->entityManager->flush();

        return $this->createdResponse([
            'id' => $tenant->getId(),
            'key' => $tenant->getKey(),
            'name' => $tenant->getName(),
            'doc' => $tenant->getDoc(),
            'indicatorPct' => $tenant->getIndicatorPct(),
            'requireProjectLink' => $tenant->isRequireProjectLink(),
            'createdAt' => $tenant->getCreatedAt()?->format('Y-m-d H:i:s'),
            'updatedAt' => $tenant->getUpdatedAt()?->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->errorResponse('Usuário não autenticado', Response::HTTP_UNAUTHORIZED);
        }

        $tenant = $this->entityManager->getRepository(Tenant::class)->find($id);
        if (!$tenant) {
            return $this->notFoundResponse('Tenant não encontrado');
        }

        // Verify user has access to this tenant
        $userTenant = $this->entityManager->getRepository(UserTenant::class)
            ->findOne(['user' => $uid, 'tenant' => $id]);
        
        if (!$userTenant) {
            return $this->forbiddenResponse('Acesso negado a este tenant');
        }

        $data = $this->getJsonBody($request);
        
        if (isset($data['name'])) {
            $tenant->setName($data['name']);
        }
        if (isset($data['doc'])) {
            $tenant->setDoc($data['doc']);
        }
        if (isset($data['indicatorPct'])) {
            $tenant->setIndicatorPct((string) $data['indicatorPct']);
        }
        if (isset($data['requireProjectLink'])) {
            $tenant->setRequireProjectLink((bool) $data['requireProjectLink']);
        }

        $this->entityManager->flush();

        return $this->jsonResponse([
            'id' => $tenant->getId(),
            'key' => $tenant->getKey(),
            'name' => $tenant->getName(),
            'doc' => $tenant->getDoc(),
            'indicatorPct' => $tenant->getIndicatorPct(),
            'requireProjectLink' => $tenant->isRequireProjectLink(),
            'createdAt' => $tenant->getCreatedAt()?->format('Y-m-d H:i:s'),
            'updatedAt' => $tenant->getUpdatedAt()?->format('Y-m-d H:i:s'),
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $uid = $this->getCurrentUserId($request);
        if (!$uid) {
            return $this->errorResponse('Usuário não autenticado', Response::HTTP_UNAUTHORIZED);
        }

        $tenant = $this->entityManager->getRepository(Tenant::class)->find($id);
        if (!$tenant) {
            return $this->notFoundResponse('Tenant não encontrado');
        }

        // Verify user has access to this tenant
        $userTenant = $this->entityManager->getRepository(UserTenant::class)
            ->findOne(['user' => $uid, 'tenant' => $id]);
        
        if (!$userTenant) {
            return $this->forbiddenResponse('Acesso negado a este tenant');
        }

        $this->entityManager->remove($tenant);
        $this->entityManager->flush();

        return $this->jsonResponse(['message' => 'Tenant deletado com sucesso']);
    }
}
